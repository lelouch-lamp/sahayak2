import os
import pickle
import numpy as np
import logging
from typing import List, Dict
import cohere
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


if not COHERE_API_KEY or not GEMINI_API_KEY:
    raise ValueError("API keys are missing. Set them as environment variables.")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load templates
templates = Jinja2Templates(directory="frontend/templates")

def load_vector_db(file_path: str = "embeddings.pkl") -> Dict:
    """Loads vector database from a pickle file."""
    try:
        with open(file_path, 'rb') as f:
            vector_db = pickle.load(f)
        return vector_db
    except Exception as e:
        logging.error(f"Error loading vector database: {e}")
        return {}

def format_documents_for_analysis(results: List[Dict]) -> str:
    """Formats retrieved documents for analysis."""
    if not results:
        return "No relevant documents found."
    
    formatted_docs = "\n".join(
        [
            f"Document {i+1} (Relevance: {result['similarity']:.4f})\n"
            f"Title: {result['page']['title']}\n"
            f"Source: {result['page']['url']}\n"
            f"Path: {result['page']['breadcrumb']}\n"
            f"Content:\n{result['page']['text']}\n"
            for i, result in enumerate(results)
        ]
    )
    return formatted_docs

def analyze_with_gemini(query: str, documents: str) -> str:
    """Uses Gemini API to analyze retrieved documents."""
    try:
        prompt = (
            f"You are a document expert. Use the following document as context to answer the query:\n\n"
            f"Document:\n{documents}\n\nQuery: {query}"
            if documents else 
            f"Give an answer based on your knowledge or related to Ishanya Foundation since no relevant document was found:\n\nQuery: {query}"
        )
        
        response = model.generate_content([{"parts": [{"text": prompt}]}])
        return response.text if response else "No response from Gemini API."
    except Exception as e:
        logging.error(f"Error communicating with Gemini API: {e}")
        return f"Error communicating with Gemini API: {str(e)}"

def search_function(query: str, vector_db: Dict, top_k: int = 3, threshold: float = 0.65):
    """Searches for relevant documents using Cohere embeddings."""
    try:
        co_client = cohere.Client(COHERE_API_KEY)
        query_embedding = co_client.embed(model='multilingual-22-12', texts=[query]).embeddings[0]
        
        pages = vector_db.get("pages", [])
        embeddings = vector_db.get("embeddings", [])

        results = [
            {'page': page, 'similarity': np.dot(query_embedding, embedding)}
            for page, embedding in zip(pages, embeddings)
            if np.dot(query_embedding, embedding) >= threshold
        ]

        return sorted(results, key=lambda x: x['similarity'], reverse=True)[:top_k]
    except Exception as e:
        logging.error(f"Error during search: {e}")
        return []

@app.get("/search")
def search_and_analyze(
    query: str = Query(..., description="User's search query"),
    vector_db_path: str = "embeddings.pkl",
    top_k: int = 5,
    threshold: float = 0.65
):
    """Handles search requests and returns analysis using retrieved documents."""
    logging.debug(f"Received search query: {query}")
    vector_db = load_vector_db(vector_db_path)
    
    if not vector_db:
        logging.error("Error loading vector database.")
        raise HTTPException(status_code=500, detail="Error loading vector database.")
    
    search_results = search_function(query, vector_db, top_k=top_k, threshold=threshold)
    
    if not search_results:
        logging.warning(f"No results found for query: {query}")
        return {"query": query, "results": [], "analysis": "No relevant documents found."}
    
    formatted_docs = format_documents_for_analysis(search_results)
    analysis = analyze_with_gemini(query, formatted_docs)
    
    logging.debug(f"Returning search results for query: {query}")
    return {
    "query": query,
    "results": search_results,  # Include actual search results
    "analysis": analysis
}
