# CluboraX AI Chatbot - Implementation Guide

**Version:** 2.0 (Hybrid RAG with Local LLM)  
**Last Updated:** May 2026  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Running the Chatbot](#running-the-chatbot)
6. [Configuration](#configuration)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

CluboraX AI Chatbot is a **hybrid Retrieval-Augmented Generation (RAG)** system designed for campus club management Q&A. It combines:

- **Fast & Accurate**: Returns pre-written answers when confidence is high
- **Smart Fallback**: Uses LLM when no direct match is found
- **Privacy-First**: Runs entirely on your local machine (no cloud API calls)
- **Cost-Effective**: Zero API costs, only uses local GPU/CPU

### Key Benefits

✅ **Instant Responses** - Direct answers in ~150ms  
✅ **Contextual Answers** - LLM provides nuanced responses  
✅ **No Hallucination** - Grounded in retrieved documents  
✅ **Privacy** - All data stays on your machine  
✅ **Easy to Scale** - Simple to add more Q&A pairs  
✅ **Production Ready** - Error handling, logging, validation  

---

## 🏗️ System Architecture

### High-Level Flow

```
User Query (e.g., "How do I join a club?")
    ↓
[1] Embedding Layer
    Query converted to 768-dimensional vector
    Using BAAI/bge-base-en-v1.5 model
    ↓
[2] Vector Search (ChromaDB)
    Searches database of Q&A embeddings
    Calculates cosine distance (similarity)
    ↓
[3] Confidence Check
    ├─ HIGH (distance < 0.45)
    │  └─→ Return Pre-written Answer
    │      ⏱️ ~150ms response time
    │      ✅ Accurate, fast
    │
    └─ LOW (distance ≥ 0.45)
       └─→ RAG Pipeline
           ├─ Retrieve top 3 similar Q&As
           ├─ Send to Gemma 3 LLM with context
           ├─ LLM generates response
           └─→ Return AI Response
               ⏱️ ~8-10 seconds
               ✅ Contextual, conversational
```

### Component Details

| Component | Purpose | Technology |
|-----------|---------|-----------|
| **Embedding Model** | Convert text to semantic vectors | BAAI/bge-base-en-v1.5 (400MB) |
| **Vector Database** | Store & retrieve similar Q&As | ChromaDB (persistent) |
| **LLM (Fallback)** | Generate contextual responses | Gemma 3 (2GB, runs locally) |
| **Framework** | Orchestration & API | Python 3.8+ |

---

## ✅ Prerequisites

### Hardware Requirements

- **Minimum**: 8GB RAM, 5GB storage, dual-core CPU
- **Recommended**: 16GB RAM, SSD, multi-core CPU or GPU
- **Internet**: Required for first-time model downloads only

### Software Requirements

- **Python**: 3.8 or higher
- **Ollama**: Latest version
- **pip**: Python package manager
- **OS**: Windows 10+, macOS, or Linux

### Verify Prerequisites

```bash
python --version          # Should show 3.8+
pip --version            # Should work
ollama --version         # Should show version
```

---

## 🚀 Installation

### Option 1: Automated Setup (Recommended)

```bash
# From project root directory
python setup_chatbot.py
```

This will:
1. ✓ Install Python dependencies
2. ✓ Verify Ollama installation
3. ✓ Download Gemma 3 model (2GB)
4. ✓ Generate all embeddings (5-10 min)
5. ✓ Create vector database
6. ✓ Verify setup complete

### Option 2: Manual Setup

#### Step 1: Install Python Dependencies
```bash
cd aichatbot
pip install -r requirements.txt
cd ..
```

#### Step 2: Install & Configure Ollama

**Windows:**
1. Download: https://ollama.com/download/windows
2. Run installer
3. Complete installation

**macOS/Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

#### Step 3: Download LLM Model
```bash
ollama pull gemma3:1b
```

Verify:
```bash
ollama list
# Output should show: gemma3:1b    ...    2.0GB
```

#### Step 4: Generate Embeddings
```bash
python aichatbot/regenerate_embeddings.py
```

Expected output:
```
Processing: aichatbot/Event_QA.txt
✓ Loaded 15 Q&A pairs
✓ Generated embeddings for 15 Q&A pairs
✓ Saved to Event_QA_emb.json

Processing: aichatbot/Club_QA.txt
✓ Loaded 18 Q&A pairs
...

Creating ChromaDB from embeddings...
✓ ChromaDB setup complete!
```

---

## 🏃 Running the Chatbot

### Quick Start (3 Terminals)

**Terminal 1: Start Ollama Server**
```bash
ollama serve
```

Keep this running. Output:
```
Listening on 127.0.0.1:11434
```

**Terminal 2: Run the Chatbot**
```bash
python aichatbot/chatbot_terminal.py
```

**Terminal 3: (Optional) Monitor/Debug**
```bash
# Can be used for running other commands
```

### Example Interaction

```
=====================================================================
CluboraX AI Chatbot - Hybrid RAG Mode
=====================================================================
Embedding Model: BAAI/bge-base-en-v1.5
LLM Model: gemma3:1b
Device: cpu
=====================================================================

✓ Chatbot initialized successfully!

How can we help you? (Type 'exit' to quit)

You: How do I register for an event?
[Direct match - Confidence: 95.3%]

Bot: You can register for an event through your CluboraX Dashboard. 
Click on the event you want to attend, review the details, and submit 
the registration form. You'll receive a confirmation email once your 
registration is processed.

You: Can multiple clubs collaborate?
[Using LLM - Low confidence: 38.2%]

Bot: Yes, inter-club collaboration is definitely encouraged! Joint events 
can help you reach more students and create more impactful experiences. 
Just make sure to coordinate with the Student Affairs Office if your 
joint event needs venue or funding support.

You: exit
Bot: Thank you for using CluboraX! Goodbye! 👋
```

---

## ⚙️ Configuration

### Adjust Confidence Threshold

Edit `aichatbot/chatbot_terminal.py` (Line 12):

```python
CONFIDENCE_THRESHOLD = 0.45  # Range: 0.0-1.0
```

**Effect:**
- `0.3` - Very strict (rarely uses LLM, faster)
- `0.45` - Balanced (default)
- `0.6+` - Lenient (uses LLM more often, more conversational)

### Change LLM Model

Edit `aichatbot/chatbot_terminal.py` (Line 13):

```python
OLLAMA_MODEL = "gemma3:1b"
```

**Available Models:**
```bash
ollama pull mistral        # Fast, 7B parameters
ollama pull llama2         # Powerful, 7B parameters
ollama pull neural-chat    # Optimized for chat
ollama pull phi            # Very fast, lightweight
```

### Adjust LLM Temperature

Edit `aichatbot/chatbot_terminal.py` (Line 14):

```python
LLM_TEMPERATURE = 0.3  # Range: 0.0-1.0
```

**Effect:**
- `0.0` - Deterministic (same answer every time)
- `0.3` - Balanced (current default)
- `1.0` - Creative (varied responses, more hallucination risk)

### Change Response Length

Edit `aichatbot/chatbot_terminal.py` in `generate_with_ollama()`:

```python
"num_predict": 200,  # Increase for longer responses
```

---

## 📝 Customization

### Add New Q&A Pairs

1. Edit the appropriate Q&A file:
   - `aichatbot/Event_QA.txt` - Event questions
   - `aichatbot/Club_QA.txt` - Club management
   - `aichatbot/Others_QA.txt` - General questions

2. Use this format:
   ```
   Q1. What is your question?
   A: This is the answer.
   
   Q2. Another question?
   A: Another answer.
   ```

3. Regenerate embeddings:
   ```bash
   python aichatbot/regenerate_embeddings.py
   ```

4. Restart chatbot

### Create Custom Q&A File

1. Create `aichatbot/Custom_QA.txt` with your Q&As
2. Edit `aichatbot/create_chroma_db.py`:
   ```python
   embedding_files = [
       "aichatbot/Event_QA_emb.json",
       "aichatbot/Club_QA_emb.json",
       "aichatbot/Others_QA_emb.json",
       "aichatbot/Custom_QA_emb.json",  # Add this line
   ]
   ```
3. Run embedding generation
4. Restart chatbot

---

## 🐛 Troubleshooting

### "Ollama not found"
```bash
# Verify Ollama installation
ollama list

# If not found, reinstall from https://ollama.com
```

### "Connection refused"
```bash
# Make sure Ollama server is running in Terminal 1
# Terminal 1: ollama serve
# Terminal 2: python aichatbot/chatbot_terminal.py
```

### "ChromaDB not found"
```bash
python aichatbot/regenerate_embeddings.py
```

### "Out of memory"
```bash
# Close other applications
# or use smaller model
ollama pull phi:latest
# Then change OLLAMA_MODEL = "phi" in chatbot_terminal.py
```

### "Very slow responses"
First run downloads models (~500MB) - this is normal.
Subsequent runs are faster.

For speedup:
1. Use smaller model: `ollama pull phi`
2. Reduce `LLM_MAX_TOKENS` or `num_predict`
3. Lower `CONFIDENCE_THRESHOLD` to use fewer LLM calls

### "Model download failed"
```bash
# Check internet connection
# Try again with manual download
ollama pull gemma3:1b
```

---

## 📊 Performance Metrics

### Embedding Generation
| Hardware | Time |
|----------|------|
| CPU (4-core) | 5-10 min |
| CPU (8+ core) | 2-5 min |
| GPU (NVIDIA) | 1-2 min |

### Query Response Time
| Scenario | Time |
|----------|------|
| Direct answer | ~150ms ✅ |
| LLM response | ~8-10 seconds |
| Slow network | Up to 30 seconds |

### Storage
| Component | Size |
|-----------|------|
| BAAI embeddings | ~400MB |
| Gemma 3 model | ~2GB |
| ChromaDB (51 pairs) | ~10MB |
| **Total** | **~2.4GB** |

---

## 📚 File Structure

```
aichatbot/
├── chatbot_terminal.py           # Main application
├── embed_qa.py                   # Embedding generator
├── create_chroma_db.py           # Database creator
├── regenerate_embeddings.py      # Batch embeddings
├── requirements.txt              # Dependencies
│
├── Event_QA.txt                  # Q&A source data
├── Club_QA.txt
├── Others_QA.txt
│
├── Event_QA_emb.json             # Generated embeddings
├── Club_QA_emb.json
├── Others_QA_emb.json
│
├── chroma_db/                    # Vector database (auto-created)
└── README.md                     # Chatbot documentation

setup_chatbot.py                  # Automated setup wizard
CHATBOT_IMPLEMENTATION_GUIDE.md   # This file
```

---

## 🎓 How It Works in Detail

### Phase 1: Offline (Setup)
1. Load all Q&A text files
2. Convert each Q&A to 768-dimensional vector (embedding)
3. Store embeddings in ChromaDB
4. Build index for fast searching

### Phase 2: Online (Chat)
1. User asks a question
2. Convert question to embedding (same model as Phase 1)
3. Search ChromaDB for similar Q&As
4. Check confidence (distance metric)
5. Route to direct answer or LLM based on confidence

### Why Two Routes?
- **Direct Answer**: Pre-written, always accurate, super fast
- **LLM Answer**: More conversational, handles edge cases

---

## 🔍 Understanding Key Concepts

### Embeddings
- Convert text to mathematical vectors
- Similar texts have similar vectors
- Enable semantic search (find meaning, not keywords)

### Vector Database (ChromaDB)
- Store embeddings in indexed format
- Query with cosine distance (similarity)
- Fast retrieval (O(log n))
- Persistent storage (saved to disk)

### Confidence Threshold
- Measures how similar retrieved Q&A is to user query
- 0.0 = completely different
- 1.0 = identical
- Threshold = decision point for LLM

### RAG (Retrieval-Augmented Generation)
- Retrieve relevant context from database
- Augment user query with context
- Generate response using LLM
- Result: Accurate, contextual, grounded answers

---

## 📞 Support

### Common Issues

| Problem | Solution |
|---------|----------|
| Ollama won't start | Install from ollama.com |
| Embeddings slow | First run downloads models |
| Python errors | Install: `pip install -r aichatbot/requirements.txt` |
| ChatDB errors | Regenerate: `python aichatbot/regenerate_embeddings.py` |

### Resources
- [Ollama Documentation](https://ollama.ai/)
- [ChromaDB Docs](https://docs.trychroma.com/)
- [BAAI BGE](https://huggingface.co/BAAI/bge-base-en-v1.5)

---

## 🎯 Next Steps

1. ✅ Run setup wizard or manual setup
2. ✅ Start Ollama server
3. ✅ Run chatbot
4. ✅ Test with sample questions
5. ⬜ Add custom Q&A pairs
6. ⬜ Fine-tune confidence threshold
7. ⬜ Integrate with frontend
8. ⬜ Deploy to production

---

**You're all set!** Start chatting with `python aichatbot/chatbot_terminal.py` 🚀

