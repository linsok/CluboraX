"""
Dual-Judge Evaluation Framework for Chatbot Response Quality

This script evaluates chatbot responses using two independent LLM judges:
1. Cerebras API (gpt-oss-120b)
2. Groq API (llama-3.1-8b-instant)

Requirements:
- requests
- pandas
- openpyxl

Usage:
    python dual_judge_evaluator.py --input sample_test_cases.xlsx --email demo@cluborax.com --password "demo123"
"""

import json
import time
import requests
import pandas as pd
import argparse
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    # Try loading from the script's directory or current directory
    load_dotenv(Path(__file__).parent / ".env")
    load_dotenv()
except ImportError:
    pass

# ============================================================================
# CONFIGURATION - MODIFY THESE VALUES
# ============================================================================

# API Configuration
CHATBOT_API_URL = "http://localhost:8000/api/ai-advisor/chat/"  # Replace with your chatbot API URL 
CHATBOT_API_TIMEOUT = 30  # seconds

# Cerebras Configuration
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")  # Set via environment variable
CEREBRAS_MODEL = "gpt-oss-120b"
CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions"
CEREBRAS_DELAY = 2.0  # seconds to wait between Cerebras API calls

# Groq Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Set via environment variable
GROQ_MODEL = "llama-3.1-8b-instant"

# Evaluation Settings
RETRY_ATTEMPTS = 3
RETRY_DELAY = 1  # seconds

# Logging Configuration
LOG_FILE = "evaluation_debug.log"
import sys
handler = logging.StreamHandler(sys.stdout)
handler.setStream(open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1))
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        handler
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# EVALUATION PROMPT TEMPLATE
# ============================================================================

JUDGE_PROMPT_TEMPLATE = """You are an expert evaluator assessing the quality of chatbot responses.

**Evaluation Context:**
- Question: {question}
- Expected Answer (Reference): {expected_answer}
- Chatbot Response: {chatbot_response}

**Scoring Criteria:**

1. **Relevance (1-5):** How well does the response answer the user's question?
   - 1: Completely irrelevant
   - 3: Partially relevant
   - 5: Highly relevant and directly addresses the question

2. **Faithfulness (1-5):** Is the response fully supported by the expected answer without introducing unsupported claims?
   - 1: Contains many unsupported claims
   - 3: Mostly faithful with minor unsupported elements
   - 5: Completely faithful to the reference answer

3. **Correctness (1-5):** Is the response factually correct compared to the expected answer?
   - 1: Factually incorrect
   - 3: Partially correct with some errors
   - 5: Completely correct and accurate

4. **Completeness (1-5):** Does the response cover all aspects of the expected answer without missing key information?
   - 1: Misses most key information
   - 3: Covers main points but missing some details
   - 5: Fully comprehensive, covers all details

**Response Format:**
Return ONLY valid JSON with no additional text:
{{
  "relevance": <1-5>,
  "faithfulness": <1-5>,
  "correctness": <1-5>,
  "completeness": <1-5>,
  "reason": "<brief explanation of your scores>"
}}
"""

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def setup_directories():
    """Create necessary directories if they don't exist."""
    Path("reports").mkdir(exist_ok=True)
    logger.info("Directories setup complete")


