# 🤖 CluboraX AI Chatbot - Hybrid RAG Implementation

## 📋 Quick Start

```bash
# 1. Install dependencies
pip install -r aichatbot/requirements.txt

# 2. Download Ollama and models
ollama pull gemma3:1b

# 3. Generate embeddings (one-time)
python aichatbot/regenerate_embeddings.py

# 4. In Terminal 1: Start Ollama
ollama serve

# 5. In Terminal 2: Run chatbot
python aichatbot/chatbot_terminal.py
```

---

## 📁 Directory Structure

```
aichatbot/
├── chatbot_terminal.py          # Main chatbot application
├── embed_qa.py                  # Embedding generation
├── create_chroma_db.py          # Vector database setup
├── regenerate_embeddings.py     # Batch re-embedding
├── requirements.txt             # Python dependencies
│
├── Event_QA.txt                 # Event-related Q&A (15 pairs)
├── Club_QA.txt                  # Club management Q&A (18 pairs)
├── Others_QA.txt                # General system Q&A (18 pairs)
│
├── Event_QA_emb.json            # Generated embeddings (auto-created)
├── Club_QA_emb.json
├── Others_QA_emb.json
│
└── chroma_db/                   # Vector database (auto-created)
    ├── chroma.sqlite3
    └── [collection files]
```

---

## 🚀 Complete Setup Guide

### Step 1: Install Python Dependencies

```bash
cd aichatbot
pip install -r requirements.txt
```

**Installed packages:**
- `transformers` - Hugging Face transformers library
- `torch` - PyTorch deep learning framework
- `sentence-transformers` - For BAAI/bge embeddings
- `chromadb` - Vector database
- `ollama` - Ollama Python client
- `numpy` - Numerical computing

### Step 2: Install and Configure Ollama

**Download:**
- Windows: https://ollama.com/download/windows
- macOS: https://ollama.com/download/macos
- Linux: https://ollama.com/download/linux

**Download LLM Model:**
```powershell
ollama pull gemma3:1b
```

Verify:
```powershell
ollama list
# Should show: gemma3:1b    ...    2.0GB    ...
```

### Step 3: Generate Embeddings (5-10 minutes)

```bash
python aichatbot/regenerate_embeddings.py
```

This:
1. Loads BAAI/bge-base-en-v1.5 model (~400MB)
2. Processes all Q&A files
3. Generates 768-dimensional embeddings
4. Saves to JSON files
5. Creates ChromaDB vector database

Expected output:
```
Processing: aichatbot/Event_QA.txt
Loaded 15 Q&A pairs
Generating embeddings for 15 Q&A pairs...
✓ Saved 15 embeddings to aichatbot/Event_QA_emb.json

Processing: aichatbot/Club_QA.txt
Loaded 18 Q&A pairs
...

Creating ChromaDB from embeddings...
✓ Added 15 items from Event_QA_emb.json
✓ Added 18 items from Club_QA_emb.json
✓ Added 18 items from Others_QA_emb.json
✓ ChromaDB setup complete!
```

### Step 4: Start Ollama Server

Open a new terminal:
```powershell
ollama serve
```

Keep this terminal open. Output:
```
Listening on 127.0.0.1:11434
```

### Step 5: Run the Chatbot

Open another new terminal:
```powershell
# Navigate to project root
cd "C:\Users\User\OneDrive - Royal University of Phnom Penh\Documents\DSE\DSE Y3-S2\Project\CluboraX"

# Run chatbot
python aichatbot/chatbot_terminal.py
```

Expected output:
```
=====================================================================
CluboraX AI Chatbot - Hybrid RAG Mode
=====================================================================
Embedding Model: BAAI/bge-base-en-v1.5
LLM Model: gemma3:1b
Confidence Threshold: 0.45
Device: cpu
=====================================================================

Loading embedding model...
✓ Embedding model loaded (30522 vocab)
Connecting to ChromaDB...
✓ ChromaDB connected (51 Q&A pairs)
Checking Ollama connection...
✓ Ollama server running

✓ Chatbot initialized successfully!

=====================================================================
How can we help you? (Type 'exit' to quit)
=====================================================================

You:
```

