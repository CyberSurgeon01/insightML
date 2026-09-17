"""
backend/services/insights.py

Smart Insights and Recommendations Service.
Synthesizes deterministic insights from the analytical components.
"""

import uuid
from typing import Any

def analyze_insights(profile: dict, relationships: dict, categorical: dict, quality: dict) -> dict[str, Any]:
    insights = []
    
    def add_insight(priority: str, category: str, title: str, summary: str, metrics: dict, cols: list[str], action: str, source: str):
        insights.append({
            "insight_id": str(uuid.uuid4()),
            "priority": priority,
            "category": category,
            "title": title,
            "summary": summary,
            "evidence": {
                "metrics": metrics,
                "affected_columns": cols
            },
            "recommended_action": action,
            "source_section": source
        })

    # Track what we've already mentioned to prevent duplication
    mentioned_cols = set()
    
    # 1. Critical Quality Issues
    if quality:
        for w in quality.get("warnings", []):
            if w["severity"] == "Critical":
                add_insight(
                    "High", "Data Quality",
                    w["issue_title"],
                    w["explanation"],
                    {"count": w["count"], "percentage": w["percentage"]},
                    w["affected_columns"],
                    w["recommendation"],
                    "quality"
                )
                mentioned_cols.update(w["affected_columns"])

    # 2. Strong Numerical Associations
    if relationships and relationships.get("pairs"):
        for pair in relationships["pairs"]:
            if abs(pair["pearson"]) >= 0.8:
                add_insight(
                    "High", "Numerical Relationship",
                    "Strong Numerical Correlation",
                    f"A very strong linear relationship ({pair['pearson']:.2f}) exists between {pair['feature_a']} and {pair['feature_b']}.",
                    {"pearson": pair["pearson"], "spearman": pair["spearman"]},
                    [pair["feature_a"], pair["feature_b"]],
                    "Consider removing one if training a linear model to prevent multicollinearity.",
                    "relationships"
                )

    # 3. Strong Categorical Associations
    if categorical:
        # Cat-Cat
        for pair in categorical.get("cat_cat_pairs", []):
            if pair["cramers_v"] >= 0.5:
                add_insight(
                    "Medium", "Categorical Relationship",
                    "Strong Categorical Association",
                    f"{pair['feature_a']} and {pair['feature_b']} are strongly associated.",
                    {"cramers_v": pair["cramers_v"], "p_value": pair["p_value"]},
                    [pair["feature_a"], pair["feature_b"]],
                    "These features contain highly overlapping information. Be careful if using both as predictors.",
                    "categorical"
                )
        # Cat-Num
        for pair in categorical.get("cat_num_pairs", []):
            if pair["eta_squared"] >= 0.14:
                add_insight(
                    "Medium", "Categorical Relationship",
                    "Category Influences Numeric Value",
                    f"The value of {pair['numerical_feature']} varies significantly depending on {pair['categorical_feature']}.",
                    {"eta_squared": pair["eta_squared"], "p_value": pair["p_value"]},
                    [pair['categorical_feature'], pair['numerical_feature']],
                    f"Use {pair['categorical_feature']} to segment or predict {pair['numerical_feature']}.",
                    "categorical"
                )

    # 4. Data Leakage / IDs
    if quality:
        for w in quality.get("warnings", []):
            if w["issue_title"] == "All Unique Values" and w["affected_columns"]:
                col = w["affected_columns"][0]
                if col not in mentioned_cols:
                    add_insight(
                        "Medium", "Data Quality",
                        "Likely Identifier Column",
                        f"{col} contains entirely unique values.",
                        {"unique_count": w["count"]},
                        [col],
                        "Exclude ID columns from machine learning features as they offer no generalizable patterns.",
                        "quality"
                    )
                    mentioned_cols.add(col)

    # 5. Distribution Warnings (Near Constant / Imbalance)
    if quality:
        for w in quality.get("warnings", []):
            if w["issue_title"] in ("Near-Constant Column", "Categorical Imbalance") and w["affected_columns"]:
                col = w["affected_columns"][0]
                if col not in mentioned_cols:
                    add_insight(
                        "Medium", "Distribution",
                        w["issue_title"],
                        f"One value dominates {col} ({w['percentage']:.1f}%).",
                        {"dominant_percentage": w["percentage"]},
                        [col],
                        "If this is a target variable, apply class-balancing techniques. If a feature, it may have low predictive power.",
                        "quality"
                    )
                    mentioned_cols.add(col)

    # 6. Missing Values (Moderate)
    if quality:
        for w in quality.get("warnings", []):
            if w["issue_title"] == "High Missing Values" and w["affected_columns"]:
                col = w["affected_columns"][0]
                if col not in mentioned_cols:
                    add_insight(
                        "Medium", "Data Quality",
                        "High Proportion of Missing Data",
                        f"{col} is missing {w['percentage']:.1f}% of its values.",
                        {"missing_percentage": w["percentage"]},
                        [col],
                        "Consider dropping this column or carefully imputing it.",
                        "quality"
                    )
                    mentioned_cols.add(col)

    # 7. Nonlinear Dependencies
    if relationships and relationships.get("pairs"):
        for pair in relationships["pairs"]:
            # High MI but low Pearson indicates nonlinear
            if pair["mutual_information"] > 0.5 and abs(pair["pearson"]) < 0.3:
                add_insight(
                    "Medium", "Numerical Relationship",
                    "Nonlinear Dependency Detected",
                    f"{pair['feature_a']} and {pair['feature_b']} share information but not linearly.",
                    {"mutual_information": pair["mutual_information"], "pearson": pair["pearson"]},
                    [pair["feature_a"], pair["feature_b"]],
                    "Tree-based models will capture this relationship better than simple linear regression.",
                    "relationships"
                )

    # 8. Clean Data Bonus
    if quality and quality.get("critical_count", 0) == 0 and quality.get("warning_count", 0) == 0:
        add_insight(
            "Low", "Recommendation",
            "Dataset Appears Structurally Clean",
            "No critical or warning-level data quality issues were found.",
            {"critical_issues": 0, "warnings": 0},
            [],
            "The data is in good shape for exploratory analysis or baseline modeling.",
            "quality"
        )

    # Sort priorities
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    insights.sort(key=lambda x: priority_order[x["priority"]])

    # Cap to top 12 insights
    return {
        "insights": insights[:12]
    }
