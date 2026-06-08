import json
from pathlib import Path
import chromadb

SCRIPT_DIR = Path(__file__).parent.resolve()
CHAT_DIR = SCRIPT_DIR.parent
CACHE_DIR = CHAT_DIR / "cache"
CHROMA_DB_DIR = CHAT_DIR / "chroma_db"

embedding_files = [
    CACHE_DIR / "Event_QA_emb.json",
    CACHE_DIR / "Club_QA_emb.json",
    CACHE_DIR / "Others_QA_emb.json",
    CACHE_DIR / "Rules_QA_emb.json",
]

CHROMA_DB_DIR.mkdir(parents=True, exist_ok=True)
client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))

try:
    client.delete_collection("event_qa")
    print("Deleted old collection 'event_qa'")
except Exception:
    print("No existing collection to delete")

collection = client.create_collection("event_qa")

for file_path in embedding_files:
    if not file_path.exists():
        print(f"Skipping {file_path} (not found)")
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} items from {file_path}")
    for idx, item in enumerate(data):
        doc_id = f"{file_path.name}_{idx}"
        collection.add(
            ids=[doc_id],
            embeddings=[item["embedding"]],
            documents=[item["text"]]
        )

print("Chroma DB vector database created and populated.")
