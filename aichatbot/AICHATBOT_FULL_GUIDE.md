# CluboraX AI Chatbot (aichatbot) — Full Guide

This guide explains the **entire `aichatbot/` system**, including:
- How the knowledge base files become embeddings
- How ChromaDB is created/queried
- How the terminal chatbot works
- How the chatbot is embedded into the **Django + React website** via `ai_advisor`
- Configuration (env vars), Docker, and troubleshooting

---

## 1) What `aichatbot/` is

`aichatbot/` contains a **local Retrieval-Augmented Generation (RAG)** chatbot:

- **Retriever**: ChromaDB vector store (`aichatbot/chroma_db/`)
- **Embeddings model**: `BAAI/bge-base-en-v1.5` (via `transformers` + `torch`)
- **Knowledge source**: curated Q&A text files (`*.txt`)
- **LLM fallback (optional)**: Ollama local model (ex: `gemma3:1b`, `mistral`, etc.)

The chatbot answers questions by retrieving similar Q&A chunks; if similarity is not high enough, it can optionally ask an LLM to generate an answer using the retrieved context.

---

## 2) Repository layout (key files)

### Knowledge content
- `Event_QA.txt`
- `Club_QA.txt`
- `Others_QA.txt`
- `Rules_QA.txt` (currently not in the embedding pipeline yet)

Each file contains multiple Q&A “chunks”, separated by **blank lines**.

### Embedding artifacts
- `Event_QA_emb.json`
- `Club_QA_emb.json`
- `Others_QA_emb.json`

Each JSON item is:
- `text`: the chunk
- `embedding`: a numeric embedding vector (list of floats)

### Vector DB
- `chroma_db/` (persistent ChromaDB store)

### Pipelines / tools
- `embed_qa.py`: builds embeddings JSON from a `.txt`
- `create_chroma_db.py`: loads `*_emb.json` and populates ChromaDB
- `regenerate_embeddings.py`: regenerates all embeddings + recreates ChromaDB
- `chatbot_terminal.py`: interactive terminal chatbot

### Web integration (new)
The website chatbot is implemented inside the backend `ai_advisor` app:
- `backend/apps/ai_advisor/rag_service.py`: hybrid RAG service used by the API
- `backend/apps/ai_advisor/views.py`: `/api/ai-advisor/chat/` uses `RAGChatService` (with safe fallback)

---

## 3) How embeddings are created (offline build step)

### Step 1 — Read chunks
`embed_qa.py` reads the `.txt` file and splits chunks by double newlines.

### Step 2 — Create embeddings
Embeddings are created using `BAAI/bge-base-en-v1.5`.

Important detail:
- In the **web/terminal chat query**, the query text is prefixed with:
  `"Represent this sentence for searching relevant passages: ..."`
  which improves retrieval quality for BGE models.

### Step 3 — Save embeddings
The output goes into `*_emb.json`.

### Step 4 — Build ChromaDB
`create_chroma_db.py`:
- deletes the old collection `event_qa` if present
- inserts all embeddings from the JSON files into a fresh `event_qa` collection

---

## 4) One-command rebuild (recommended)

Run from the repository root:

```powershell
python aichatbot/regenerate_embeddings.py
```

This will:
1) regenerate `Event_QA_emb.json`, `Club_QA_emb.json`, `Others_QA_emb.json`
2) recreate `aichatbot/chroma_db/`

If you edit Q&A text files, you should re-run this.

---

## 5) How the terminal chatbot works

File: `aichatbot/chatbot_terminal.py`

### Runtime steps
1) Load ChromaDB from `aichatbot/chroma_db`
2) Load embedding model `BAAI/bge-base-en-v1.5`
3) On each user question:
   - embed the query
   - query Chroma (top 3)
   - check the nearest distance

### Confidence tiers
- **High confidence** (distance < `CONFIDENCE_THRESHOLD`, default ~0.45)
  - return the retrieved answer directly
- **Medium confidence** (distance < 0.50)
  - if Ollama enabled, generate with retrieved context (RAG)
- **Low confidence** (>= 0.50)
  - refuse/ask to rephrase (anti-hallucination)

### Ollama usage
See `aichatbot/OLLAMA_SETUP.md`.
Typical steps:

```powershell
ollama serve
ollama pull gemma3:1b
python aichatbot/chatbot_terminal.py
```

---

## 6) How the website chatbot works (Django + React)

### Frontend (React)
- Page UI: `frontend/src/pages/AIAdvisor.jsx`
- API client: `frontend/src/api/aiAdvisor.js` (uses JWT via `frontend/src/api/client.js`)
- Floating entry button: `frontend/src/components/FloatingChatbot.jsx`

The page sends messages to:

`POST /api/ai-advisor/chat/`

### Backend (Django REST)
- Route wiring:
  - `backend/campus_management/urls.py` → `api/ai-advisor/`
  - `backend/apps/ai_advisor/urls.py`

