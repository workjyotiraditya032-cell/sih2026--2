"""Stage 4 — weighted aggregation and ranking."""
from dataclasses import dataclass

from app.models import MaterialRecord
from app.recommendation.requirements import PackagingRequirements
from app.recommendation.scoring import SCORERS, CriterionScore


@dataclass
class ScoredMaterial:
    material: MaterialRecord
    total: float
    criteria: dict[str, CriterionScore]

    @property
    def score(self) -> float:
        return round(self.total * 100, 1)

    def contribution(self, key: str, weights: dict[str, float]) -> float:
        return weights[key] * self.criteria[key].score


def score_material(m: MaterialRecord, r: PackagingRequirements, weights: dict[str, float]) -> ScoredMaterial:
    criteria = {c.key: c for c in (scorer(m, r) for scorer in SCORERS)}
    total = sum(weights[key] * c.score for key, c in criteria.items())
    return ScoredMaterial(m, total, criteria)


class RuleBasedRanker:
    """Default ranker. A validated ML ranker can replace it via the same `rank` interface."""

    name = "rule-based weighted scoring"

    def rank(
        self, candidates: list[MaterialRecord], r: PackagingRequirements, weights: dict[str, float]
    ) -> list[ScoredMaterial]:
        scored = [score_material(m, r, weights) for m in candidates]
        return sorted(scored, key=lambda s: (-s.total, s.material.relative_cost, s.material.material_name))
