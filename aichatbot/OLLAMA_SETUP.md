# Setting Up Mistral LLM via Ollama

## What is Ollama?

Ollama allows you to run large language models (LLMs) locally on your machine without API costs or internet dependency once downloaded. Perfect for privacy and cost-effective AI applications.

## Installation Steps

### 1. Install Ollama

**Windows:**
Download and install from: https://ollama.com/download/windows

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Verify Installation

```powershell
ollama --version
```

### 3. Pull Mistral Model

Download the Mistral model (about 4GB):

```powershell
ollama pull mistral
```

This downloads mistral:latest. Other options:
- `mistral:7b` - Standard 7B model
- `mistral:7b-instruct` - Instruction-tuned version
- `mistral:latest` - Latest stable release

### 4. Start Ollama Server

Ollama runs as a background service after installation. If needed, start manually:

```powershell
ollama serve
```

### 5. Test Mistral

```powershell
ollama run mistral
```

Type a test message, then `/bye` to exit.

### 6. Install Python Package

```powershell
pip install ollama
```

### 7. Run the Chatbot

```powershell
python aichatbot/chatbot_terminal.py
```

## How It Works (Hybrid RAG Architecture)

```
User Query
    ↓
[1] Encode with BAAI/bge-base-en-v1.5
    ↓
[2] Search ChromaDB (retrieve top 3 similar Q&As)
    ↓
[3] Check confidence (distance threshold)
    ↓
    ├─ High Confidence (< 0.5)
    │  └─→ Return pre-written answer (FAST, ACCURATE)
    │
    └─ Low Confidence (≥ 0.45)
       └─→ Send to Mistral with context (RAG)
           └─→ Generate contextual response
```

## Configuration Options

Edit `chatbot_terminal.py` to customize:

```python
CONFIDENCE_THRESHOLD = 0.6      # Lower = stricter retrieval
USE_OLLAMA = True               # Set False to disable LLM fallback
OLLAMA_MODEL = "mistral"        # Change model (mistral, llama2, etc.)
LLM_TEMPERATURE = 0.3           # Lower = more deterministic (0.0-1.0)
```

## Available Models in Ollama

Try other models by changing `OLLAMA_MODEL`:

```powershell
# Pull other models
ollama pull llama2        # Meta's Llama 2
ollama pull codellama     # Code-specialized
ollama pull phi          # Microsoft's Phi (smaller, faster)
ollama pull gemma        # Google's Gemma

# List installed models
ollama list
```

## Troubleshooting

### Error: "Connection refused"
```powershell
# Start Ollama service
ollama serve
```

### Error: "Model not found"
```powershell
# Pull the model first
ollama pull mistral
```

### Slow responses
- **CPU-only:** Responses take 5-30 seconds
- **With GPU:** Much faster (1-5 seconds)
- Use smaller models like `phi` or `tinyllama` for speed

### Memory issues
- Mistral requires ~8GB RAM
- Try smaller models:
  - `phi` - 2.7GB (3B parameters)
  - `tinyllama` - 637MB (1.1B parameters)

## Performance Notes

**Retrieval (ChromaDB):**
- Response time: <1 second
- Accuracy: Very high for known questions
- No hallucinations

**LLM Generation (Mistral):**
- Response time: 5-30 seconds (CPU), 1-5 seconds (GPU)
- Flexibility: Can handle novel questions
- Temperature 0.3: Reduced hallucinations

## Alternative: Disable LLM Fallback

If you want retrieval-only mode (faster, no Ollama needed):

In `chatbot_terminal.py`:
```python
USE_OLLAMA = False
```

This reverts to the original retrieval-only behavior.

## Advantages of Hybrid RAG

✅ **Fast for known questions** - Direct retrieval
✅ **Flexible for new questions** - LLM generation
✅ **Grounded responses** - LLM uses retrieved context
✅ **Low temperature** - Reduces hallucinations
✅ **Local & private** - No data sent to cloud
✅ **No API costs** - Runs on your machine

## System Requirements

**Minimum:**
- 8GB RAM
- 10GB free disk space
- Modern CPU

**Recommended:**
- 16GB RAM
- NVIDIA GPU with 6GB+ VRAM
- SSD storage

## Usage Examples

**High Confidence Query (Retrieval):**
```
You: How do I register for an event?
Bot [Retrieved]: To register for an event, go to the Events page...
```

**Low Confidence Query (LLM):**
```
You: What's the difference between club events and campus events?
Bot [AI-Generated]: Based on the system, club events are organized...
```

## Updating Models

```powershell
# Update to latest version
ollama pull mistral

# Remove old versions
ollama rm mistral:old-tag
```

## Security Notes

- Ollama runs locally - no internet required after download
- Models process data on your machine only
- No telemetry or data collection by default
- Safe for sensitive/proprietary information
