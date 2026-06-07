# CluboraX AI Advisor — Evaluation Suite

This directory contains tools for evaluating the CluboraX AI Advisor chatbot using a dual-judge LLM system.

## Overview

The evaluator tests chatbot responses against 75 curated test cases across three tiers:

- **Tier 1 — Retrieval** (30 questions): Simple fact-based queries
- **Tier 2 — Synthesis** (20 questions): Multi-step reasoning questions
- **Tier 3 — Refusal** (25 questions): Questions the chatbot should refuse

Results are scored by two LLM judges (Cerebras gpt-oss-120b + Groq llama-3.1-8b-instant) and organized into Quality and Guardrail matrices.

## Quick Start

```bash
# Install dependencies
pip install -r requirements_evaluator.txt

# Run evaluation
python dual_judge_evaluator.py --input sample_test_cases.xlsx --email admin@campus.edu --password admin123456
```

## Key Files

| File | Purpose |
|------|---------|
| `dual_judge_evaluator.py` | Main evaluator with dual-judge logic, Excel export, and statistics |
| `create_sample_test_cases.py` | Generates the 75-sample test case workbook |
| `setup_validator.py` | Environment and dependency checker |
| `analyze_results.py` | CLI tool to inspect evaluation results |
| `run_evaluation.py` | Convenience entry point |
| `.env` | API keys for Cerebras and Groq |
| `sample_test_cases.xlsx` | 75 curated test cases |

## Output

The evaluator produces an Excel workbook with four sheets:

1. **Evaluation Results** — raw data dump
2. **Quality Matrix** — Answer cases scored on Relevance, Faithfulness, Correctness, Completeness
3. **Guardrail Matrix** — Refuse cases scored on Refusal Accuracy and Tone Alignment
4. **Summary** — aggregated statistics