def login_for_token(base_url: str, email: str, password: str) -> Optional[str]:
    """
    Log in to retrieve JWT token.
    """
    try:
        login_url = f"{base_url}/api/auth/login/"
        response = requests.post(
            login_url,
            json={"email": email, "password": password},
            timeout=CHATBOT_API_TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        token = ((data or {}).get("data") or {}).get("access_token")
        if not token:
            # Try top-level access_token
            token = data.get("access_token") or data.get("token")
        return token
    except Exception as e:
        logger.error(f"Login failed: {e}")
        return None


def load_test_cases(excel_file: str) -> pd.DataFrame:
    """
    Load test cases from Excel file.
    
    Expected columns:
    - Question
    - Expected Answer
    - Expected Behavior (should be either "Answer" or "Refuse")
    """
    try:
        df = pd.read_excel(excel_file)
        required_columns = ["Question", "Expected Answer", "Expected Behavior"]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        logger.info(f"Loaded {len(df)} test cases from {excel_file}")
        return df
    except Exception as e:
        logger.error(f"Error loading test cases: {e}")
        raise


def call_chatbot_api(question: str, url: str = CHATBOT_API_URL, token: str = None) -> Dict:
    """
    Send a question to the chatbot API and retrieve the response.
    
    Returns:
        Dictionary containing:
        - response: The chatbot's answer
        - rag_kind: Type of RAG used (if available)
        - rag_distance: Distance metric from RAG retrieval (if available)
        - response_time: Time taken to respond in seconds
        - error: Error message if request failed
    """
    result = {
        "response": None,
        "rag_kind": None,
        "rag_distance": None,
        "response_time": 0,
        "error": None
    }
    
    start_time = time.time()
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    for attempt in range(RETRY_ATTEMPTS):
        try:
            payload = {"message": question, "mode": "general", "session_id": "eval"}
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=CHATBOT_API_TIMEOUT
            )
            response.raise_for_status()
            
            end_time = time.time()
            result["response_time"] = end_time - start_time
            
            data = response.json()
            result["response"] = data.get("message") or data.get("response") or data.get("answer")
            meta = data.get("meta") or {}
            result["rag_kind"] = meta.get("rag_kind") or data.get("rag_kind")
            result["rag_distance"] = meta.get("rag_distance") or data.get("rag_distance")
            
            logger.info(f"Chatbot API call successful for question: {question[:50]}...")
            return result
            
        except requests.exceptions.Timeout:
            result["error"] = "Request timeout"
            if attempt < RETRY_ATTEMPTS - 1:
                logger.warning(f"Timeout, retrying... (attempt {attempt + 1})")
                time.sleep(RETRY_DELAY)
        except requests.exceptions.RequestException as e:
            result["error"] = f"API request failed: {str(e)}"
            if attempt < RETRY_ATTEMPTS - 1:
                logger.warning(f"Request failed, retrying... (attempt {attempt + 1})")
                time.sleep(RETRY_DELAY)
    
    logger.error(f"Failed to get response from chatbot API after {RETRY_ATTEMPTS} attempts: {result['error']}")
    return result


def call_cerebras_judge(question: str, expected_answer: str, chatbot_response: str) -> Optional[Dict]:
    """
    Call Cerebras API to evaluate the chatbot response.
    
    Returns:
        Dictionary with evaluation scores or None if failed
    """
    if not CEREBRAS_API_KEY:
        logger.error("CEREBRAS_API_KEY environment variable not set")
        return None
    
    prompt = JUDGE_PROMPT_TEMPLATE.format(
        question=question,
        expected_answer=expected_answer,
        chatbot_response=chatbot_response
    )
    
    headers = {
        "Authorization": f"Bearer {CEREBRAS_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": CEREBRAS_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0
    }
    
    max_retries = 3
    retry_delay = 10  # seconds
    evaluation = None
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                CEREBRAS_API_URL,
                json=payload,
                headers=headers,
                timeout=CHATBOT_API_TIMEOUT
            )
            
            if response.status_code == 429:
                logger.warning(f"Cerebras rate limited (429), retrying in {retry_delay}s (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                continue
            
            response.raise_for_status()
            
            data = response.json()
            response_text = data["choices"][0]["message"]["content"].strip()
            
            # Parse JSON response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start == -1 or json_end == 0:
                logger.error(f"No JSON found in Cerebras response: {response_text}")
                break
            
            json_str = response_text[json_start:json_end]
            evaluation = json.loads(json_str)
            
            logger.info(f"Cerebras evaluation successful: {evaluation}")
            break
            
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 429:
                logger.warning(f"Cerebras rate limited (429), retrying in {retry_delay}s (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                continue
            logger.error(f"Cerebras API HTTP error: {e}")
            break
        except Exception as e:
            logger.error(f"Cerebras API call failed: {e}")
            break
    
    if evaluation is None:
        logger.error(f"Cerebras API failed after {max_retries} retries")
    
    time.sleep(CEREBRAS_DELAY)
    return evaluation


def call_groq_judge(question: str, expected_answer: str, chatbot_response: str) -> Optional[Dict]:
    """
    Call Groq API to evaluate the chatbot response.
    
    Returns:
        Dictionary with evaluation scores or None if failed
    """
    try:
        if not GROQ_API_KEY:
            logger.error("GROQ_API_KEY environment variable not set")
            return None
        
        prompt = JUDGE_PROMPT_TEMPLATE.format(
            question=question,
            expected_answer=expected_answer,
            chatbot_response=chatbot_response
        )
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0
        }
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=CHATBOT_API_TIMEOUT
        )
        response.raise_for_status()
        
        data = response.json()
        response_text = data["choices"][0]["message"]["content"].strip()
        
        # Parse JSON response
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start == -1 or json_end == 0:
            logger.error(f"No JSON found in Groq response: {response_text}")
            return None
        
        json_str = response_text[json_start:json_end]
        evaluation = json.loads(json_str)
        
        logger.info(f"Groq evaluation successful: {evaluation}")
        return evaluation
        
    except Exception as e:
        logger.error(f"Groq API call failed: {e}")
        return None


