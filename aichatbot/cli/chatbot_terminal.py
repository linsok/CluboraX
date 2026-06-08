import chromadb
from chromadb.config import Settings
import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np
import ollama

# Configuration
CONFIDENCE_THRESHOLD = 0.45  # distance < 0.45 = similarity > 0.55 (high confidence for direct answer)
USE_OLLAMA = True  # Set to False to disable LLM fallback
OLLAMA_MODEL = "gemma3:1b"  # Ollama model name
LLM_TEMPERATURE = 0.3  # Low temperature to reduce hallucinations (0.0-1.0)

def get_embedding(text, model, tokenizer, is_query=True):
    # Add instruction for query
    if is_query:
        text = f"Represent this sentence for searching relevant passages: {text}"
    
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        # Use mean pooling on the last hidden state
        embeddings = outputs.last_hidden_state.mean(dim=1)
        # Normalize the embeddings
        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
    return embeddings[0].numpy()


def generate_with_ollama(query, context_docs, model_name=OLLAMA_MODEL):
    """
    Generate a response using Ollama with RAG (Retrieval Augmented Generation).
    Uses retrieved context to ground the LLM response.
    """
    try:
        # Build context from retrieved documents
        context = "\n\n".join([f"Context {i+1}:\n{doc}" for i, doc in enumerate(context_docs)])
        
        # Create prompt with context
        prompt = f"""You are a helpful chatbot assistant for a university club management system called CluboraX. 
Use the following context to answer the user's question. If the context doesn't contain enough information, 
say so honestly - do not make up information.

Context from knowledge base:
{context}

User Question: {query}

Answer (be concise and accurate):"""
        # Call Ollama API
        response = ollama.chat(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful assistant for CluboraX, a university club management system. Be concise and accurate. Never make up information."},
                {"role": "user", "content": prompt}
            ],
            options={
                "temperature": LLM_TEMPERATURE,
                "top_p": 0.9,
                "num_predict": 200,  # Limit response length
            }
        )
        
        return response['message']['content'].strip()
    
    except Exception as e:
        return f"Error generating response with Ollama: {str(e)}\nMake sure Ollama is running with: ollama serve"

# Load the ChromaDB collection from persistent storage
client = chromadb.PersistentClient(path="aichatbot/chroma_db")
collection = client.get_or_create_collection("event_qa")

# Load BAAI/bge-base-en-v1.5 model
model_name = "BAAI/bge-base-en-v1.5"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)
model.eval()

print("=" * 60)
print("CluboraX AI Chatbot (Hybrid RAG Mode)")
print("Embedding: BAAI/bge-base-en-v1.5 | LLM: Gemma 3 via Ollama")
print("=" * 60)
print("How can we help you? (Type 'exit' to quit)\n")

while True:
    query = input("You: ").strip()
    if query.lower() == 'exit':
        print("Goodbye!")
        break
    if len(query.split()) < 3:  # Check if the input is too short to be a valid question
        print("Bot: Please enter a valid question with at least 3 words.\n")
        continue
    
    # Get query embedding
    query_emb = get_embedding(query, model, tokenizer, is_query=True)
    
    # Query ChromaDB for the most similar Q&As (get top 3 for context)
    results = collection.query(
        query_embeddings=[query_emb.tolist()],
        n_results=3,
        include=["documents", "distances"]
    )
    
    if results["documents"] and results["documents"][0] and results["distances"] and results["distances"][0]:
        distance = results["distances"][0][0]
        top_doc = results["documents"][0][0]
        
        # Three-tier confidence system
        if distance < CONFIDENCE_THRESHOLD:  # distance < 0.45 = High confidence
            # Tier 1: Return pre-written answer directly
            answer = top_doc.split('\n', 1)[-1] if '\n' in top_doc else top_doc
            print(f"Bot [Retrieved] (distance: {distance:.4f}): {answer}\n")
        
        elif distance < 0.5:  # Medium confidence: 0.35 <= distance < 0.5
            # Tier 2: Use LLM with context (RAG)
            if USE_OLLAMA:
                print(f"Bot [AI-Generated] (distance: {distance:.4f})...", end="\r")
                context_docs = results["documents"][0][:3]  # Top 3 results as context
                llm_response = generate_with_ollama(query, context_docs)
                print(f"Bot [AI-Generated] (distance: {distance:.4f}): {llm_response}\n")
            else:
                print(f"Bot [Uncertain] (distance: {distance:.4f}): I'm not confident about this answer. Please rephrase your question or contact support.\n")
        
        else:  # Low confidence: distance >= 0.5
            # Tier 3: Don't answer - reduce hallucination
            print(f"Bot [Refused] (distance: {distance:.4f}): I don't have information about that. Please try a different question or contact support.\n")
    else:
        print("Bot: Sorry, I don't have enough information to answer that.\n")
