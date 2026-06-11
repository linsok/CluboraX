import sys
import os
import json
import re
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
    
    # Split by question pattern: Q1:, Q1., Question 1:, etc.
    # We use a lookahead to split at the beginning of any line starting with a question.
    raw_chunks = re.split(r'(?im)^(?=\s*(?:Q\s*\d+|Question\s*\d+)\s*[\.:])', content)
    
    chunks = []
    for chunk in raw_chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        
        # Verify that it starts with a question pattern
        if not re.match(r'(?i)^\s*(?:Q\s*\d+|Question\s*\d+)\s*[\.:]', chunk):
            # This is likely a header at the beginning of the file, skip it
            continue
        
        # Remove any trailing section header.
        # Section headers are usually separated by multiple newlines at the end of the chunk.
        sub_blocks = [sb.strip() for sb in chunk.split('\n\n') if sb.strip()]
        if len(sub_blocks) > 1:
            last_block = sub_blocks[-1]
            is_header = (
                '\n' not in last_block
                and len(last_block) < 60
                and not re.match(r'(?i)^\s*(?:A|Answer)\s*[\.:]', last_block)
                and not re.match(r'^\s*(?:\d+[\.:]|[-*+])', last_block)
                and not last_block.endswith(('.', '?', '!', ':'))
            )
            if is_header:
                chunk = '\n\n'.join(sub_blocks[:-1]).strip()
        
        chunks.append(chunk)
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
    
    # Resolve relative to repository root if they are relative
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    input_path = Path(input_file)
    if not input_path.is_absolute():
        input_path = Path(BASE_DIR) / input_path
        
    output_path = Path(output_file)
    if not output_path.is_absolute():
        output_path = Path(BASE_DIR) / output_path
        
    embed_chunks(model_name, str(input_path), str(output_path))
