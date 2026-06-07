# Evaluation Suite — Index

## Files

| # | File | Description |
|---|------|-------------|
| 1 | `dual_judge_evaluator.py` | Main evaluation script — config, LLM judges, matrix logic, Excel export |
| 2 | `create_sample_test_cases.py` | Generates `sample_test_cases.xlsx` with 75 test cases across 3 tiers |
| 3 | `setup_validator.py` | Checks Python version, installed packages, and `.env` file |
| 4 | `analyze_results.py` | Reads evaluation results Excel and prints summary to console |
| 5 | `run_evaluation.py` | Convenience wrapper around `dual_judge_evaluator.main()` |
| 6 | `requirements_evaluator.txt` | Python package dependencies |
| 7 | `.env` | API keys (CEREBRAS_API_KEY, GROQ_API_KEY) |
| 8 | `sample_test_cases.xlsx` | Input: 75 curated test cases |

## Output Files

| File | Description |
|------|-------------|
| `*_results.xlsx` | Evaluation results with 4 sheets (created at runtime) |
| `evaluation_debug.log` | Detailed runtime log |

## Test Case Tiers

- **Tier 1 — Retrieval** (TC-RET-001 to 030): Simple fact-based queries about CluboraX
- **Tier 2 — Synthesis** (TC-SYN-001 to 020): Multi-step reasoning questions
- **Tier 3 — Refusal** (TC-REF-001 to 025): Questions the chatbot should refuse to answer

## Workflow

```
create_sample_test_cases.py  →  sample_test_cases.xlsx
                                       ↓
                              dual_judge_evaluator.py
                                       ↓
                              *_results.xlsx  (4 sheets)
                                       ↓
                              analyze_results.py (optional CLI review)
```
