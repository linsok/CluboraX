import logging
import os
import re
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

    _ANSWER_PREFIX_RE = re.compile(r'^\s*(?:A|Answer)\s*:\s*', re.IGNORECASE)
    _ANSWER_MARKER_RE = re.compile(r'(?:^|\n)\s*(?:A|Answer)\s*:\s*', re.IGNORECASE)
    _NEXT_QUESTION_RE = re.compile(r'(?im)^\s*Q\s*\d+\.|^\s*Q\d+\.|^\s*Q\s*:|^\s*Q:')

    @classmethod
    def _clean_answer_text(cls, text: str) -> str:
        if not text:
            return ''
        cleaned = text.strip()
        cleaned = cls._ANSWER_PREFIX_RE.sub('', cleaned)
        return cleaned.strip()

    @classmethod
    def _extract_first_answer_block(cls, doc: str) -> str:
        """Extract the first answer block from a Q&A chunk.

        Many of our embedded chunks contain multiple Q/A pairs. We want the response
        to include only the first answer (after the first A:/Answer: marker) and not
        leak subsequent Q2/Q3 blocks (which may contain additional `A:` markers).
        """
        if not doc:
            return ''

        m = cls._ANSWER_MARKER_RE.search(doc)
        if m:
            answer = doc[m.end():]
        else:
            answer = doc

        next_q = cls._NEXT_QUESTION_RE.search(answer)
        if next_q:
            answer = answer[:next_q.start()]

        return cls._clean_answer_text(answer)

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
                device_setting = self._get_setting('AI_CHAT_EMBED_DEVICE', 'cpu')
                if device_setting == 'cuda' and torch.cuda.is_available():
                    self.__class__._device = 'cuda'
                else:
                    self.__class__._device = 'cpu'
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
    def _ollama_generate(cls, query: str, context_docs: List[str], history: List[Dict[str, str]] = None) -> str:
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

        messages = [
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
            }
        ]
        if history:
            messages.extend(history)
        messages.append({'role': 'user', 'content': prompt})

        resp = client.chat(
            model=model_name,
            messages=messages,
            options={
                'temperature': temperature,
                'top_p': 0.9,
                'num_predict': 250,
            },
        )

        return (resp.get('message') or {}).get('content', '').strip()

    @classmethod
    def _is_greeting(cls, query: str) -> bool:
        cleaned = re.sub(r'[^\w\s]', '', query.strip().lower())
        # Common greetings as exact matches
        greetings = {
            'hi', 'hello', 'hey', 'hola', 'yo', 'greetings', 'good morning', 
            'good afternoon', 'good evening', 'howdy', 'sup', 'whats up', 'hi there', 'hello there'
        }
        if cleaned in greetings:
            return True
        # Common greeting phrases as substring matches
        greeting_phrases = [
            'how are you', 'how is it going', 'hows it going', 'how are you doing'
        ]
        for phrase in greeting_phrases:
            if phrase in cleaned:
                return True
        return False

    @classmethod
    def _ollama_generate_general(cls, query: str, history: List[Dict[str, str]] = None, system_context: str = "") -> str:
        ollama = cls._ollama
        if ollama is None:
            raise RuntimeError('Ollama not available')

        ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        client = ollama.Client(host=ollama_host)

        model_name = getattr(settings, 'AI_CHAT_OLLAMA_MODEL', os.environ.get('AI_CHAT_OLLAMA_MODEL', 'gemma3:1b'))
        temperature = float(getattr(settings, 'AI_CHAT_TEMPERATURE', os.environ.get('AI_CHAT_TEMPERATURE', 0.5)))

        system_content = (
            'You are an AI advisor for CluboraX, a university club and event management system.\n'
            'The user is asking a general question or chit-chat that might not be directly related to the knowledge base.\n'
            'Answer the user\'s question politely, helpfully, and accurately. Maintain your persona as the CluboraX AI Advisor.\n'
            'IMPORTANT: You MUST conclude your response with a brief, friendly sentence linking back to how you can help '
            'them with campus events, clubs, registrations, or management on the CluboraX platform.'
        )
        if system_context:
            system_content += f"\n\nUse this live database information if relevant to the query:\n{system_context}"

        messages = [
            {
                'role': 'system',
                'content': system_content,
            }
        ]
        if history:
            messages.extend(history)
        messages.append({'role': 'user', 'content': f"Question: {query}"})

        resp = client.chat(
            model=model_name,
            messages=messages,
            options={
                'temperature': temperature,
                'top_p': 0.9,
                'num_predict': 250,
            },
        )

        return (resp.get('message') or {}).get('content', '').strip()

    def answer(self, query: str, history: List[Dict[str, str]] = None) -> RAGResult:
        """Return an answer for the given query using hybrid RAG."""
        use_ollama = bool(self._get_setting('AI_CHAT_USE_OLLAMA', True))

        # Build live database context (public clubs and events counts/lists)
        live_db_context = ""
        try:
            from apps.clubs.models import Club
            from apps.events.models import Event
            active_clubs = list(Club.objects.filter(status__in=['active', 'approved', 'published']).values_list('name', flat=True))
            active_events = list(Event.objects.filter(status__in=['approved', 'published']).values_list('title', flat=True))
            
            live_db_context = (
                "Current Live Database Status:\n"
                f"- Registered/Active Clubs count: {len(active_clubs)}\n"
                f"- Registered/Active Clubs list: {', '.join(active_clubs) if active_clubs else 'None'}\n"
                f"- Scheduled/Active Events count: {len(active_events)}\n"
                f"- Scheduled/Active Events list: {', '.join(active_events) if active_events else 'None'}\n"
            )
        except Exception as db_err:
            logger.debug(f"Could not build live database context for chatbot: {db_err}")

        if not self.available:
            if use_ollama and self.__class__._ollama is not None:
                try:
                    generated = self._ollama_generate_general(query, history=history, system_context=live_db_context)
                    if generated:
                        return RAGResult(
                            answer=generated,
                            kind='generated',
                        )
                except Exception as ollama_err:
                    logger.warning(f"Ollama generation failed in RAG fallback: {ollama_err}")
            return RAGResult(
                answer='RAG engine is not available on this server.',
                kind='error',
            )

        if self._is_greeting(query):
            return RAGResult(
                answer="Hello! I'm your CluboraX AI Advisor. How can I assist you today with events, clubs, policies, or other activities?",
                kind='generated',
            )

        threshold_high = float(self._get_setting('AI_CHAT_DISTANCE_HIGH_CONF', 0.5))
        threshold_medium = float(self._get_setting('AI_CHAT_DISTANCE_MED_CONF', 0.75))
        off_topic_threshold = float(self._get_setting('AI_CHAT_OFF_TOPIC_THRESHOLD', 1.2))


        try:
            query_emb = self._embed_query(query)
            try:
                results = self.__class__._collection.query(
                    query_embeddings=[query_emb],
                    n_results=3,
                    include=['documents', 'distances'],
                )
            except Exception as query_err:
                logger.warning(f"ChromaDB query failed, attempting to refresh collection reference: {query_err}")
                chroma_path = self._get_setting('AI_CHAT_CHROMA_PATH', str(getattr(settings, 'BASE_DIR', '')))
                collection_name = self._get_setting('AI_CHAT_COLLECTION', 'event_qa')
                try:
                    import chromadb
                    client = chromadb.PersistentClient(path=chroma_path)
                    self.__class__._collection = client.get_or_create_collection(collection_name)
                    results = self.__class__._collection.query(
                        query_embeddings=[query_emb],
                        n_results=3,
                        include=['documents', 'distances'],
                    )
                except Exception as retry_err:
                    logger.error(f"ChromaDB refresh and retry query failed: {retry_err}")
                    raise retry_err

            docs: List[str] = (results.get('documents') or [[]])[0] or []
            dists: List[float] = (results.get('distances') or [[]])[0] or []

            if not docs or not dists:
                if use_ollama and self.__class__._ollama is not None:
                    try:
                        generated = self._ollama_generate_general(query, history=history, system_context=live_db_context)
                        if generated:
                            return RAGResult(answer=generated, kind='generated')
                    except Exception as ollama_err:
                        logger.warning(f"Ollama general generation failed: {ollama_err}")
                return RAGResult(
                    answer="Sorry, I don't have enough information to answer that.",
                    kind='refused',
                )

            distance = float(dists[0])
            top_doc = docs[0]

            # Off-topic guard: if the best match is still very far away, try general LLM fallback before refusing.
            if distance > off_topic_threshold:
                if use_ollama and self.__class__._ollama is not None:
                    try:
                        generated = self._ollama_generate_general(query, history=history, system_context=live_db_context)
                        if generated:
                            return RAGResult(answer=generated, kind='generated', distance=distance, contexts=docs)
                    except Exception as ollama_err:
                        logger.warning(f"Ollama general generation failed: {ollama_err}")
                return RAGResult(
                    answer='I can only answer questions about CluboraX — events, clubs, and campus management.',
                    kind='refused',
                    distance=distance,
                )

            # Tier 1: direct retrieval
            if distance < threshold_high:
                # Extract just the first answer block (avoid returning multiple Q/A pairs)
                answer = self.__class__._extract_first_answer_block(top_doc or '')
                return RAGResult(answer=answer, kind='retrieved', distance=distance, contexts=docs)

            # Tier 2: LLM fallback with contexts
            if distance < threshold_medium and use_ollama and self.__class__._ollama is not None:
                try:
                    # Inject live database context as the top document context
                    context_docs = [live_db_context] + docs[:2] if live_db_context else docs[:3]
                    generated = self._ollama_generate(query, context_docs, history=history)
                    if generated:
                        generated = self.__class__._clean_answer_text(generated)
                        return RAGResult(answer=generated, kind='generated', distance=distance, contexts=docs)
                except Exception as ollama_err:
                    logger.warning(f"Ollama generation failed, falling back: {ollama_err}")

            # Tier 3: general LLM or refuse if low confidence
            if use_ollama and self.__class__._ollama is not None:
                try:
                    generated = self._ollama_generate_general(query, history=history, system_context=live_db_context)
                    if generated:
                        return RAGResult(answer=generated, kind='generated', distance=distance, contexts=docs)
                except Exception as ollama_err:
                    logger.warning(f"Ollama general generation failed: {ollama_err}")

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

