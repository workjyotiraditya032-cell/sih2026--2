"""Extension point for future validated ML models. No ML model ships with this prototype.

A future model (e.g. a learned ranker or shelf-life regressor trained on validated laboratory data)
should implement one of these protocols and be injected into RecommendationEngine(ranker=...).
"""
from typing import Protocol

from app.models import MaterialRecord
from app.recommendation.ranking import ScoredMaterial
from app.recommendation.requirements import PackagingRequirements


class Ranker(Protocol):
    name: str

    def rank(
        self, candidates: list[MaterialRecord], r: PackagingRequirements, weights: dict[str, float]
    ) -> list[ScoredMaterial]: ...


class ShelfLifePredictor(Protocol):
    def predict_days(self, material: MaterialRecord, r: PackagingRequirements) -> float: ...
