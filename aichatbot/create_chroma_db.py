import json
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

# Paths to your embedding files
embedding_files = [
    "aichatbot/Event_QA_emb.json",
    "aichatbot/Club_QA_emb.json",
    "aichatbot/Others_QA_emb.json",
    "aichatbot/Rules_QA_emb.json"
]

# Create or load a Chroma DB collection with persistent storage
client = chromadb.PersistentClient(path="aichatbot/chroma_db")

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
        collection.add(
            ids=[doc_id],
            embeddings=[item["embedding"]],
            documents=[item["text"]]
        )

print("Chroma DB vector database created and populated.")
