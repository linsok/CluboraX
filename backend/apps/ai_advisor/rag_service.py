import logging
import os
import re
import threading
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

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

    # Strict refusal strings for consistent tone alignment in evaluation
    _REFUSAL_OFF_TOPIC = "I can only answer questions about CluboraX — events, clubs, and campus management."
    _REFUSAL_NO_INFO = "I don't have information about that. Please ask questions related to CluboraX — events, clubs, and campus management."

    # Immediate guardrail: catch sensitive system/data probes before embedding inference
    _SENSITIVE_KEYWORDS_RE = re.compile(
        r'\b(password|admin\s*panel|private\s*data|hack|credential|backdoor|'
        r'database\s*credentials|other\s*students|student.*data|access.*data)\b',
        re.IGNORECASE
    )

    # -------------------------------------------------------------------------
    # Text cleaning helpers
    # -------------------------------------------------------------------------

    @classmethod
    def _clean_answer_text(cls, text: str) -> str:
        """Strip leading A:/Answer: prefix from retrieved or generated text."""
        if not text:
            return ''
        cleaned = text.strip()
        cleaned = cls._ANSWER_PREFIX_RE.sub('', cleaned)
        return cleaned.strip()

    @classmethod
    def _extract_first_answer_block(cls, doc: str) -> str:
        """Extract the answer portion of a Q&A chunk, stopping before the next Q."""
        if not doc:
            return ''
        m = cls._ANSWER_MARKER_RE.search(doc)
        answer = doc[m.end():] if m else doc
        next_q = cls._NEXT_QUESTION_RE.search(answer)
        if next_q:
            answer = answer[:next_q.start()]
        return cls._clean_answer_text(answer)

    @classmethod
    def _clean_doc(cls, doc: str) -> str:
        """Strip Q&A file header lines that would leak into Ollama context."""
        lines = doc.splitlines()
        cleaned = [
            line for line in lines
            if not line.strip().startswith("Campus Event and Club Management System")
            and not line.strip().startswith("Club-related")
            and not line.strip().startswith("Event-related")
            and not line.strip().startswith("Registration,")
        ]
        return "\n".join(cleaned).strip()

    # -------------------------------------------------------------------------
    # Greeting detection
    # -------------------------------------------------------------------------

    @classmethod
    def _is_greeting(cls, query: str) -> bool:
        """Return True only when the entire query is a greeting, not a greeting
        followed by a real question."""
        cleaned = re.sub(r'[^\w\s]', '', query.strip().lower())

        # Exact single-word / short greetings
        greetings = {
            'hi', 'hello', 'hey', 'hola', 'yo', 'greetings',
            'good morning', 'good afternoon', 'good evening',
            'howdy', 'sup', 'whats up', 'hi there', 'hello there',
        }
        if cleaned in greetings:
            return True

        # Exact conversational greeting phrases — must be the whole query
        greeting_phrases = {
            'how are you', 'how is it going', 'hows it going', 'how are you doing',
        }
        if cleaned in greeting_phrases:
            return True

        return False

    # -------------------------------------------------------------------------
    # Initialisation
    # -------------------------------------------------------------------------

    def __init__(self):
        self.available = False
        self._ensure_initialized(background=True)

    @staticmethod
    def _get_setting(name: str, default: Any) -> Any:
        return getattr(settings, name, os.environ.get(name, default))

    def _ensure_initialized(self, background: bool = False) -> None:
        if self.__class__._initialized:
            self.available = (
                self.__class__._collection is not None
                and self.__class__._model is not None
            )
            return

        if background:
            with self.__class__._init_lock:
                if self.__class__._initialized:
                    self.available = (
                        self.__class__._collection is not None
                        and self.__class__._model is not None
                    )
                    return
                if self.__class__._initializing:
                    self.available = False
                    return

                self.__class__._initializing = True
                t = threading.Thread(
                    target=self._ensure_initialized,
                    kwargs={'background': False},
                    daemon=True,
                )
                t.start()
                self.available = False
                return

        with self.__class__._init_lock:
            if self.__class__._initialized:
                self.available = (
                    self.__class__._collection is not None
                    and self.__class__._model is not None
                )
                return

            chroma_path = self._get_setting(
                'AI_CHAT_CHROMA_PATH',
                os.path.join(str(getattr(settings, 'BASE_DIR', '')), '..', 'aichatbot', 'database', 'chroma_db'),
            )
            collection_name = self._get_setting('AI_CHAT_COLLECTION', 'event_qa')
            embedding_model_name = self._get_setting(
                'AI_CHAT_EMBED_MODEL', 'BAAI/bge-base-en-v1.5'
            )

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
                logger.warning(
                    f"RAG disabled: failed to init embedding model ({embedding_model_name}): {e}"
                )
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
            self.available = (
                self.__class__._collection is not None
                and self.__class__._model is not None
            )

    # -------------------------------------------------------------------------
    # Embedding
    # -------------------------------------------------------------------------

    @classmethod
    def _embed_query(cls, query: str) -> List[float]:
        torch = cls._torch
        tokenizer = cls._tokenizer
        model = cls._model
        if torch is None or tokenizer is None or model is None:
            raise RuntimeError('Embedding model not initialized')

        # BGE retrieval instruction prefix
        text = f"Represent this sentence for searching relevant passages: {query}"
        inputs = tokenizer(
            text, return_tensors='pt', truncation=True, padding=True, max_length=512
        )
        inputs = {k: v.to(cls._device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = model(**inputs)
            embeddings = outputs.last_hidden_state.mean(dim=1)
            embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
        return embeddings[0].detach().cpu().numpy().tolist()

    # -------------------------------------------------------------------------
    # Ollama generation
    # -------------------------------------------------------------------------

    @classmethod
    def _ollama_generate(
        cls,
        query: str,
        context_docs: List[str],
        history: List[Dict[str, str]] = None,
    ) -> str:
        """Generate a grounded answer using retrieved context documents."""
        ollama = cls._ollama
        if ollama is None:
            raise RuntimeError('Ollama not available')

        ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        client = ollama.Client(host=ollama_host)

        model_name = getattr(
            settings, 'AI_CHAT_OLLAMA_MODEL',
            os.environ.get('AI_CHAT_OLLAMA_MODEL', 'gemma3:1b')
        )
        temperature = float(
            getattr(settings, 'AI_CHAT_TEMPERATURE',
                    os.environ.get('AI_CHAT_TEMPERATURE', 0.2))
        )

        context = "\n\n".join(
            [f"Context {i + 1}:\n{cls._clean_doc(doc)}" for i, doc in enumerate(context_docs)]
        )
        prompt = (
            f"Context from knowledge base:\n{context}\n\n"
            f"Question: {query}\n\n"
            f"Answer:"
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
                    f'- If the context does not contain the answer, reply with exactly:\n'
                    f'  "{cls._REFUSAL_NO_INFO}"\n'
                    f'- If the question is completely unrelated to university events, clubs,\n'
                    f'  registration, or campus activities, reply with exactly:\n'
                    f'  "{cls._REFUSAL_OFF_TOPIC}"'
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
                'top_p': 0.8,
                'num_predict': 250,
            },
        )
        return (resp.get('message') or {}).get('content', '').strip()

    @classmethod
    def _ollama_generate_general(
        cls,
        query: str,
        history: List[Dict[str, str]] = None,
        system_context: str = "",
    ) -> str:
        """Generate a general / chit-chat response when RAG is unavailable."""
        ollama = cls._ollama
        if ollama is None:
            raise RuntimeError('Ollama not available')

        ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        client = ollama.Client(host=ollama_host)

        model_name = getattr(
            settings, 'AI_CHAT_OLLAMA_MODEL',
            os.environ.get('AI_CHAT_OLLAMA_MODEL', 'gemma3:1b')
        )
        temperature = float(
            getattr(settings, 'AI_CHAT_TEMPERATURE',
                    os.environ.get('AI_CHAT_TEMPERATURE', 0.5))
        )

        system_content = (
            'You are an AI advisor for CluboraX, a university club and event management system.\n'
            'The user is asking a general question or chit-chat that might not be directly '
            'related to the knowledge base.\n'
            'Answer the user\'s question politely, helpfully, and accurately. '
            'Maintain your persona as the CluboraX AI Advisor.\n'
            'IMPORTANT: You MUST conclude your response with a brief, friendly sentence linking '
            'back to how you can help them with campus events, clubs, registrations, or '
            'management on the CluboraX platform.'
        )
        if system_context:
            system_content += (
                f"\n\nUse this live database information if relevant to the query:\n{system_context}"
            )

        messages = [{'role': 'system', 'content': system_content}]
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

    # -------------------------------------------------------------------------
    # Live database context builder
    # -------------------------------------------------------------------------

    @staticmethod
    def _build_live_db_context() -> str:
        """Pull current club and event names from the Django ORM for Tier 2 context."""
        try:
            from apps.clubs.models import Club
            from apps.events.models import Event

            active_clubs = list(
                Club.objects.filter(
                    status__in=['active', 'approved', 'published']
                ).values_list('name', flat=True)
            )
            active_events = list(
                Event.objects.filter(
                    status__in=['approved', 'published']
                ).values_list('title', flat=True)
            )
            return (
                "Current Live Database Status:\n"
                f"- Active Clubs ({len(active_clubs)}): "
                f"{', '.join(active_clubs) if active_clubs else 'None'}\n"
                f"- Active Events ({len(active_events)}): "
                f"{', '.join(active_events) if active_events else 'None'}\n"
            )
        except Exception as e:
            logger.debug(f"Could not build live database context: {e}")
            return ""

    # -------------------------------------------------------------------------
    # Main answer method
    # -------------------------------------------------------------------------

    def answer(self, query: str, history: List[Dict[str, str]] = None) -> RAGResult:
        """Return an answer for the given query using hybrid RAG."""
        logger.info(f"=== RAG CHAT SERVICE ENTRY ===")
        logger.info(f"Input Query: {repr(query)}")
        
        use_ollama = bool(self._get_setting('AI_CHAT_USE_OLLAMA', True))

        # 1. Sensitive keyword guardrail — fires before any embedding or LLM call
        logger.info("Step 1: Running sensitive keyword guardrail check...")
        if self._SENSITIVE_KEYWORDS_RE.search(query):
            logger.info(" -> Intent matched: SENSITIVE PROBE. Refusing query immediately.")
            return RAGResult(
                answer=self._REFUSAL_OFF_TOPIC,
                kind='refused',
            )
        logger.info(" -> Guardrail check passed (no sensitive keywords detected).")

        # 2. Build live database context (used in Tier 2 and general fallback)
        logger.info("Step 2: Fetching live database status context...")
        live_db_context = self._build_live_db_context()
        logger.info(f" -> Live DB context summary: {len(live_db_context)} chars fetched.")

        # 3. RAG unavailable fallback — general Ollama response while warming up
        if not self.available:
            logger.info("Step 3: RAG service is currently unavailable/warming up.")
            if use_ollama and self.__class__._ollama is not None:
                logger.info(" -> Action: Routing to general Ollama generation fallback...")
                try:
                    generated = self._ollama_generate_general(
                        query, history=history, system_context=live_db_context
                    )
                    if generated:
                        logger.info(" -> General generation fallback completed successfully.")
                        return RAGResult(answer=generated, kind='generated')
                except Exception as e:
                    logger.warning(f" -> Ollama general fallback failed: {e}")
            logger.info(" -> Error: RAG service unavailable and no fallback succeeded.")
            return RAGResult(
                answer='RAG engine is not available on this server.',
                kind='error',
            )
        logger.info("Step 3: RAG service is available. Continuing pipeline.")

        # 4. Greeting shortcut — skip RAG for pure greetings
        logger.info("Step 4: Checking if query is a greeting...")
        if self._is_greeting(query):
            logger.info(" -> Intent matched: GREETING. Returning shortcut answer.")
            return RAGResult(
                answer=(
                    "Hello! I'm your CluboraX AI Advisor. How can I assist you today "
                    "with events, clubs, policies, or other activities?"
                ),
                kind='generated',
            )
        logger.info(" -> Query is not a greeting. Continuing to retrieval.")

        # 5. Load thresholds from settings / env
        threshold_high = float(self._get_setting('AI_CHAT_DISTANCE_HIGH_CONF', 0.55))
        threshold_medium = float(self._get_setting('AI_CHAT_DISTANCE_MED_CONF', 0.75))
        off_topic_threshold = float(self._get_setting('AI_CHAT_OFF_TOPIC_THRESHOLD', 1.2))
        logger.info(f"Step 5: Load parameters -> high_conf={threshold_high}, med_conf={threshold_medium}, off_topic={off_topic_threshold}")

        try:
            logger.info("Step 6: Generating query embedding...")
            query_emb = self._embed_query(query)
            logger.info(" -> Query embedding generated successfully.")

            # ChromaDB query with one retry on failure
            logger.info("Step 7: Querying ChromaDB collection for nearest neighbors...")
            try:
                results = self.__class__._collection.query(
                    query_embeddings=[query_emb],
                    n_results=3,
                    include=['documents', 'distances'],
                )
            except Exception as query_err:
                logger.warning(f" -> Query failed, attempting re-initialization: {query_err}")
                chroma_path = self._get_setting(
                    'AI_CHAT_CHROMA_PATH',
                    os.path.join(str(getattr(settings, 'BASE_DIR', '')), '..', 'aichatbot', 'database', 'chroma_db'),
                )
                collection_name = self._get_setting('AI_CHAT_COLLECTION', 'event_qa')
                import chromadb
                client = chromadb.PersistentClient(path=chroma_path)
                self.__class__._collection = client.get_or_create_collection(collection_name)
                results = self.__class__._collection.query(
                    query_embeddings=[query_emb],
                    n_results=3,
                    include=['documents', 'distances'],
                )

            docs: List[str] = (results.get('documents') or [[]])[0] or []
            dists: List[float] = (results.get('distances') or [[]])[0] or []
            logger.info(f" -> ChromaDB returned {len(docs)} document candidate(s).")

            if not docs or not dists:
                logger.info(" -> Intent matched: NO PASSAGE. Distance not available (empty index). Refusing query.")
                return RAGResult(answer=self._REFUSAL_NO_INFO, kind='refused')

            distance = float(dists[0])
            logger.info(f" -> Top candidate distance: {distance:.4f}")

            # 6. Hard refusal: distance too high — off-topic or no useful match
            if distance >= threshold_medium:
                if distance > off_topic_threshold:
                    logger.info(f" -> Intent matched: OFF-TOPIC (distance={distance:.4f} > off_topic={off_topic_threshold}). Refusing query.")
                    ans = self._REFUSAL_OFF_TOPIC
                else:
                    logger.info(f" -> Intent matched: NO CONTEXT (distance={distance:.4f} >= med_conf={threshold_medium}). Refusing query.")
                    ans = self._REFUSAL_NO_INFO
                return RAGResult(
                    answer=ans,
                    kind='refused',
                    distance=distance,
                    contexts=docs,
                )

            # 7. Tier 1: direct retrieval — high confidence exact match
            if distance < threshold_high:
                logger.info(f" -> Intent matched: DIRECT RETRIEVAL (distance={distance:.4f} < high_conf={threshold_high}).")
                logger.info(" -> Action: Extracting first answer block from top document.")
                answer = self._extract_first_answer_block(docs[0] or '')
                logger.info(" -> Answer extracted successfully.")
                return RAGResult(
                    answer=answer,
                    kind='retrieved',
                    distance=distance,
                    contexts=docs,
                )

            # 8. Tier 2: guided LLM generation with retrieved context
            #    Real semantic passages first, live DB appended last so it
            #    supplements rather than eclipses the retrieved documents.
            logger.info(f" -> Intent matched: SEMANTIC MATCH (distance={distance:.4f} is between {threshold_high} and {threshold_medium}).")
            if use_ollama and self.__class__._ollama is not None:
                logger.info(" -> Action: Routing to Tier 2 Ollama generation with retrieved context...")
                try:
                    context_docs = docs[:2] + [live_db_context] if live_db_context else docs[:3]
                    generated = self._ollama_generate(query, context_docs, history=history)
                    if generated:
                        generated = self._clean_answer_text(generated)
                        logger.info(" -> Tier 2 generation completed successfully.")
                        return RAGResult(
                            answer=generated,
                            kind='generated',
                            distance=distance,
                            contexts=docs,
                        )
                except Exception as e:
                    logger.warning(f" -> Ollama Tier 2 generation failed: {e}")

            # 9. Tier 3: refuse — below off-topic threshold but no answer available
            logger.info(" -> Intent matched: REFUSAL. Distance was in bounds but no generation succeeded.")
            return RAGResult(
                answer=self._REFUSAL_NO_INFO,
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