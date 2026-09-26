"""Orchestrates the five recommendation stages. Pure logic: no I/O."""
from dataclasses import dataclass

from app.core.errors import NoCompatibleMaterialError
from app.models import MaterialRecord
from app.recommendation import explanation
from app.recommendation.filtering import ExcludedMaterial, filter_candidates
from app.recommendation.ranking import RuleBasedRanker, ScoredMaterial
from app.recommendation.requirements import PackagingRequirements, extract_requirements
from app.recommendation.specifications import build_specifications
from app.recommendation.weights import effective_weights, resolve_base_weights

ENGINE_VERSION = "rules-1.0"
TOP_N = 3


@dataclass
class EngineResult:
    requirements: PackagingRequirements
    weights: dict[str, float]
    ranked: list[ScoredMaterial]
    excluded: list[ExcludedMaterial]
    payload: dict


class RecommendationEngine:
    def __init__(self, base_weights: dict[str, float] | None = None, ranker=None):
        self.base_weights = base_weights
        self.ranker = ranker or RuleBasedRanker()

    def recommend(self, req, materials: list[MaterialRecord]) -> EngineResult:
        requirements = extract_requirements(req)
        candidates, excluded = filter_candidates(materials, requirements)
        if not candidates:
            raise NoCompatibleMaterialError([
                {"material_id": e.material.id, "material_name": e.material.material_name, "reasons": e.reasons}
                for e in excluded
            ])

        base = resolve_base_weights(self.base_weights, req.weight_overrides)
        weights = effective_weights(
            base, requirements.cost_priority, requirements.sustainability_priority, requirements.map_preference
        )
        ranked = self.ranker.rank(candidates, requirements, weights)
        top, alternatives = ranked[0], ranked[1:TOP_N]
        payload = self._build_payload(req, requirements, weights, ranked, excluded, top, alternatives)
        return EngineResult(requirements, weights, ranked, excluded, payload)

    @staticmethod
    def _build_payload(req, r, weights, ranked, excluded, top, alternatives) -> dict:
        alt_payload = []
        for rank, alt in enumerate(alternatives, start=2):
            advantage, tradeoff = explanation.describe_alternative(alt, top, weights)
            alt_payload.append({
                "rank": rank,
                "material": alt.material,
                "suitability_score": alt.score,
                "main_advantage": advantage,
                "main_tradeoff": tradeoff,
                "score_breakdown": explanation.build_score_breakdown(alt, weights),
            })
        return {
            "recommended_material": top.material,
            "suitability_score": top.score,
            "summary": explanation.build_summary(req, top, len(ranked), len(excluded), weights),
            "specifications": build_specifications(top.material, r),
            "reasons": explanation.build_reasons(top, weights),
            "key_factors": [f.__dict__ for f in r.factors],
            "score_breakdown": explanation.build_score_breakdown(top, weights),
            "alternatives": alt_payload,
            "tradeoffs": explanation.build_tradeoffs(top, alternatives, weights),
            "ranking": [
                {"rank": i, "material_id": s.material.id, "material_name": s.material.material_name,
                 "suitability_score": s.score}
                for i, s in enumerate(ranked, start=1)
            ],
            "excluded_materials": [
                {"material_id": e.material.id, "material_name": e.material.material_name, "reasons": e.reasons}
                for e in excluded
            ],
            "requirements": {
                "moisture_barrier": round(r.moisture_barrier, 2),
                "oxygen_barrier": round(r.oxygen_barrier, 2),
                "gas_exchange": r.gas_exchange,
                "mechanical_strength": r.mechanical_strength,
                "protection_level": r.protection_level,
                "shelf_life_class": r.shelf_life_class,
                "map_mode": r.map_mode,
                "required_storage_types": r.required_storage_types,
                "otr_target": r.otr_target.label,
                "wvtr_target": r.wvtr_target.label,
            },
            "weights": {k: round(v, 4) for k, v in weights.items()},
            "engine_version": ENGINE_VERSION,
        }
