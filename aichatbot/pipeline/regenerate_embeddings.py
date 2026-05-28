"""
Script to regenerate all embeddings using BAAI/bge-base-en-v1.5 model
This will update all embedding files and recreate the ChromaDB database.
"""
import os
import subprocess
import sys

def main():
    print("=" * 60)
    print("Regenerating embeddings with BAAI/bge-base-en-v1.5")
    print("=" * 60)
    
    model_name = "BAAI/bge-base-en-v1.5"
    
    # Resolve relative to repository root
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Define input and output files
    files_to_embed = [
        (os.path.join(BASE_DIR, "aichatbot", "knowledge", "Event_QA.txt"), os.path.join(BASE_DIR, "aichatbot", "cache", "Event_QA_emb.json")),
        (os.path.join(BASE_DIR, "aichatbot", "knowledge", "Club_QA.txt"), os.path.join(BASE_DIR, "aichatbot", "cache", "Club_QA_emb.json")),
        (os.path.join(BASE_DIR, "aichatbot", "knowledge", "Others_QA.txt"), os.path.join(BASE_DIR, "aichatbot", "cache", "Others_QA_emb.json")),
        (os.path.join(BASE_DIR, "aichatbot", "knowledge", "Rules_QA.txt"), os.path.join(BASE_DIR, "aichatbot", "cache", "Rules_QA_emb.json")),
    ]
    
    # Generate embeddings for each file
    embed_qa_path = os.path.join(BASE_DIR, "aichatbot", "pipeline", "embed_qa.py")
    for input_file, output_file in files_to_embed:
        print(f"\n[Processing] {input_file}")
        print(f"   Output: {output_file}")
        
        try:
            result = subprocess.run(
                [sys.executable, embed_qa_path, input_file, output_file, model_name],
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
    print(" All embeddings generated successfully!")
    print("=" * 60)
    
    # Recreate ChromaDB
    print("\n Recreating ChromaDB vector database...")
    create_db_path = os.path.join(BASE_DIR, "aichatbot", "pipeline", "create_chroma_db.py")
    try:
        result = subprocess.run(
            [sys.executable, create_db_path],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        print("\n ChromaDB recreated successfully!")
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
