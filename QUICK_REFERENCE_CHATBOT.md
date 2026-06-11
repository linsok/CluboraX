# 🤖 CluboraX AI Chatbot - Quick Reference Card

**Status:** ✅ Production Ready  
**Version:** 2.0 (Hybrid RAG with Local LLM)

---

## 🚀 START IN 3 COMMANDS

```bash
# Terminal 1
ollama serve

# Terminal 2
python aichatbot/chatbot_terminal.py

# Start chatting!
```

---

## 📦 SETUP (One-Time)

```bash
# Option 1: Automated (Recommended)
python setup_chatbot.py

# Option 2: Manual
pip install -r aichatbot/requirements.txt
ollama pull gemma3:1b
python aichatbot/regenerate_embeddings.py
```

---

## ❓ FAQ

| Q | A |
|---|---|
| **Why is first response slow?** | Models loading from disk (~2-3 sec) |
| **Can I use offline?** | Yes, after initial setup (downloads cached) |
| **How do I add Q&As?** | Edit Event_QA.txt, run regenerate_embeddings.py |
| **Which LLM to use?** | Gemma3 (recommended), Mistral, or Phi |
| **Out of memory?** | Use smaller model or close apps |

---

## 🔧 COMMON TASKS

```bash
# Add new Q&A
nano aichatbot/Event_QA.txt
python aichatbot/regenerate_embeddings.py

# Change LLM model
ollama pull mistral
# Edit OLLAMA_MODEL = "mistral" in chatbot_terminal.py

# Adjust confidence threshold
# Edit CONFIDENCE_THRESHOLD = 0.4 in chatbot_terminal.py

# Reset database
rm -rf aichatbot/chroma_db
python aichatbot/regenerate_embeddings.py

# Check GPU usage
nvidia-smi
```

---

## ⏱️ PERFORMANCE

| Task | Time |
|------|------|
| First setup | 20-30 min |
| Regenerate embeddings | 5-10 min |
| Direct answer | ~150ms |
| LLM response | ~8-10 sec |

---

## 📂 KEY FILES

```
aichatbot/
├── chatbot_terminal.py        ← Main app (run this)
├── requirements.txt           ← Dependencies
├── Event_QA.txt              ← Edit to add Q&As
└── README.md                 ← Full documentation
```

---

## 💡 TIPS

✅ Keep Ollama server running  
✅ Add Q&As gradually (test each)  
✅ Use GPU if available (faster embeddings)  
✅ Adjust confidence threshold for your needs  
✅ Monitor ChromaDB size (scales linearly)  

---

## 🔗 RESOURCES

- [Ollama](https://ollama.com)
- [ChromaDB](https://docs.trychroma.com)
- [BAAI BGE](https://huggingface.co/BAAI/bge-base-en-v1.5)
- Full guide: `CHATBOT_IMPLEMENTATION_GUIDE.md`

---

**Questions?** See `aichatbot/README.md` or `CHATBOT_IMPLEMENTATION_GUIDE.md`

