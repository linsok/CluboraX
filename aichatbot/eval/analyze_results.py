import os
import sys
import logging
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns


def extract_tier_from_id(test_case_id: str) -> str:
    id_upper = str(test_case_id).upper()
    if "RET" in id_upper:
        return "Tier 1 - Retrieval"
    if "SYN" in id_upper:
        return "Tier 2 - Synthesis"
    if "REF" in id_upper:
        return "Tier 3 - Refusal"
    return "Unknown"


def extract_tier_from_index(idx: int) -> str:
    if idx < 30:
        return "Tier 1 - Retrieval"
    elif idx < 50:
        return "Tier 2 - Synthesis"
    else:
        return "Tier 3 - Refusal"


def find_results_file() -> str:
    candidates = [f for f in os.listdir(".") if f.endswith("_results.xlsx") and not f.startswith("~$")]
    if candidates:
        return max(candidates, key=os.path.getmtime)
    if os.path.exists("evaluation_results.xlsx"):
        return "evaluation_results.xlsx"
    return None


def analyze_results(xlsx_path: str):
    if not os.path.exists(xlsx_path):
        print(f"[FAIL] File not found: {xlsx_path}")
        return

    df = pd.read_excel(xlsx_path, sheet_name="Evaluation Results")
    if df.empty:
        print("[FAIL] Evaluation Results sheet is empty")
        return

    # Handle different column schemas
    if "Test Case ID" in df.columns:
        df["Tier"] = df["Test Case ID"].apply(extract_tier_from_id)
    else:
        df["Tier"] = df.index.to_series().apply(extract_tier_from_index)

    if "Skipped" in df.columns:
        df["Skipped"] = df["Skipped"].fillna(False).astype(bool)
    else:
        df["Skipped"] = False

    answer_df = df[(df["Expected Behavior"] == "Answer") & (~df["Skipped"])].copy()
    refuse_df = df[(df["Expected Behavior"] == "Refuse") & (~df["Skipped"])].copy()

    # -- Per-LLM metrics ----------------------------------------------
    cerebras_cols = ["Cerebras_Relevance", "Cerebras_Faithfulness", "Cerebras_Correctness", "Cerebras_Completeness"]
    groq_cols = ["Groq_Relevance", "Groq_Faithfulness", "Groq_Correctness", "Groq_Completeness"]

    def valid_mean(series):
        vals = pd.to_numeric(series, errors="coerce").dropna()
        return vals.mean() if not vals.empty else 0.0

    cerebras_metrics = {c.split("_")[1]: valid_mean(answer_df[c]) for c in cerebras_cols}
    groq_metrics = {c.split("_")[1]: valid_mean(answer_df[c]) for c in groq_cols}

    def pass_rate(df, cols, threshold=3.0):
        scores = df[cols].apply(pd.to_numeric, errors="coerce")
        avg = scores.mean(axis=1)
        return (avg >= threshold).sum(), avg.notna().sum()

    c_pass, c_total = pass_rate(answer_df, cerebras_cols)
    g_pass, g_total = pass_rate(answer_df, groq_cols)

    all_cols = cerebras_cols + groq_cols
    both_pass, both_total = pass_rate(answer_df, all_cols)

    # -- Per-tier breakdown -------------------------------------------
    tier_order = ["Tier 1 - Retrieval", "Tier 2 - Synthesis", "Tier 3 - Refusal"]
    tier_stats = []
    for t in tier_order:
        t_answer = answer_df[answer_df["Tier"] == t]
        t_refuse = refuse_df[refuse_df["Tier"] == t]
        total = len(t_answer) + len(t_refuse)
        cp, ct = pass_rate(t_answer, cerebras_cols)
        gp, gt = pass_rate(t_answer, groq_cols)
        bp, bt = pass_rate(t_answer, all_cols)
        ra = pd.to_numeric(t_refuse.get("Refusal_Accuracy", pd.Series(dtype=float)), errors="coerce")
        ta = pd.to_numeric(t_refuse.get("Tone_Alignment", pd.Series(dtype=float)), errors="coerce")
        refusal_acc = ra.mean() if not ra.dropna().empty else None
        tone_align = ta.mean() if not ta.dropna().empty else None
        tier_stats.append({
            "Tier": t,
            "Total": total,
            "Answer": len(t_answer),
            "Refuse": len(t_refuse),
            "Cerebras Pass Rate": f"{cp / ct * 100:.1f}%" if ct else "N/A",
            "Groq Pass Rate": f"{gp / gt * 100:.1f}%" if gt else "N/A",
            "Combined Pass Rate": f"{bp / bt * 100:.1f}%" if bt else "N/A",
            "Refusal Accuracy": f"{refusal_acc * 100:.1f}%" if refusal_acc is not None else "N/A",
            "Tone Alignment": f"{tone_align:.2f}" if tone_align is not None else "N/A",
        })

    # -- Console report -----------------------------------------------
    print("=" * 62)
    print("   CLUBORAX EVALUATION — FULL ANALYSIS")
    print("=" * 62)

    print(f"\n   Total test cases: {len(df)}")
    print(f"   Answer cases:     {len(answer_df)} (evaluated)")
    print(f"   Refuse cases:     {len(refuse_df)} (guardrail)")
    skipped = df["Skipped"].sum()
    if skipped:
        print(f"   Skipped:          {int(skipped)}")

    print(f"\n   {'-' * 40}")
    print(f"   LLM METRICS (avg score 1-5, Answer cases only)")
    print(f"   {'-' * 40}")
    print(f"   {'Metric':<20} {'Cerebras':>10} {'Groq':>10} {'Avg':>10}")
    print(f"   {'-' * 50}")
    for m in ["Relevance", "Faithfulness", "Correctness", "Completeness"]:
        cv = cerebras_metrics.get(m, 0)
        gv = groq_metrics.get(m, 0)
        av = (cv + gv) / 2
        print(f"   {m:<20} {cv:>10.2f} {gv:>10.2f} {av:>10.2f}")

    print(f"\n   {'-' * 40}")
    print(f"   PASS RATE (avg >= 3.0)")
    print(f"   {'-' * 40}")
    print(f"   Cerebras:  {c_pass}/{c_total} = {c_pass / c_total * 100:.1f}%" if c_total else "   Cerebras:  N/A")
    print(f"   Groq:      {g_pass}/{g_total} = {g_pass / g_total * 100:.1f}%" if g_total else "   Groq:      N/A")
    print(f"   Combined:  {both_pass}/{both_total} = {both_pass / both_total * 100:.1f}%" if both_total else "   Combined:  N/A")

    print(f"\n   {'-' * 50}")
    print(f"   PER-TIER BREAKDOWN")
    print(f"   {'-' * 50}")
    tier_hdr = f"   {'Tier':<22} {'Total':>6} {'Cereb%':>8} {'Groq%':>8} {'Both%':>8} {'RefAcc%':>8} {'Tone':>8}"
    print(tier_hdr)
    print(f"   {'-' * 68}")
    for ts in tier_stats:
        print(f"   {ts['Tier']:<22} {ts['Total']:>6} {ts['Cerebras Pass Rate']:>8} {ts['Groq Pass Rate']:>8} {ts['Combined Pass Rate']:>8} {ts['Refusal Accuracy']:>8} {ts['Tone Alignment']:>8}")
    print()

    # -- Generate individual PNG charts -------------------------------
    plot_llm_comparison(cerebras_metrics, groq_metrics)
    plot_pass_rate(c_pass, c_total, g_pass, g_total, both_pass, both_total)
    plot_pass_rate_by_tier(tier_stats)
    plot_refusal_chart(refuse_df)
    
    print(f"[OK] Generated: llm_comparison.png, pass_rate_comparison.png, pass_rate_by_tier.png, guardrail_refusal_metrics.png")