### Step 6: Chat!

```
You: How do I register for an event?
[Direct match - Confidence: 95.3%]

Bot: You can register for an event through your CluboraX Dashboard. 
Click on the event you want to attend, review the details, and submit 
the registration form. You'll receive a confirmation email once your 
registration is processed.

You: Can I join multiple clubs?
[Using LLM - Low confidence: 42.1%]

Bot: Yes, you can be a member of multiple clubs. The key is to ensure 
you have enough time to actively participate in each club. Many students 
balance their involvement across different organizations based on their 
interests and schedule.

You: exit
Bot: Thank you for using CluboraX! Goodbye! 👋
```

---

## ⚙️ Configuration Options

Edit `chatbot_terminal.py` to customize:

```python
# Line 12: Confidence threshold (0.0-1.0)
CONFIDENCE_THRESHOLD = 0.45
# Lower = only high-confidence answers (faster)
# Higher = more LLM usage (more conversational)

# Line 13: LLM Model choice
OLLAMA_MODEL = "gemma3:1b"
# Options: mistral, llama2, neural-chat, phi

# Line 14: LLM Temperature (0.0-1.0)
LLM_TEMPERATURE = 0.3
# Lower = more deterministic
# Higher = more creative

# In generate_with_ollama() function:
"num_predict": 200,  # Max response length in tokens
```

---

## 📚 How It Works

### Architecture

```
User Query
    ↓
[Embedding Layer]
    Converts query to 768-dim vector
    ↓
[ChromaDB Search]
    Searches for similar Q&A pairs (cosine distance)
    ↓
[Confidence Check]
    ├─ Distance < 0.45 (High Confidence)
    │  └─→ Return Pre-written Answer (Fast!)
    │
    └─ Distance ≥ 0.45 (Low Confidence)
       └─→ RAG Pipeline
           ├─ Send query + top 3 matches to Gemma 3
           ├─ LLM generates contextual response
           └─→ Return AI Response
```

### Two Response Modes

**1. Direct Answer (High Confidence)**
- ✅ Fast: ~150ms
- ✅ Accurate: Pre-written answers
- ✅ No hallucination
- Used when vector search finds very similar Q&A

**2. LLM Response (Low Confidence)**
- ✅ Contextual: Uses retrieved documents
- ✅ Conversational: AI-generated
- ⏱️ Slower: ~2-10 seconds
- Used when no direct match found

---

## 🔄 Adding/Updating Q&A Content

### Add New Q&A Pairs

1. Edit the appropriate file:
   - `Event_QA.txt` - Event questions
   - `Club_QA.txt` - Club questions
   - `Others_QA.txt` - General questions

2. Follow this format:
   ```
   Q<number>. What is your question?
   A: This is the answer.
   
   Q<next>. Another question?
   A: Another answer.
   ```

3. Regenerate embeddings:
   ```bash
   python aichatbot/regenerate_embeddings.py
   ```

4. Restart chatbot

### Remove Q&A Pairs

1. Delete the Q&A from the text file
2. Regenerate embeddings:
   ```bash
   python aichatbot/regenerate_embeddings.py
   ```
3. Restart chatbot

---

## 🔍 Understanding Embeddings

### What are embeddings?
- Convert text to numbers (vectors)
- Enable semantic similarity search
- BAAI/bge-base-en-v1.5 creates 768-dimensional vectors

### Why BAAI/bge-base-en-v1.5?
- Optimized for semantic search (Q&A retrieval)
- Fast inference (~100ms per query)
- High accuracy on similarity tasks
- 400MB download (one-time)

### Embedding Generation Process

For each Q&A pair:
1. Combine question + answer
2. Add instruction prefix: `"Represent this sentence for searching relevant passages: "`
3. Pass through transformer model
4. Get 768 numbers (embedding)
5. Store in ChromaDB

---

## 📊 Performance Metrics

### Embedding Generation
| Hardware | Time (50 pairs) |
|----------|-----------------|
| CPU | 2-5 min |
| GPU (NVIDIA) | 30-60 sec |
| GPU (Apple Silicon) | 1-2 min |

