#!/usr/bin/env python3
"""KODOKU ENGINE — Supply-chain survival model for maritime routes.

Generates ``kodoku_reports.json`` consumed by the WorldDashboard frontend.
"""

import hashlib
import json
import os
import random
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Route definitions
# ---------------------------------------------------------------------------

ROUTES = [
    {
        "id": "middle_east_to_japan",
        "name": "エネルギー航路 (中東 - 日本)",
        "chokepoints": ["Strait of Hormuz", "Strait of Malacca", "Taiwan Strait"],
    },
    {
        "id": "middle_east_to_europe",
        "name": "エネルギー航路 (中東 - 欧州)",
        "chokepoints": ["Strait of Hormuz", "Bab-el-Mandeb", "Suez Canal"],
    },
    {
        "id": "asia_to_europe_suez",
        "name": "主要貿易航路 (アジア - 欧州 / スエズ経由)",
        "chokepoints": ["Strait of Malacca", "Bab-el-Mandeb", "Suez Canal"],
    },
    {
        "id": "asia_to_europe_cape",
        "name": "代替貿易航路 (アジア - 欧州 / 喜望峰回り)",
        "chokepoints": ["Strait of Malacca", "Cape of Good Hope"],
    },
    {
        "id": "americas_to_asia",
        "name": "太平洋貿易航路 (米州 - アジア)",
        "chokepoints": ["Panama Canal", "Taiwan Strait"],
    },
    {
        "id": "black_sea_to_mediterranean",
        "name": "黒海・地中海航路",
        "chokepoints": ["Turkish Straits", "Suez Canal"],
    },
]

# ---------------------------------------------------------------------------
# Survival / disruption helpers
# ---------------------------------------------------------------------------


def _disruption_risk(chokepoint: str) -> float:
    """Return a simulated disruption-risk percentage for *chokepoint*."""
    seed_str = chokepoint + datetime.now(timezone.utc).strftime("%Y-%m-%d")
    seed_val = int(hashlib.sha256(seed_str.encode()).hexdigest(), 16) % (2**32)
    random.seed(seed_val)
    return round(random.uniform(1, 60), 1)


def _survival_rate(disruption_risks: list[float]) -> float:
    """Compute overall survival rate from individual disruption risks."""
    product = 1.0
    for risk in disruption_risks:
        product *= 1.0 - risk / 100.0
    return round(product * 100, 1)


# ---------------------------------------------------------------------------
# Insight generation
# ---------------------------------------------------------------------------


def generate_insight(
    route_name: str,
    survival_rate: float,
    critical_node: str,
    disruption: float,
) -> str:
    """Return a Japanese-language analytical insight string."""
    if survival_rate >= 90:
        return (
            f"{route_name}の生存確率は極めて安定。"
            f"最大リスクは{critical_node}（封鎖リスク{disruption}%）だが、"
            f"現状で直ちに航路変更を要する兆候はない。"
        )
    if survival_rate >= 70:
        return (
            f"{route_name}に軽微なリスク圧力が観測されている。"
            f"{critical_node}（封鎖リスク{disruption}%）周辺での武力衝突を注視し、"
            f"代替ルートの事前検討を推奨する。"
        )
    if survival_rate >= 50:
        return (
            f"警告: {route_name}の生存確率が{survival_rate}%まで低下。"
            f"半径1500km圏内の紛争激化により、"
            f"{critical_node}が深刻なボトルネックとなっている"
            f"（封鎖リスク{disruption}%）。"
            f"速やかな代替ルートへの切り替えを推奨。"
        )
    return (
        f"【致命的警告】 {route_name}の生存確率が{survival_rate}%まで急落。"
        f"{critical_node}の機能不全リスク（{disruption}%）が極めて高く、"
        f"サプライチェーン断絶の危機。"
        f"直ちに代替航路（例: 喜望峰回り等）を実行せよ。"
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def build_report() -> dict:
    """Build the full Kodoku report dict."""
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    route_reports = []

    for route in ROUTES:
        risks = {cp: _disruption_risk(cp) for cp in route["chokepoints"]}
        critical_node = max(risks, key=risks.get)
        max_disruption = risks[critical_node]
        survival = _survival_rate(list(risks.values()))

        route_reports.append(
            {
                "id": route["id"],
                "name": route["name"],
                "survival_rate": survival,
                "critical_node": critical_node,
                "max_disruption_risk": max_disruption,
                "insight": generate_insight(
                    route["name"], survival, critical_node, max_disruption
                ),
            }
        )

    return {"generated_at": generated_at, "routes": route_reports}


def main() -> None:
    report = build_report()

    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "data")
    os.makedirs(out_dir, exist_ok=True)

    out_path = os.path.join(out_dir, "kodoku_reports.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"[done] kodoku report written to {out_path}")


if __name__ == "__main__":
    main()
