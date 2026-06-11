# CluboraX AI Chatbot - Complete File Structure

## 📂 Project Directory Tree

```
CluboraX/
│
├── 🤖 aichatbot/                        [NEW] AI Chatbot Implementation
│   ├── chatbot_terminal.py              Main chatbot application
│   ├── embed_qa.py                      Embedding generation script
│   ├── create_chroma_db.py              Vector database creation
│   ├── regenerate_embeddings.py         Batch re-embedding utility
│   ├── requirements.txt                 Python dependencies
│   ├── README.md                        Chatbot documentation
│   │
│   ├── Event_QA.txt                     Event Q&A pairs (15)
│   ├── Club_QA.txt                      Club Q&A pairs (18)
│   ├── Others_QA.txt                    General Q&A pairs (18)
│   │
│   ├── Event_QA_emb.json                [Auto-created] Event embeddings
│   ├── Club_QA_emb.json                 [Auto-created] Club embeddings
│   ├── Others_QA_emb.json               [Auto-created] General embeddings
│   │
│   └── chroma_db/                       [Auto-created] Vector database
│       ├── chroma.sqlite3               Database file
│       └── [collection files]
│
├── backend/                             Django backend
│   ├── apps/
│   │   ├── ai_advisor/                  [ORIGINAL] AI Advisor (legacy)
│   │   │   ├── ml_models/
│   │   │   ├── knowledge_base/
│   │   │   ├── views.py
│   │   │   └── ...
│   │   └── ...other apps...
│   ├── manage.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/                            React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── AIAdvisor.jsx            Chat UI component
│   │   └── ...
│   └── ...
│
├── 📖 Documentation                     [NEW] Setup & Guides
│   ├── setup_chatbot.py                 [NEW] Automated setup wizard
│   ├── CHATBOT_IMPLEMENTATION_GUIDE.md  [NEW] Complete implementation guide
│   ├── README_AI_CHATBOT.md             [OLD] Legacy README (OpenAI version)
│   ├── FILE_STRUCTURE_GUIDE.md          [NEW] This file
│   └── ...other docs...
│
└── ...other files...
```

---

## 🎯 Quick Reference

### Core Chatbot Files

| File | Purpose | Size | Language |
|------|---------|------|----------|
| `chatbot_terminal.py` | Main application & chat loop | ~400 lines | Python |
| `embed_qa.py` | Generate text embeddings | ~200 lines | Python |
| `create_chroma_db.py` | Create vector database | ~150 lines | Python |
| `regenerate_embeddings.py` | Batch re-embedding | ~100 lines | Python |

### Data Files

| File | Purpose | Format | Size |
|------|---------|--------|------|
| `Event_QA.txt` | Event-related Q&As | Plain text | ~5KB |
| `Club_QA.txt` | Club management Q&As | Plain text | ~6KB |
| `Others_QA.txt` | General system Q&As | Plain text | ~5KB |

### Generated Files (Auto-created)

| File | Purpose | Format | Size |
|------|---------|--------|------|
| `Event_QA_emb.json` | Event embeddings | JSON | ~3MB |
| `Club_QA_emb.json` | Club embeddings | JSON | ~3MB |
| `Others_QA_emb.json` | General embeddings | JSON | ~3MB |

### Database Files (Auto-created)

| Directory | Purpose | Size |
|-----------|---------|------|
| `chroma_db/` | Vector database storage | ~10MB |

---

## 🔄 Data Flow

```
User Input
    ↓
[aichatbot/chatbot_terminal.py]
    ├─ Load embeddings from JSON files
    ├─ Search ChromaDB
    ├─ Check confidence
    └─ Route to direct answer or LLM
    ↓
Response
```

---

## 📊 File Organization by Function

### Setup & Configuration
```
setup_chatbot.py ..................... Automated setup wizard
aichatbot/requirements.txt ........... Python dependencies
aichatbot/README.md ................. Chatbot documentation
CHATBOT_IMPLEMENTATION_GUIDE.md ...... Complete implementation guide
```

### Source Code (Python)
```
aichatbot/chatbot_terminal.py ....... Main chatbot
aichatbot/embed_qa.py ............... Embedding generator
aichatbot/create_chroma_db.py ....... Database creator
aichatbot/regenerate_embeddings.py .. Batch utility
```

### Data Files (Q&A)
```
aichatbot/Event_QA.txt .............. Event Q&A source
aichatbot/Club_QA.txt ............... Club Q&A source
aichatbot/Others_QA.txt ............. General Q&A source
```

### Generated Files (Auto-created)
```
aichatbot/Event_QA_emb.json ......... Event embeddings
aichatbot/Club_QA_emb.json .......... Club embeddings
aichatbot/Others_QA_emb.json ........ General embeddings
aichatbot/chroma_db/ ................ Vector database
```

---

## 🚀 Setup Sequence

```
1. Copy/Extract Files
   ├─ aichatbot/
   ├─ setup_chatbot.py
   ├─ CHATBOT_IMPLEMENTATION_GUIDE.md
   └─ ...

2. Run Setup Wizard
   python setup_chatbot.py
   ├─ Installs dependencies
   ├─ Checks Ollama
   ├─ Downloads LLM (2GB)
   ├─ Generates embeddings (5-10 min)
   ├─ Creates ChromaDB
   └─ Verifies setup

3. Start Services
   Terminal 1: ollama serve
   Terminal 2: python aichatbot/chatbot_terminal.py

4. Use Chatbot
   Type questions and get responses
   Type 'exit' to quit
```

---

## 🔧 Configuration Files

