from typing import Any, Dict, List


def generate_cfo_insights(
    metrics: Dict[str, Any],
    cogs: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Evaluates computed financial metrics and COGS ratio distributions against operational rules,
    synthesizing plain-English prescriptive diagnostic insights for the CEO.
    """
    insights: List[Dict[str, Any]] = []

    gross_margin_pct = metrics.get("gross_margin_pct", 0.0)
    overhead_pct = cogs.get("factory_overhead_pct", 0.0)
    materials_pct = cogs.get("direct_materials_pct", 0.0)

    # 1. Rule 1: Gross Margin Evaluation
    if gross_margin_pct >= 40.0:
        insights.append(
            {
                "id": "1",
                "type": "positive",
                "title": "Gross Margin Benchmark Exceeded",
                "summary": (
                    f"Gross margin expanded to {gross_margin_pct}%, exceeding the target 40.0% "
                    f"benchmark driven by disciplined cost control."
                ),
            }
        )
    else:
        insights.append(
            {
                "id": "1",
                "type": "warning",
                "title": "Gross Margin Compression Alert",
                "summary": (
                    f"Gross margin compressed to {gross_margin_pct}%, falling below target 40.0% "
                    f"benchmark. Recommended Action: Review supplier pricing and contract terms."
                ),
            }
        )

    # 2. Rule 2: Material Cost Evaluation
    if materials_pct > 55.0:
        insights.append(
            {
                "id": "2",
                "type": "warning",
                "title": "Direct Material Cost Drag",
                "summary": (
                    f"Raw materials represent {materials_pct}% of total COGS. Recommended Action: "
                    f"Renegotiate supplier credit terms or adjust product line pricing."
                ),
            }
        )

    # 3. Rule 3: Factory Overhead Evaluation
    if overhead_pct > 20.0:
        insights.append(
            {
                "id": "3",
                "type": "warning",
                "title": "Factory Overhead Cost Variance",
                "summary": (
                    f"Facility overhead represents {overhead_pct}% of total COGS. Recommended Action: "
                    f"Audit plant machinery utility operating hours."
                ),
            }
        )
    else:
        insights.append(
            {
                "id": "3",
                "type": "info",
                "title": "Operating Overhead Within Target Range",
                "summary": (
                    f"Facility overhead represents {overhead_pct}% of total COGS, operating "
                    f"well within standard budget parameters."
                ),
            }
        )

    return insights