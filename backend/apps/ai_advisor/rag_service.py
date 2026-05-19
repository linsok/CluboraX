import logging
import os
import threading
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RAGResult:
    answer: str
    kind: str  # retrieved | generated | refused | error
    distance: Optional[float] = None
    contexts: Optional[List[str]] = None


class RAGChatService:
    """Hybrid RAG chat service backed by ChromaDB + BGE embeddings + optional Ollama.

    This is designed to be safe to import even when heavy dependencies (torch/transformers)
    are not installed: it will fall back to `available=False`.
    """

    _init_lock = threading.Lock()
    _initialized = False
    _initializing = False

    _chromadb = None
    _collection = None

    _torch = None
    _tokenizer = None
    _model = None
    _device = None

    _ollama = None

    def __init__(self):
        self.available = False
        self._ensure_initialized(background=True)

    @staticmethod
    def _get_setting(name: str, default: Any) -> Any:
        return getattr(settings, name, os.environ.get(name, default))

    def _ensure_initialized(self, background: bool = False) -> None:
        if self.__class__._initialized:
            self.available = self.__class__._collection is not None and self.__class__._model is not None
            return

        if background:
            with self.__class__._init_lock:
                if self.__class__._initialized:
                    self.available = self.__class__._collection is not None and self.__class__._model is not None
                    return
                if self.__class__._initializing:
                    self.available = False
                    return

                self.__class__._initializing = True
                t = threading.Thread(target=self._ensure_initialized, kwargs={'background': False}, daemon=True)
                t.start()
                self.available = False
                return

        with self.__class__._init_lock:
            if self.__class__._initialized:
                self.available = self.__class__._collection is not None and self.__class__._model is not None
                return

            chroma_path = self._get_setting(
                'AI_CHAT_CHROMA_PATH',
                str(getattr(settings, 'BASE_DIR', '')),
            )
            collection_name = self._get_setting('AI_CHAT_COLLECTION', 'event_qa')
            embedding_model_name = self._get_setting('AI_CHAT_EMBED_MODEL', 'BAAI/bge-base-en-v1.5')

            try:
                import chromadb  # type: ignore

                self.__class__._chromadb = chromadb
                client = chromadb.PersistentClient(path=chroma_path)
                self.__class__._collection = client.get_or_create_collection(collection_name)
            except Exception as e:
                logger.warning(f"RAG disabled: failed to init ChromaDB (path={chroma_path}): {e}")
                self.__class__._collection = None

            try:
                import torch  # type: ignore
                from transformers import AutoModel, AutoTokenizer  # type: ignore

                self.__class__._torch = torch
                self.__class__._device = 'cuda' if torch.cuda.is_available() else 'cpu'
                tokenizer = AutoTokenizer.from_pretrained(embedding_model_name)
                model = AutoModel.from_pretrained(embedding_model_name)
                model.eval()
                model.to(self.__class__._device)
                self.__class__._tokenizer = tokenizer
                self.__class__._model = model
            except Exception as e:
                logger.warning(f"RAG disabled: failed to init embedding model ({embedding_model_name}): {e}")
                self.__class__._tokenizer = None
                self.__class__._model = None

            use_ollama = bool(self._get_setting('AI_CHAT_USE_OLLAMA', True))
            if use_ollama:
                try:
                    import ollama  # type: ignore

                    self.__class__._ollama = ollama
                except Exception as e:
                    logger.info(f"Ollama not available (LLM fallback disabled): {e}")
                    self.__class__._ollama = None

            self.__class__._initialized = True
            self.__class__._initializing = False
            self.available = self.__class__._collection is not None and self.__class__._model is not None

    @classmethod
    def _embed_query(cls, query: str) -> List[float]:
        torch = cls._torch
        tokenizer = cls._tokenizer
        model = cls._model
        if torch is None or tokenizer is None or model is None:
            raise RuntimeError('Embedding model not initialized')

        # BGE retrieval instruction for queries
        text = f"Represent this sentence for searching relevant passages: {query}"
        inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=512)
        inputs = {k: v.to(cls._device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = model(**inputs)
            embeddings = outputs.last_hidden_state.mean(dim=1)
            embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
        return embeddings[0].detach().cpu().numpy().tolist()

    @classmethod
    def _ollama_generate(cls, query: str, context_docs: List[str]) -> str:
        ollama = cls._ollama
        if ollama is None:
            raise RuntimeError('Ollama not available')

        ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        client = ollama.Client(host=ollama_host)

        model_name = getattr(settings, 'AI_CHAT_OLLAMA_MODEL', os.environ.get('AI_CHAT_OLLAMA_MODEL', 'gemma3:1b'))
        temperature = float(getattr(settings, 'AI_CHAT_TEMPERATURE', os.environ.get('AI_CHAT_TEMPERATURE', 0.3)))

        def _clean_doc(doc: str) -> str:
            """Strip Q&A file header lines that leak into Ollama context."""
            lines = doc.splitlines()
            cleaned = [
                line for line in lines
                if not line.strip().startswith("Campus Event and Club Management System")
                and not line.strip().startswith("Club-related")
                and not line.strip().startswith("Event-related")
                and not line.strip().startswith("Registration,")
            ]
            return "\n".join(cleaned).strip()

        context = "\n\n".join([f"Context {i + 1}:\n{_clean_doc(doc)}" for i, doc in enumerate(context_docs)])
        prompt = (
            f"Context from knowledge base:\n{context}\n\n"
            f"Question: {query}\n\n"
            "Answer:"
        )

        resp = client.chat(
            model=model_name,
            messages=[
                {
                    'role': 'system',
                    'content': (
                        'You are an AI advisor for CluboraX, a university club and event management system.\n\n'
                        'Answer ONLY using the provided context. Follow these rules strictly:\n'
                        '- Do NOT use outside knowledge or make assumptions.\n'
                        '- Do NOT guess or infer missing information.\n'
                        '- Keep answers concise and direct.\n'
                        '- If the context does not contain the answer, reply with exactly:\n'
                        '  "I don\'t have information about that. Please try rephrasing your question."\n'
                        '- If the question is completely unrelated to university events, clubs,\n'
                        '  registration, proposals, or campus activities, reply with exactly:\n'
                        '  "I can only answer questions about CluboraX — events, clubs, and campus management."'
                    ),
                },
                {'role': 'user', 'content': prompt},
            ],
            options={
                'temperature': temperature,
                'top_p': 0.9,
                'num_predict': 250,
            },
        )

        return (resp.get('message') or {}).get('content', '').strip()

    def answer(self, query: str) -> RAGResult:
        """Return an answer for the given query using hybrid RAG."""
        if not self.available:
            return RAGResult(
                answer='RAG engine is not available on this server.',
                kind='error',
            )

        threshold_high = float(self._get_setting('AI_CHAT_DISTANCE_HIGH_CONF', 0.5))
        threshold_medium = float(self._get_setting('AI_CHAT_DISTANCE_MED_CONF', 0.75))
        off_topic_threshold = float(self._get_setting('AI_CHAT_OFF_TOPIC_THRESHOLD', 1.2))
        use_ollama = bool(self._get_setting('AI_CHAT_USE_OLLAMA', True))

        try:
            query_emb = self._embed_query(query)
            results = self.__class__._collection.query(
                query_embeddings=[query_emb],
                n_results=3,
                include=['documents', 'distances'],
            )
            docs: List[str] = (results.get('documents') or [[]])[0] or []
            dists: List[float] = (results.get('distances') or [[]])[0] or []

            if not docs or not dists:
                return RAGResult(
                    answer="Sorry, I don't have enough information to answer that.",
                    kind='refused',
                )

            distance = float(dists[0])
            top_doc = docs[0]

            # Off-topic guard: if the best match is still very far away, refuse immediately.
            if distance > off_topic_threshold:
                return RAGResult(
                    answer='I can only answer questions about CluboraX — events, clubs, and campus management.',
                    kind='refused',
                    distance=distance,
                )

            # Tier 1: direct retrieval
            if distance < threshold_high:
                answer = top_doc.split('\n', 1)[-1] if '\n' in top_doc else top_doc
                answer = answer.lstrip('A:').strip()
                return RAGResult(answer=answer, kind='retrieved', distance=distance, contexts=docs)

            # Tier 2: LLM fallback with contexts
            if distance < threshold_medium and use_ollama and self.__class__._ollama is not None:
                generated = self._ollama_generate(query, docs[:3])
                if generated:
                    return RAGResult(answer=generated, kind='generated', distance=distance, contexts=docs)

            # Tier 3: refuse if low confidence
            return RAGResult(
                answer="I don't have information about that. Please try rephrasing your question.",
                kind='refused',
                distance=distance,
                contexts=docs,
            )

        except Exception as e:
            logger.exception(f"RAG answer failed: {e}")
            return RAGResult(
                answer='Chat service failed. Please try again later.',
                kind='error',
            )
