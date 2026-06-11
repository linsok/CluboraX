# Evaluator Setup Guide

This guide walks through setting up the CluboraX AI Advisor evaluation suite from scratch.

## Prerequisites

- Python 3.8+
- Access to the CluboraX backend running locally (default: `http://localhost:8000`)
- Cerebras API key (free tier available at https://cloud.cerebras.ai)
- Groq API key (free tier available at https://console.groq.com)

## Step 1: Install Dependencies

```bash
cd aichatbot/eval
pip install -r requirements_evaluator.txt
```

## Step 2: Configure API Keys

Copy your API keys into `.env`:

```
CEREBRAS_API_KEY=your_cerebras_key_here
GROQ_API_KEY=your_groq_key_here
```

## Step 3: Verify Environment

```bash
python setup_validator.py
```

Expected output:
```
==================================================
  EVALUATOR SETUP VALIDATOR
==================================================
Python version: 3.x.x
[OK] Python version OK
[OK] requests is installed
[OK] openpyxl is installed
[OK] dotenv is installed
[OK] .env file found
[OK] CEREBRAS_API_KEY is set (len=XX)
[OK] GROQ_API_KEY is set (len=XX)
==================================================
```

## Step 4: Generate Test Cases

```bash
python create_sample_test_cases.py
```

This creates `sample_test_cases.xlsx` with 75 questions across 3 tiers.

## Step 5: Run Evaluation

```bash
python dual_judge_evaluator.py --input sample_test_cases.xlsx --email admin@campus.edu --password admin123456
```

The backend must be running at `http://localhost:8000`.

## Step 6: Review Results

The output Excel file contains four sheets:

1. **Evaluation Results** — raw per-question data
2. **Quality Matrix** — Answer cases with PASS/FAIL and color coding
3. **Guardrail Matrix** — Refuse cases with accuracy and tone scores
4. **Summary** — aggregated pass rates and averages

## Troubleshooting

| Problem | Likely Fix |
|---------|------------|
| `401 Unauthorized` | Check email/password, ensure backend is running |
| `429 Too Many Requests` | Built-in retry handles this (3 retries, 10s backoff) |
| Unicode errors on Windows | Fixed automatically in `main()` |
| "No JSON found" | LLM response was malformed — check `evaluation_debug.log` |