def plot_llm_comparison(cm, gm):
    sns.set_theme(style="whitegrid")
    plt.rcParams["font.sans-serif"] = "Arial"
    plt.rcParams["font.family"] = "sans-serif"
    fig, ax = plt.subplots(figsize=(10, 6))
    metrics = ["Relevance", "Faithfulness", "Correctness", "Completeness"]
    x = np.arange(len(metrics))
    w = 0.35
    c_vals = [cm.get(m, 0) for m in metrics]
    g_vals = [gm.get(m, 0) for m in metrics]
    bars1 = ax.bar(x - w / 2, c_vals, w, label="Cerebras", color="#2563eb", alpha=0.85)
    bars2 = ax.bar(x + w / 2, g_vals, w, label="Groq", color="#10b981", alpha=0.85)
    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=12)
    ax.set_ylabel("Avg Score (1-5)", fontsize=13)
    ax.set_title("LLM Quality Metrics Comparison", fontsize=16, fontweight="bold")
    ax.set_ylim(0, 5.5)
    ax.legend(fontsize=12)
    for bar in bars1:
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.05,
                f"{bar.get_height():.2f}", ha="center", va="bottom", fontsize=10)
    for bar in bars2:
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.05,
                f"{bar.get_height():.2f}", ha="center", va="bottom", fontsize=10)
    plt.tight_layout()
    plt.savefig("llm_comparison.png", dpi=300, bbox_inches="tight")
    plt.close()