### Query Response Time
| Scenario | Time |
|----------|------|
| Embedding query | ~100ms |
| Vector search | ~10ms |
| **Direct answer** | **~150ms** ✅ |
| LLM generation | ~3-8 seconds |
| **LLM response** | **~8-10 seconds** |

### Storage Requirements
| Component | Size |
|-----------|------|
| BAAI embeddings | ~400MB |
| Gemma 3 model | ~2GB |
| ChromaDB (51 pairs) | ~10MB |

---

## 🐛 Troubleshooting

### Error: "Ollama not found"
```powershell
# Ensure Ollama is running in separate terminal
ollama serve

# Verify installation
ollama list
```

### Error: "ChromaDB not found"
```bash
python aichatbot/regenerate_embeddings.py
```

### Error: "Connection refused" (Ollama)
```bash
# Make sure Ollama server is running
# Terminal 1: ollama serve
# Terminal 2: python aichatbot/chatbot_terminal.py
```

### Error: Out of Memory
```bash
# Close other applications
# or use smaller model
ollama pull phi:latest  # Smaller than gemma3
```

### Error: Very slow responses
```bash
# First run downloads models (~500MB total)
# Subsequent runs are faster
# Consider GPU acceleration
```

### Error: "gemma3:1b not found"
```bash
ollama pull gemma3:1b
ollama list  # Verify
```

---

## 📝 File Reference

### Core Scripts

**chatbot_terminal.py** (Main Application)
- Initializes embedding model and ChromaDB
- Implements hybrid RAG with confidence thresholding
- Manages Ollama API communication
- Main chat loop and user interaction

**embed_qa.py** (Embedding Generation)
- Loads Q&A from text files
- Generates embeddings using BAAI/bge model
- Saves embeddings to JSON files

**create_chroma_db.py** (Database Creation)
- Loads embedding JSONs
- Creates ChromaDB collection
- Populates with embeddings and metadata
- Persists to disk

**regenerate_embeddings.py** (Batch Processing)
- Orchestrates re-embedding all Q&A files
- Recreates ChromaDB from scratch
- Used when updating Q&A content

### Data Files

**Event_QA.txt** (15 Q&A pairs)
- How to register for events
- Event policies and procedures
- Event troubleshooting

**Club_QA.txt** (18 Q&A pairs)
- How to start/manage a club
- Club requirements and procedures
- Leadership responsibilities

**Others_QA.txt** (18 Q&A pairs)
- CluboraX system questions
- Account management
- General troubleshooting

### Generated Files (Auto-created)

**\*_emb.json** (Embeddings)
- JSON files with embeddings
- One per Q&A source file
- ~200-500KB each

**chroma_db/** (Vector Database)
- SQLite-based persistent storage
- Stores embeddings and metadata
- Optimized for vector search

---

## 🎯 Use Cases

### Direct Answer (Fast Path)
```
User: "How do I register for an event?"
→ Vector DB finds exact match
→ Returns answer instantly
```

### LLM Response (Smart Path)
```
User: "Can I bring my girlfriend to events?"
→ No exact match
→ LLM uses retrieved context
→ Generates personalized answer
```

### Fallback (No Match)
```
User: "What's your favorite color?"
→ No similar Q&A found
→ LLM uses general knowledge
→ Responds politely
```

---

## 🚀 Production Considerations

### Deployment
- Wrap with FastAPI REST endpoint
- Run on server with Ollama backend
- Use Pinecone/Weaviate for scaling

### Monitoring
- Log all queries and responses
- Track confidence scores
- Monitor response times

### Improvements
- Add conversation history
- Implement feedback loop
- Fine-tune LLM with domain data
- Add more Q&A pairs

---

## 📞 Support

For issues:
1. Check troubleshooting section above
2. Verify all components running (Ollama, Python)
3. Check logs in terminal output
4. Ensure Q&A files are properly formatted

---

## 🎓 Learning Resources

- [BAAI BGE Models](https://huggingface.co/BAAI/bge-base-en-v1.5)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Ollama Models](https://ollama.ai/library)
- [Sentence Transformers](https://www.sbert.net/)

---

**Ready to chat!** 🚀

