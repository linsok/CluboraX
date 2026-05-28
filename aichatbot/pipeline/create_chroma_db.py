import os
import json
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

# Resolve paths relative to repository root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Paths to your embedding files
embedding_files = [
    os.path.join(BASE_DIR, "aichatbot", "cache", "Event_QA_emb.json"),
    os.path.join(BASE_DIR, "aichatbot", "cache", "Club_QA_emb.json"),
    os.path.join(BASE_DIR, "aichatbot", "cache", "Others_QA_emb.json"),
    os.path.join(BASE_DIR, "aichatbot", "cache", "Rules_QA_emb.json")
]

# Create or load a Chroma DB collection with persistent storage
chroma_path = os.path.join(BASE_DIR, "aichatbot", "database", "chroma_db")
client = chromadb.PersistentClient(path=chroma_path)

# Delete the old collection if it exists (to handle embedding dimension changes)
try:
    client.delete_collection("event_qa")
    print("Deleted old collection 'event_qa'")
except:
    print("No existing collection to delete")

# Create a fresh collection
collection = client.create_collection("event_qa")

# Load and insert embeddings
for file_path in embedding_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} items from {file_path}")
    for idx, item in enumerate(data):
        # Use a unique id for each item
        doc_id = f"{file_path}_{idx}"
        
        # Determine source metadata from file name
        source = "general"
        file_name_lower = file_path.lower()
        if "event" in file_name_lower:
            source = "event"
        elif "club" in file_name_lower:
            source = "club"
        elif "rule" in file_name_lower:
            source = "rules"
        elif "other" in file_name_lower:
            source = "others"

        collection.add(
            ids=[doc_id],
            embeddings=[item["embedding"]],
            documents=[item["text"]],
            metadatas=[{"source": source}]
        )

print("Chroma DB vector database created and populated.")