def plot_pass_rate(cp, ct, gp, gt, bp, bt):
    sns.set_theme(style="whitegrid")
    fig, ax = plt.subplots(figsize=(8, 5))

    labels = ["Cerebras", "Groq", "Combined"]
    passes = [cp, gp, bp]
    totals = [ct, gt, bt]
    rates = [p / t * 100 if t else 0 for p, t in zip(passes, totals)]

    # Clean horizontal bar chart instead of a broken pie/donut map
    bars = ax.barh(labels, rates, color=["#2563eb", "#10b981", "#f59e0b"], alpha=0.85, height=0.5)
    ax.set_xlim(0, 105)
    ax.set_xlabel("Pass Rate (%)", fontsize=12)
    ax.set_title("Overall Pass Rate Comparison (Score >= 4.0)", fontsize=15, fontweight="bold")
    
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 1, bar.get_y() + bar.get_height()/2, f"{width:.1f}%", 
                va="center", ha="left", fontsize=11, fontweight="bold")

    plt.tight_layout()
    plt.savefig("pass_rate_comparison.png", dpi=300, bbox_inches="tight")
    plt.close()


def plot_pass_rate_by_tier(tier_stats):
    sns.set_theme(style="whitegrid")
    fig, ax = plt.subplots(figsize=(10, 6))
    tier_labels_short = ["Tier 1\nRetrieval", "Tier 2\nSynthesis", "Tier 3\nRefusal"]
    cp_rates, gp_rates, bp_rates = [], [], []
    for ts in tier_stats:
        def parse_pct(s):
            if isinstance(s, str) and s.endswith("%"):
                return float(s[:-1])
            return 0.0
        cp_rates.append(parse_pct(ts["Cerebras Pass Rate"]))
        gp_rates.append(parse_pct(ts["Groq Pass Rate"]))
        bp_rates.append(parse_pct(ts["Combined Pass Rate"]))
    x2 = np.arange(len(tier_labels_short))
    w2 = 0.25
    ax.bar(x2 - w2, cp_rates, w2, label="Cerebras", color="#2563eb", alpha=0.85)
    ax.bar(x2, gp_rates, w2, label="Groq", color="#10b981", alpha=0.85)
    ax.bar(x2 + w2, bp_rates, w2, label="Combined", color="#f59e0b", alpha=0.85)
    ax.set_xticks(x2)
    ax.set_xticklabels(tier_labels_short, fontsize=11)
    ax.set_ylabel("Pass Rate (%)", fontsize=13)
    ax.set_title("Pass Rate by Tier", fontsize=16, fontweight="bold")
    ax.set_ylim(0, 105)
    ax.legend(fontsize=11)
    plt.tight_layout()
    plt.savefig("pass_rate_by_tier.png", dpi=300, bbox_inches="tight")
    plt.close()

def plot_refusal_chart(refuse_df):
    ra_col = "Refusal Accuracy" if "Refusal Accuracy" in refuse_df.columns else "Refusal_Accuracy"
    ta_col = "Tone Alignment" if "Tone Alignment" in refuse_df.columns else "Tone_Alignment"

    ra_vals = pd.to_numeric(refuse_df[ra_col], errors="coerce").dropna()
    ta_vals = pd.to_numeric(refuse_df[ta_col], errors="coerce").dropna()

    avg_ra = ra_vals.mean() * 100 if ra_vals.mean() <= 1.0 else ra_vals.mean()
    avg_ta = ta_vals.mean() * 100 if ta_vals.mean() <= 1.0 else ta_vals.mean()

    fill_colors = ["#2563eb", "#10b981"]
    titles = ["Refusal Accuracy", "Tone Alignment"]
    values = [avg_ra, avg_ta]

    fig, axes = plt.subplots(1, 2, figsize=(10, 5))
    for i, ax in enumerate(axes):
        remaining = 100 - values[i]
        wedges, _ = ax.pie(
            [values[i], remaining],
            colors=[fill_colors[i], "#e0e0e0"],
            startangle=90, counterclock=False,
        )
        for w in wedges:
            w.set_linewidth(2)
        centre_circle = plt.Circle((0, 0), 0.55, fc="white", linewidth=2)
        ax.add_artist(centre_circle)
        ax.text(0, 0, f"{values[i]:.1f}%", ha="center", va="center",
                fontsize=20, fontweight="bold", color=fill_colors[i])
        ax.set_title(titles[i], fontsize=13, fontweight="bold", pad=10)

    fig.suptitle("Tier 3: Guardrail & Out-of-Domain Refusal Performance",
                 fontsize=15, fontweight="bold", y=1.02)
    plt.tight_layout()
    plt.savefig("guardrail_refusal_metrics.png", dpi=300, bbox_inches="tight")
    plt.close()
    
if __name__ == "__main__":
    for handler in logging.root.handlers:
        if isinstance(handler, logging.StreamHandler):
            try:
                handler.stream.reconfigure(encoding='utf-8')
            except Exception:
                pass
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        path = find_results_file()
        if path is None:
            print("[FAIL] No results file found. Run evaluation first or provide a path.")
            sys.exit(1)
        print(f"[INFO] Using latest results file: {path}")
    analyze_results(path)