### requirements.txt
Lists all Python packages needed:
- `transformers` - Hugging Face models
- `torch` - PyTorch
- `sentence-transformers` - Embeddings
- `chromadb` - Vector database
- `ollama` - LLM client
- `numpy` - Numerical computing

### chatbot_terminal.py Configuration (Lines 11-14)
```python
CONFIDENCE_THRESHOLD = 0.45    # Route decision point
OLLAMA_MODEL = "gemma3:1b"    # LLM choice
OLLAMA_API = "http://127.0.0.1:11434/api/generate"
LLM_TEMPERATURE = 0.3          # Response creativity
```

---

## 🗄️ Storage Breakdown

### Disk Usage Estimate

| Component | Size | First Run | Cached |
|-----------|------|-----------|--------|
| BAAI model | ~400MB | ✓ Downloads | ✓ Cached |
| Ollama + Gemma | ~2GB | ✓ Downloaded | ✓ Cached |
| Embeddings (3 files) | ~9MB | ✓ Generated | ✓ Saved |
| ChromaDB | ~10MB | ✓ Created | ✓ Persisted |
| **Total** | **~2.4GB** | First run only | Reused |

**Note:** After first run, cached models are reused. Only embeddings regenerated if Q&A changes.

---

## 🎓 Model Information

### Embedding Model: BAAI/bge-base-en-v1.5
- **Type:** Dense vector retriever
- **Size:** 400MB
- **Dimensions:** 768-dimensional vectors
- **Purpose:** Convert questions/answers to semantic vectors
- **Download:** Automatic (Hugging Face)

### LLM: Gemma 3 (1B) via Ollama
- **Type:** Lightweight local LLM
- **Size:** 2GB
- **Context:** Can handle 2K+ tokens
- **Purpose:** Generate contextual responses
- **Download:** Via `ollama pull gemma3:1b`

### Vector Database: ChromaDB
- **Type:** SQLite-backed vector store
- **Persistence:** Saved to disk
- **Collections:** 1 (qa_embeddings)
- **Items:** 51 Q&A pairs
- **Search:** Cosine distance

---

## 📝 Q&A Content Structure

### File Format (Plain Text)

```
Q1. Question text?
A: Answer text.

Q2. Another question?
A: Another answer.
```

### Distribution

- **Event_QA.txt:** 15 pairs (~300 tokens)
- **Club_QA.txt:** 18 pairs (~360 tokens)  
- **Others_QA.txt:** 18 pairs (~360 tokens)
- **Total:** 51 pairs (~1020 tokens)

### Topics Covered

| Category | Count | Examples |
|----------|-------|----------|
| Events | 15 | Registration, cancellation, venues |
| Clubs | 18 | Starting, managing, budgeting |
| General | 18 | Account, profile, support |

---

## 🔄 Update Workflow

### Adding New Q&A

```
1. Edit Event_QA.txt (or Club/Others)
2. Add new Q&A pair in format:
   Q<n>. New question?
   A: New answer.
3. Run regeneration:
   python aichatbot/regenerate_embeddings.py
4. Restart chatbot
```

### Changing Embeddings

```
1. Edit Event_QA.txt (or any source file)
2. Run: python aichatbot/regenerate_embeddings.py
   This automatically:
   ├─ Re-embeds all files
   ├─ Recreates ChromaDB
   └─ Saves to disk
3. Restart chatbot
```

### Scaling to Production

```
1. Add more Q&A pairs to source files
2. Switch LLM: Change OLLAMA_MODEL
3. Add API endpoint: Wrap chatbot in FastAPI
4. Deploy: Docker container with Ollama backend
```

---

## 📚 Documentation Map

| Document | Purpose | Read Time |
|----------|---------|-----------|
| `aichatbot/README.md` | Quick start & features | 10 min |
| `CHATBOT_IMPLEMENTATION_GUIDE.md` | Complete setup guide | 25 min |
| `setup_chatbot.py` | Automated wizard | 5 min |
| `FILE_STRUCTURE_GUIDE.md` | This file | 10 min |

---

## 🎯 Common Tasks

### Run Chatbot
```bash
# Terminal 1
ollama serve

# Terminal 2
python aichatbot/chatbot_terminal.py
```

### Add Q&A
```bash
# 1. Edit file
nano aichatbot/Event_QA.txt

# 2. Regenerate
python aichatbot/regenerate_embeddings.py

# 3. Restart
python aichatbot/chatbot_terminal.py
```

### Check Models
```bash
ollama list
python -c "import torch; print('GPU' if torch.cuda.is_available() else 'CPU')"
```

### Reset Database
```bash
rm -r aichatbot/chroma_db
python aichatbot/regenerate_embeddings.py
```

---

## ✅ Checklist

- [ ] Installed Python 3.8+
- [ ] Installed Ollama
- [ ] Downloaded Gemma 3 model (`ollama pull gemma3:1b`)
- [ ] Installed dependencies (`pip install -r aichatbot/requirements.txt`)
- [ ] Generated embeddings (`python aichatbot/regenerate_embeddings.py`)
- [ ] Started Ollama server (`ollama serve`)
- [ ] Started chatbot (`python aichatbot/chatbot_terminal.py`)
- [ ] Tested with sample questions
- [ ] Read documentation (`aichatbot/README.md`)

---

## 🚀 Next Steps

1. ✅ Follow setup guide
2. ✅ Run `setup_chatbot.py`
3. ✅ Start using chatbot
4. ⬜ Add custom Q&A pairs
5. ⬜ Fine-tune configuration
6. ⬜ Integrate with web frontend
7. ⬜ Deploy to production

---

**All files created and documented!** 📚✨