- Chat endpoint:
  - `backend/apps/ai_advisor/views.py` → `ChatView`

- Hybrid RAG engine:
  - `backend/apps/ai_advisor/rag_service.py` → `RAGChatService`

### What happens on a chat message
1) Request is authenticated (JWT)
2) Backend calls `RAGChatService.answer(message)`
   - embeds the query
   - queries Chroma
   - optional Ollama generation
3) Backend persists the exchange into `AIAdvice` (for `/history/`)
4) Returns JSON:

```json
{
  "message": "...",
  "mode": "general",
  "session_id": "...",
  "meta": {
    "rag_kind": "retrieved|generated|refused|rule_based|error",
    "rag_distance": 0.42
  }
}
```

### Fallback behavior (important)
If the server does not have the heavy RAG dependencies installed (or Chroma path is missing), the API **does not break**: it falls back to a simple rule-based response.

---

## 7) Configuration (env vars / Django settings)

Settings are defined in `backend/campus_management/settings.py` and can be overridden by env vars:

- `AI_CHAT_CHROMA_PATH`
  - default points to `../aichatbot/chroma_db`
- `AI_CHAT_COLLECTION` (default `event_qa`)
- `AI_CHAT_EMBED_MODEL` (default `BAAI/bge-base-en-v1.5`)
- `AI_CHAT_DISTANCE_HIGH_CONF` (default `0.45`)
- `AI_CHAT_DISTANCE_MED_CONF` (default `0.50`)
- `AI_CHAT_USE_OLLAMA` (default `true`)
- `AI_CHAT_OLLAMA_MODEL` (default `gemma3:1b`)
- `AI_CHAT_TEMPERATURE` (default `0.3`)

Notes:
- If Ollama is not running or not installed, the system still works in retrieval/refusal mode.
- If you change embedding model, you MUST rebuild embeddings + ChromaDB.

---

## 8) Dependencies

### For terminal chatbot
Install in a separate environment (recommended):

```powershell
pip install -r aichatbot/requirements.txt
```

### For website chatbot (embedded in Django)
Backend now needs these packages to enable RAG mode:
- `chromadb`
- `transformers`
- `torch`
- `ollama` (optional, only if you want LLM fallback)

They are listed in `backend/requirements.txt`.

---

## 9) Docker Compose

`docker-compose.yml` mounts the ChromaDB folder into the backend/celery containers and sets:
- `AI_CHAT_CHROMA_PATH=/app/aichatbot/chroma_db`

That means:
- Build ChromaDB on the host (or bake it into your image)
- Run `docker-compose up -d --build`

If you want Ollama inside Docker, you must add a dedicated `ollama` service (not included by default).

---

## 10) Updating the chatbot knowledge

Typical workflow:
1) Edit `aichatbot/Event_QA.txt`, `Club_QA.txt`, `Others_QA.txt`
2) Regenerate embeddings + Chroma:

```powershell
python aichatbot/regenerate_embeddings.py
```

3) Restart backend (or docker containers) if needed.

If you want to include `Rules_QA.txt`, you must:
- generate embeddings for it
- add its `*_emb.json` into `create_chroma_db.py`’s `embedding_files`

---

## 11) Troubleshooting

### A) `regenerate_embeddings.py` fails
Common causes:
- Missing packages (`transformers`, `torch`)
- No internet on first run (BGE model download)
- Low RAM

Fix:
```powershell
pip install -r aichatbot/requirements.txt
python aichatbot/regenerate_embeddings.py
```

### B) Website chat returns rule-based answers only
That means `RAGChatService` is not “available”. Check:
- `AI_CHAT_CHROMA_PATH` points to the real `chroma_db`
- backend has `chromadb`, `torch`, `transformers` installed
- the Chroma collection exists (`event_qa`)

### C) Ollama errors (LLM fallback)
- Start the server:
  ```powershell
  ollama serve
  ```
- Pull the model:
  ```powershell
  ollama pull gemma3:1b
  ```
- Or disable fallback:
  - set `AI_CHAT_USE_OLLAMA=false`

### D) Slow responses
- First request can be slow (model load)
- CPU-only generation via Ollama can be slow

Options:
- Use a smaller Ollama model
- Disable LLM fallback (retrieval-only)

---

## 12) Security / privacy notes

- Everything runs locally/on your server (no external API calls unless you add them)
- The AI endpoint is protected by JWT (`IsAuthenticated`)
- Avoid placing secrets in prompts; use env vars for config

---

## 13) Quick checklist

- [ ] Update Q&A `.txt`
- [ ] `python aichatbot/regenerate_embeddings.py`
- [ ] Ensure backend dependencies installed (`backend/requirements.txt`)
- [ ] Ensure `AI_CHAT_CHROMA_PATH` is correct
- [ ] (Optional) `ollama serve` + `ollama pull <model>`
- [ ] Visit `/ai-advisor` or click the floating chatbot button
