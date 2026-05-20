# AI Chatbot Embedding Model Update

## What Changed

The chatbot now uses **BAAI/bge-base-en-v1.5** instead of sentence-transformers for text embeddings. This model provides:
- Better semantic understanding
- More accurate similarity matching
- Lower temperature/hallucination through confidence threshold (0.45/0.5)

## Files Modified

1. **chatbot_terminal.py** - Updated to use BAAI/bge-base-en-v1.5 with transformers library
2. **embed_qa.py** - Updated embedding generation to use the new model
3. **regenerate_embeddings.py** - New helper script to regenerate all embeddings
4. **requirements.txt** - New dependencies list for the chatbot

## Setup Instructions

### 1. Install Dependencies

```bash
cd aichatbot
pip install -r requirements.txt
```

Or install manually:
```bash
pip install transformers torch chromadb numpy
```

### 2. Regenerate Embeddings (IMPORTANT!)

Since we changed the embedding model, you must regenerate all embeddings:

```bash
python aichatbot/regenerate_embeddings.py
```

This will:
- Generate new embeddings for all Q&A chunks using BAAI/bge-base-en-v1.5
- Recreate the ChromaDB vector database
- Take a few minutes depending on your hardware

### 3. Run the Chatbot

```bash
python aichatbot/chatbot_terminal.py
```

## Key Features

### Low Temperature (Confidence Threshold)
The chatbot now includes a confidence threshold of **0.6** to prevent hallucinated responses:
- Only answers when similarity distance < 0.6 (high confidence)
- Asks for rephrasing when uncertain
- More conservative and accurate responses

You can adjust the threshold in `chatbot_terminal.py`:
```python
CONFIDENCE_THRESHOLD = 0.6  # Lower = stricter, Higher = more lenient
```

### BGE Model Advantages
- Query instruction prefix for better retrieval: "Represent this sentence for searching relevant passages: {query}"
- Mean pooling with normalization for robust embeddings
- Better handling of semantic similarity

## Manual Embedding Generation

If you need to generate embeddings for a single file:

```bash
python aichatbot/embed_qa.py <input_file> <output_file> [model_name]
```

Example:
```bash
python aichatbot/embed_qa.py aichatbot/Event_QA_chunk1.txt aichatbot/Event_QA_chunk1_emb.json BAAI/bge-base-en-v1.5
```

## Troubleshooting

### Model Download

First time running will download BAAI/bge-base-en-v1.5 (~400MB). Requires internet connection.

### GPU Support

For faster embeddings with GPU:
1. Install CUDA-enabled PyTorch: Visit https://pytorch.org/
2. The code will automatically use GPU if available

### Memory Issues

If you encounter memory issues:
- The model requires ~2GB RAM
- Close other applications
- Process embeddings one file at a time manually

## Performance Notes

- Embedding generation: ~1-2 min per 100 Q&A pairs (CPU)
- Query response time: <1 second
- Model size: ~400MB download, ~2GB in memory
