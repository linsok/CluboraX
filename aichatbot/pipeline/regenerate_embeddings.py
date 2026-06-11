"""
Script to regenerate all embeddings using BAAI/bge-base-en-v1.5 model
This will update all embedding files and recreate the ChromaDB database.
"""
import os
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
CHAT_DIR = SCRIPT_DIR.parent
CACHE_DIR = CHAT_DIR / "cache"
KNOWLEDGE_DIR = CHAT_DIR / "knowledge"


def main():
    print("=" * 60)
    print("Regenerating embeddings with BAAI/bge-base-en-v1.5")
    print("=" * 60)

    model_name = "BAAI/bge-base-en-v1.5"

    files_to_embed = [
        (KNOWLEDGE_DIR / "Event_QA.txt", CACHE_DIR / "Event_QA_emb.json"),
        (KNOWLEDGE_DIR / "Club_QA.txt", CACHE_DIR / "Club_QA_emb.json"),
        (KNOWLEDGE_DIR / "Others_QA.txt", CACHE_DIR / "Others_QA_emb.json"),
        (KNOWLEDGE_DIR / "Rules_QA.txt", CACHE_DIR / "Rules_QA_emb.json"),
    ]

    for input_file, output_file in files_to_embed:
        print(f"\n[Processing] {input_file}")
        print(f"   Output: {output_file}")

        try:
            result = subprocess.run(
                [sys.executable, str(SCRIPT_DIR / "embed_qa.py"),
                 str(input_file), str(output_file), model_name],
                check=True,
                capture_output=True,
                text=True
            )
            print(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f" [Error] Failed processing {input_file}")
            print(e.stderr)
            return False

    print("\n" + "=" * 60)
    print("All embeddings generated successfully!")
    print("=" * 60)

    print("\n Recreating ChromaDB vector database...")
    try:
        result = subprocess.run(
            [sys.executable, str(SCRIPT_DIR / "create_chroma_db.py")],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        print("\nChromaDB recreated successfully!")
    except subprocess.CalledProcessError as e:
        print(f" [Error] Failed creating ChromaDB")
        print(e.stderr)
        return False

    print("\n" + "=" * 60)
    print(" All done! You can now run the chatbot with:")
    print("   python aichatbot/cli/chatbot_terminal.py")
    print("=" * 60)

    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