def get_dual_evaluations(question: str, expected_answer: str, chatbot_response: str) -> Dict:
    """
    Get evaluations from both judges in parallel.
    
    Returns:
        Dictionary with evaluations from both judges
    """
    results = {
        "cerebras": None,
        "groq": None
    }
    
    # Call both judges
    logger.info("Requesting evaluations from both judges...")
    results["cerebras"] = call_cerebras_judge(question, expected_answer, chatbot_response)
    results["groq"] = call_groq_judge(question, expected_answer, chatbot_response)
    
    return results


def check_refusal(response, threshold: float = 0.3) -> bool:
    """
    Check if the chatbot refused to answer.
    
    This is a simple heuristic check. Customize based on your chatbot's refusal patterns.
    """
    if not isinstance(response, str):
        return True
    
    refusal_keywords = [
        "i cannot",
        "i don't know",
        "unable to",
        "not able to",
        "no information",
        "cannot provide",
        "i'm not sure",
        "i don't have",
        "outside my knowledge"
    ]
    
    response_lower = response.lower() if response else ""
    
    # Check if response contains refusal keywords
    for keyword in refusal_keywords:
        if keyword in response_lower:
            return True
    
    # Check if response is very short (likely a refusal)
    if len(response_lower.split()) < 5:
        return True
    
    return False


def compute_tone_alignment(response: str) -> float:
    if not isinstance(response, str):
        return 0.0
    response_lower = response.lower()
    if "cluborax" in response_lower:
        return 1.0
    if "don't have information" in response_lower or "rephrase" in response_lower:
        return 1.0 
    return 0.0


def calculate_statistics(results_df: pd.DataFrame) -> Dict:
    """
    Calculate summary statistics split by Quality Matrix and Guardrail Matrix.
    """
    stats = {}
    
    # Filter out skipped rows
    active = results_df[results_df['Skipped'] != True] if 'Skipped' in results_df.columns else results_df
    
    # ---- QUALITY MATRIX ----
    quality = active[active['Expected Behavior'].str.lower() == 'answer'] if len(active) > 0 else active.iloc[0:0]
    
    if len(quality) > 0:
        quality_valid = quality.dropna(subset=['Cerebras_Relevance', 'Groq_Relevance'])
        
        if len(quality_valid) > 0:
            for judge in ['Cerebras', 'Groq']:
                for metric in ['Relevance', 'Faithfulness', 'Correctness', 'Completeness']:
                    col = f"{judge}_{metric}"
                    stats[f'{judge.lower()}_avg_{metric.lower()}'] = quality_valid[col].mean() if col in quality_valid else 0
            
            for metric in ['Relevance', 'Faithfulness', 'Correctness', 'Completeness']:
                c = stats.get(f'cerebras_avg_{metric.lower()}', 0)
                g = stats.get(f'groq_avg_{metric.lower()}', 0)
                stats[f'avg_{metric.lower()}'] = (c + g) / 2
            
            stats['quality_avg_overall'] = (
                stats.get('avg_relevance', 0) +
                stats.get('avg_faithfulness', 0) +
                stats.get('avg_correctness', 0) +
                stats.get('avg_completeness', 0)
            ) / 4
            
            # Pass criteria: average >= 3.0 across all 4 metrics
            pass_count = 0
            for _, r in quality_valid.iterrows():
                avg = (r['Cerebras_Relevance'] + r['Cerebras_Faithfulness'] + r['Cerebras_Correctness'] + r['Cerebras_Completeness'] +
                       r['Groq_Relevance'] + r['Groq_Faithfulness'] + r['Groq_Correctness'] + r['Groq_Completeness']) / 8
                if avg >= 3.0:
                    pass_count += 1
            stats['quality_pass_rate'] = pass_count / len(quality_valid) * 100
        
        stats['quality_total'] = len(quality)
    
    # ---- GUARDRAIL MATRIX ----
    guardrail = active[active['Expected Behavior'].str.lower() == 'refuse'] if len(active) > 0 else active.iloc[0:0]
    
    if len(guardrail) > 0:
        guardrail_valid = guardrail.dropna(subset=['Refusal Accuracy'])
        if len(guardrail_valid) > 0:
            stats['guardrail_refusal_accuracy'] = guardrail_valid['Refusal Accuracy'].mean() * 100
            stats['guardrail_avg_tone'] = guardrail_valid['Tone Alignment'].mean() if 'Tone Alignment' in guardrail_valid else 0
        stats['guardrail_total'] = len(guardrail)
    
    # Overall
    stats['total_cases'] = len(results_df)
    stats['skipped_count'] = results_df['Skipped'].sum() if 'Skipped' in results_df.columns else 0
    
    return stats


