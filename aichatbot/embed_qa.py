import sys
import json
from pathlib import Path
import torch
import numpy as np

try:
    from transformers import AutoTokenizer, AutoModel
except ImportError:
    print("Please install transformers: pip install transformers torch")
    sys.exit(1)


def read_chunks(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Split by double newlines between Q&A pairs
    chunks = [chunk.strip() for chunk in content.split('\n\n') if chunk.strip()]
    return chunks


def get_embedding(text, model, tokenizer):
    """Generate embedding using BAAI/bge-base-en-v1.5"""
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        # Use mean pooling on the last hidden state
        embeddings = outputs.last_hidden_state.mean(dim=1)
        # Normalize the embeddings
        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
    return embeddings[0].numpy()


def embed_chunks(model_name, input_file, output_file):
    print(f"Loading model: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    model.eval()
    
    chunks = read_chunks(input_file)
    print(f"Embedding {len(chunks)} chunks...")
    
    embeddings = []
    for i, chunk in enumerate(chunks):
        if (i + 1) % 10 == 0:
            print(f"Progress: {i + 1}/{len(chunks)}")
        emb = get_embedding(chunk, model, tokenizer)
        embeddings.append(emb)
    
    data = [
        {"text": chunk, "embedding": emb.tolist()} for chunk, emb in zip(chunks, embeddings)
    ]
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Embeddings saved to {output_file}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python embed_qa.py <input_file> <output_file> [model_name]")
        print("Default model: BAAI/bge-base-en-v1.5")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    model_name = sys.argv[3] if len(sys.argv) > 3 else "BAAI/bge-base-en-v1.5"
    
    embed_chunks(model_name, input_file, output_file)
