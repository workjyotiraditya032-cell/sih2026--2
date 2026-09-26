from datetime import datetime, timezone
from typing import Optional

from app.core.config import settings
from app.database import repository
from app.recommendation.engine import EngineResult, RecommendationEngine
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse

DISCLAIMER = (
    "Recommendations are intended as a decision-support aid and should be validated against applicable "
    "food-contact regulations, material specifications, and laboratory/industry requirements before "
    "commercial deployment."
)

engine = RecommendationEngine(base_weights=settings.weight_overrides)


def _build_response(
    request: RecommendationRequest, result: EngineResult, data_source: str, history_source: Optional[str] = None
) -> RecommendationResponse:
    return RecommendationResponse(
        **result.payload,
        analysis_id=None,
        data_source=data_source,
        disclaimer=DISCLAIMER,
        input=request,
        generated_at=datetime.now(timezone.utc),
        history_source=history_source,
    )


def recommend(request: RecommendationRequest) -> RecommendationResponse:
    materials, data_source = repository.fetch_materials()
    response = _build_response(request, engine.recommend(request, materials), data_source)
    response.analysis_id = repository.save_recommendation_log(
        request.model_dump(),
        response.model_dump(mode="json"),
        response.recommended_material.material_name,
        response.suitability_score,
        data_source,
    )
    return response


def list_history(limit: int, search: Optional[str]) -> list[dict]:
    return repository.list_analyses(limit, search)


def reopen(analysis_id: int) -> Optional[RecommendationResponse]:
    row = repository.get_analysis(analysis_id)
    if row is None:
        return None
    if row["response_payload"]:
        response = RecommendationResponse.model_validate(row["response_payload"])
        response.history_source = "stored_snapshot"
    else:
        request = RecommendationRequest.model_validate(row["request_payload"])
        materials, data_source = repository.fetch_materials()
        response = _build_response(request, engine.recommend(request, materials), data_source, "recomputed")
    response.analysis_id = row["id"]
    return response