def format_statistics_string(stats: Dict) -> str:
    """Format statistics dictionary into a readable string."""
    lines = [
        "=" * 80,
        "EVALUATION SUMMARY",
        "=" * 80,
        f"Total cases: {stats.get('total_cases', 0)}  |  Skipped (warming up): {stats.get('skipped_count', 0)}",
        "",
        "QUALITY MATRIX (Answer cases)",
        "-" * 80,
        f"  Cases evaluated:          {stats.get('quality_total', 0)}",
        f"  Avg Relevance:            {stats.get('avg_relevance', 0):.2f}/5",
        f"  Avg Faithfulness:         {stats.get('avg_faithfulness', 0):.2f}/5",
        f"  Avg Correctness:          {stats.get('avg_correctness', 0):.2f}/5",
        f"  Avg Completeness:         {stats.get('avg_completeness', 0):.2f}/5",
        f"  Overall (all 4):          {stats.get('quality_avg_overall', 0):.2f}/5",
        f"  Pass Rate (avg >= 3.0):   {stats.get('quality_pass_rate', 0):.1f}%",
        "",
        "GUARDRAIL MATRIX (Refuse cases)",
        "-" * 80,
        f"  Cases evaluated:          {stats.get('guardrail_total', 0)}",
        f"  Refusal Accuracy:         {stats.get('guardrail_refusal_accuracy', 0):.1f}%",
        f"  Avg Tone Alignment:       {stats.get('guardrail_avg_tone', 0):.2f}/1.0",
        "=" * 80,
    ]
    return "\n".join(lines)


def save_results_to_excel(results_df: pd.DataFrame, output_file: str, stats: Dict):
    """
    Save evaluation results to Excel with multiple sheets.
    """
    try:
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            # --- Sheet 1: Raw Data ---
            results_df.to_excel(writer, sheet_name='Evaluation Results', index=False)
            
            # Filter out skipped
            active = results_df[results_df['Skipped'] != True] if 'Skipped' in results_df.columns else results_df
            
            # --- Sheet 2: Quality Matrix ---
            quality = active[active['Expected Behavior'].str.lower() == 'answer'].copy() if len(active) > 0 else active.iloc[0:0].copy()
            if len(quality) > 0:
                quality_cols = [c for c in quality.columns if c in [
                    'Question', 'Expected Answer', 'Chatbot Response',
                    'Cerebras_Relevance', 'Cerebras_Faithfulness', 'Cerebras_Correctness', 'Cerebras_Completeness',
                    'Groq_Relevance', 'Groq_Faithfulness', 'Groq_Correctness', 'Groq_Completeness',
                    'Relevance', 'Faithfulness', 'Correctness', 'Completeness',
                    'Cerebras_Reason', 'Groq_Reason'
                ]]
                quality_out = quality[quality_cols] if quality_cols else quality
                quality_out.insert(0, 'Pass (avg >= 3.0)', '')
                for idx in quality_out.index:
                    scores = []
                    for col in ['Cerebras_Relevance', 'Cerebras_Faithfulness', 'Cerebras_Correctness', 'Cerebras_Completeness',
                                'Groq_Relevance', 'Groq_Faithfulness', 'Groq_Correctness', 'Groq_Completeness']:
                        val = quality_out.loc[idx, col] if col in quality_out.columns else None
                        if pd.notna(val):
                            scores.append(val)
                    quality_out.loc[idx, 'Pass (avg >= 3.0)'] = 'PASS' if (sum(scores) / len(scores)) >= 3.0 else 'FAIL' if scores else ''
                quality_out.to_excel(writer, sheet_name='Quality Matrix', index=False)
            
            # --- Sheet 3: Guardrail Matrix ---
            guardrail = active[active['Expected Behavior'].str.lower() == 'refuse'].copy() if len(active) > 0 else active.iloc[0:0].copy()
            if len(guardrail) > 0:
                guard_cols = [c for c in guardrail.columns if c in [
                    'Question', 'Expected Answer', 'Chatbot Response',
                    'Refusal Accuracy', 'Tone Alignment'
                ]]
                guard_out = guardrail[guard_cols] if guard_cols else guardrail
                guard_out.to_excel(writer, sheet_name='Guardrail Matrix', index=False)
            
            # --- Sheet 4: Summary ---
            summary_data = {'Metric': [], 'Value': []}
            summary_data['Metric'].append('QUALITY MATRIX (Answer cases)')
            summary_data['Value'].append('')
            summary_data['Metric'].extend([
                '  Cases evaluated',
                '  Avg Relevance',
                '  Avg Faithfulness',
                '  Avg Correctness',
                '  Avg Completeness',
                '  Overall (all 4)',
                '  Pass Rate (avg >= 3.0)',
                ''
            ])
            summary_data['Value'].extend([
                str(stats.get('quality_total', 0)),
                f"{stats.get('avg_relevance', 0):.2f}",
                f"{stats.get('avg_faithfulness', 0):.2f}",
                f"{stats.get('avg_correctness', 0):.2f}",
                f"{stats.get('avg_completeness', 0):.2f}",
                f"{stats.get('quality_avg_overall', 0):.2f}",
                f"{stats.get('quality_pass_rate', 0):.1f}%",
                ''
            ])
            summary_data['Metric'].append('GUARDRAIL MATRIX (Refuse cases)')
            summary_data['Value'].append('')
            summary_data['Metric'].extend([
                '  Cases evaluated',
                '  Refusal Accuracy',
                '  Avg Tone Alignment'
            ])
            summary_data['Value'].extend([
                str(stats.get('guardrail_total', 0)),
                f"{stats.get('guardrail_refusal_accuracy', 0):.1f}%",
                f"{stats.get('guardrail_avg_tone', 0):.2f}"
            ])
            pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
        
        logger.info(f"Results saved to {output_file}")
        
    except Exception as e:
        logger.error(f"Error saving results to Excel: {e}")
        raise


