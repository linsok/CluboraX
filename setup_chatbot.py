#!/usr/bin/env python3
"""
setup_chatbot.py - Interactive setup wizard for CluboraX AI Chatbot
Guides users through the complete setup process
"""

import os
import sys
import subprocess
import platform

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")

def check_python_version():
    """Verify Python 3.8+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("✗ Python 3.8+ required")
        return False
    print(f"✓ Python {version.major}.{version.minor}.{version.micro}")
    return True

def check_pip():
    """Verify pip is installed"""
    try:
        subprocess.run(["pip", "--version"], capture_output=True, check=True)
        print("✓ pip installed")
        return True
    except:
        print("✗ pip not found")
        return False

def install_dependencies():
    """Install Python packages"""
    print_header("Step 1: Installing Dependencies")
    
    requirements_file = "aichatbot/requirements.txt"
    
    if not os.path.exists(requirements_file):
        print("✗ requirements.txt not found")
        return False
    
    print("Installing packages from requirements.txt...")
    print("This may take 5-10 minutes...\n")
    
    try:
        subprocess.run(
            ["pip", "install", "-r", requirements_file],
            check=True
        )
        print("\n✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("✗ Failed to install dependencies")
        return False

def check_ollama():
    """Check if Ollama is installed"""
    print_header("Step 2: Checking Ollama")
    
    try:
        result = subprocess.run(
            ["ollama", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        print(f"✓ Ollama installed: {result.stdout.strip()}")
        return True
    except:
        print("✗ Ollama not found")
        print("\nTo install Ollama:")
        if platform.system() == "Windows":
            print("  1. Download: https://ollama.com/download/windows")
            print("  2. Run installer")
            print("  3. Restart terminal")
        elif platform.system() == "Darwin":
            print("  1. Download: https://ollama.com/download/macos")
            print("  2. Run installer")
        else:
            print("  1. Visit: https://ollama.com/download")
        return False

def download_model():
    """Download Gemma 3 model"""
    print_header("Step 3: Downloading LLM Model")
    
    print("This will download Gemma 3 (2GB)...")
    print("This may take 10-30 minutes depending on internet speed...\n")
    
    try:
        subprocess.run(
            ["ollama", "pull", "gemma3:1b"],
            check=True
        )
        print("\n✓ Model downloaded successfully")
        return True
    except subprocess.CalledProcessError:
        print("✗ Failed to download model")
        return False

def generate_embeddings():
    """Generate embeddings for Q&A"""
    print_header("Step 4: Generating Embeddings")
    
    print("This will generate embeddings for all Q&A pairs...")
    print("This may take 5-10 minutes (first run downloads models)...\n")
    
    try:
        subprocess.run(
            ["python", "aichatbot/regenerate_embeddings.py"],
            check=True
        )
        print("\n✓ Embeddings generated successfully")
        return True
    except subprocess.CalledProcessError:
        print("✗ Failed to generate embeddings")
        return False

def verify_setup():
    """Verify all components"""
    print_header("Step 5: Verifying Setup")
    
    checks = []
    
    # Check ChromaDB
    if os.path.exists("aichatbot/chroma_db"):
        print("✓ ChromaDB directory created")
        checks.append(True)
    else:
        print("✗ ChromaDB not found")
        checks.append(False)
    
    # Check embedding files
    for file in ["aichatbot/Event_QA_emb.json", "aichatbot/Club_QA_emb.json", "aichatbot/Others_QA_emb.json"]:
        if os.path.exists(file):
            print(f"✓ {os.path.basename(file)}")
            checks.append(True)
        else:
            print(f"✗ {file} not found")
            checks.append(False)
    
    return all(checks)

def print_next_steps():
    """Print next steps for running chatbot"""
    print_header("Setup Complete! ✓")
    
    print("""
To run the chatbot:

1. Open Terminal 1:
   ollama serve
   (Keep this terminal running)

2. Open Terminal 2:
   python aichatbot/chatbot_terminal.py

3. Start chatting!

Example questions:
   - How do I register for an event?
   - Can I be in multiple clubs?
   - How do I create an account?

Type 'exit' to quit the chatbot.
    """)

def main():
    """Main setup wizard"""
    print_header("CluboraX AI Chatbot - Setup Wizard")
    
    print("This wizard will guide you through the setup process.\n")
    
    # Check Python
    print("Checking Python version...")
    if not check_python_version():
        print("Please install Python 3.8 or higher")
        sys.exit(1)
    
    # Check pip
    print("Checking pip...")
    if not check_pip():
        print("Please install pip")
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("Starting setup...\n")
    
    # Install dependencies
    if not install_dependencies():
        print("Setup failed!")
        sys.exit(1)
    
    # Check Ollama
    if not check_ollama():
        print("Please install Ollama first, then run this setup again")
        sys.exit(1)
    
    # Download model
    if not download_model():
        print("Setup failed!")
        sys.exit(1)
    
    # Generate embeddings
    if not generate_embeddings():
        print("Setup failed!")
        sys.exit(1)
    
    # Verify
    if not verify_setup():
        print("⚠ Some components may be missing")
    
    # Print next steps
    print_next_steps()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)
