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
    
    # Define input and output files
    files_to_embed = [
        ("aichatbot/Event_QA.txt", "aichatbot/Event_QA_emb.json"),
        ("aichatbot/Club_QA.txt", "aichatbot/Club_QA_emb.json"),
        ("aichatbot/Others_QA.txt", "aichatbot/Others_QA_emb.json"),
    ]
    
    # Generate embeddings for each file
    for input_file, output_file in files_to_embed:
        print(f"\n📄 Processing: {input_file}")
        print(f"   Output: {output_file}")
        
        try:
            result = subprocess.run(
                [sys.executable, "aichatbot/embed_qa.py", input_file, output_file, model_name],
                check=True,
                capture_output=True,
                text=True
            )
            print(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f" Error processing {input_file}")
            print(e.stderr)
            return False
    
    print("\n" + "=" * 60)
    print(" All embeddings generated successfully!")
    print("=" * 60)
    
    # Recreate ChromaDB
    print("\n Recreating ChromaDB vector database...")
    try:
        result = subprocess.run(
            [sys.executable, "aichatbot/create_chroma_db.py"],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        print("\n ChromaDB recreated successfully!")
    except subprocess.CalledProcessError as e:
        print(f" Error creating ChromaDB")
        print(e.stderr)
        return False
    
    print("\n" + "=" * 60)
    print(" All done! You can now run the chatbot with:")
    print("   python aichatbot/chatbot_terminal.py")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