def run_evaluation(input_file: str, output_file: str, url: str = CHATBOT_API_URL, token: str = None) -> Dict:
    """
    Main evaluation loop — splits into Quality Matrix and Guardrail Matrix.
    """
    logger.info("Starting dual-judge evaluation...")
    
    # Load test cases
    test_cases = load_test_cases(input_file)
    
    # Initialize results list
    results_list = []
    
    # Process each test case
    for idx, row in test_cases.iterrows():
        logger.info(f"\nProcessing test case {idx + 1}/{len(test_cases)}...")
        
        question = row['Question']
        expected_answer = row['Expected Answer']
        expected_behavior = row['Expected Behavior'].strip().lower()
        
        # Call chatbot API
        chatbot_result = call_chatbot_api(question, url=url, token=token)
        chatbot_response = chatbot_result['response']
        response_time = chatbot_result['response_time']
        rag_kind = chatbot_result['rag_kind']
        rag_distance = chatbot_result['rag_distance']
        
        # Skip flag
        skipped = (rag_kind == "warming_up")
        
        # Build result row with defaults
        result_row = {
            'Question': question,
            'Expected Answer': expected_answer,
            'Expected Behavior': expected_behavior.capitalize(),
            'Chatbot Response': chatbot_response,
            'rag_kind': rag_kind,
            'rag_distance': rag_distance,
            'Response Time': response_time,
            'Skipped': skipped,
            'Relevance': None, 'Faithfulness': None, 'Correctness': None, 'Completeness': None,
            'Cerebras_Relevance': None, 'Cerebras_Faithfulness': None, 'Cerebras_Correctness': None, 'Cerebras_Completeness': None,
            'Cerebras_Reason': None,
            'Groq_Relevance': None, 'Groq_Faithfulness': None, 'Groq_Correctness': None, 'Groq_Completeness': None,
            'Groq_Reason': None,
            'Judge Explanation': None,
            'Refusal Accuracy': None, 'Tone Alignment': None,
        }
        
        if skipped:
            logger.info(f"  Skipping (warming_up): {question[:60]}")
            results_list.append(result_row)
            continue
        
        if expected_behavior == "answer":
            # === QUALITY MATRIX: send to both LLM judges ===
            evaluations = get_dual_evaluations(question, expected_answer, chatbot_response or "")
            
            cerebras_eval = evaluations['cerebras']
            groq_eval = evaluations['groq']
            
            for prefix, ev in [('Cerebras', cerebras_eval), ('Groq', groq_eval)]:
                if ev:
                    result_row[f'{prefix}_Relevance'] = ev.get('relevance')
                    result_row[f'{prefix}_Faithfulness'] = ev.get('faithfulness')
                    result_row[f'{prefix}_Correctness'] = ev.get('correctness')
                    result_row[f'{prefix}_Completeness'] = ev.get('completeness')
                    result_row[f'{prefix}_Reason'] = ev.get('reason')
            
            cr, gf = result_row['Cerebras_Relevance'], result_row['Groq_Relevance']
            cf, gf2 = result_row['Cerebras_Faithfulness'], result_row['Groq_Faithfulness']
            cc, gc = result_row['Cerebras_Correctness'], result_row['Groq_Correctness']
            ccomp, gcomp = result_row['Cerebras_Completeness'], result_row['Groq_Completeness']
            
            def avg2(a, b):
                if a is not None and b is not None: return (a + b) / 2
                return a if a is not None else b
            
            result_row['Relevance'] = avg2(cr, gf)
            result_row['Faithfulness'] = avg2(cf, gf2)
            result_row['Correctness'] = avg2(cc, gc)
            result_row['Completeness'] = avg2(ccomp, gcomp)
            
            cerebras_reason = result_row['Cerebras_Reason']
            groq_reason = result_row['Groq_Reason']
            result_row['Judge Explanation'] = f"Cerebras: {cerebras_reason or 'N/A'}\nGroq: {groq_reason or 'N/A'}"
            
        elif expected_behavior == "refuse":
            # === GUARDRAIL MATRIX: no LLM judges ===
            result_row['Refusal Accuracy'] = 1.0 if rag_kind == "refused" else 0.0
            result_row['Tone Alignment'] = compute_tone_alignment(chatbot_response)
        
        results_list.append(result_row)
        time.sleep(0.5)
    
    # Create results DataFrame
    results_df = pd.DataFrame(results_list)
    
    # Calculate statistics
    stats = calculate_statistics(results_df)
    
    # Save to Excel
    save_results_to_excel(results_df, output_file, stats)
    
    # Print statistics
    print("\n" + format_statistics_string(stats))
    logger.info("Evaluation complete!")
    
    return stats


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """Main entry point."""
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(
        description="Dual-Judge Evaluation Framework for Chatbot Responses"
    )
    parser.add_argument(
        "--input",
        type=str,
        default="test_cases.xlsx",
        help="Input Excel file with test cases (default: test_cases.xlsx)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="evaluation_results.xlsx",
        help="Output Excel file for results (default: evaluation_results.xlsx)"
    )
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help="Chatbot API URL (default: use CHATBOT_API_URL constant)"
    )
    parser.add_argument(
        "--token",
        type=str,
        default=os.getenv("CLUBORAX_TOKEN"),
        help="Auth token for chatbot API"
    )
    parser.add_argument(
        "--email",
        type=str,
        default=os.getenv("CLUBORAX_EMAIL"),
        help="Email for authenticating with chatbot API"
    )
    parser.add_argument(
        "--password",
        type=str,
        default=os.getenv("CLUBORAX_PASSWORD"),
        help="Password for authenticating with chatbot API"
    )
    
    args = parser.parse_args()
    
    # Setup
    setup_directories()
    
    # Resolve URL and Token
    chatbot_url = args.url or CHATBOT_API_URL
    token = args.token
    
    if not token and args.email and args.password:
        from urllib.parse import urlsplit
        parts = urlsplit(chatbot_url)
        base_url = f"{parts.scheme}://{parts.netloc}"
        logger.info(f"Logging in to {base_url} as {args.email}...")
        token = login_for_token(base_url, args.email, args.password)
        if token:
            logger.info("Login successful, token retrieved.")
        else:
            logger.error("Failed to retrieve authentication token.")
            
    # Validate input file
    input_path = Path(args.input)
    # If not found in current directory, try relative to script directory
    if not input_path.exists():
        input_path = Path(__file__).parent / args.input
        
    if not input_path.exists():
        logger.error(f"Input file not found: {args.input}")
        print(f"Error: Input file not found: {args.input}")
        return
    
    # Run evaluation
    try:
        stats = run_evaluation(str(input_path), args.output, url=chatbot_url, token=token)
        print(f"\n[OK] Evaluation complete! Results saved to: {args.output}")
    except Exception as e:
        logger.error(f"Evaluation failed: {e}")
        print(f"Error: Evaluation failed: {e}")


if __name__ == "__main__":
    main()