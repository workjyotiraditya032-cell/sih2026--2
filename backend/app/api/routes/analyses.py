from typing import Optional

from fastapi import APIRouter, HTTPException, Path, Query
from pydantic import ValidationError

from app.core.errors import NoCompatibleMaterialError
from app.schemas.recommendation import AnalysisListResponse, RecommendationResponse
from app.services import recommendation_service

router = APIRouter(tags=["analysis history"])


@router.get("/analyses", response_model=AnalysisListResponse)
@router.get("/recommendations/history", response_model=AnalysisListResponse)
def list_analyses(
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None, max_length=60, pattern=r"^[A-Za-z0-9 .,&()'/+\-]*$"),
):
    analyses = recommendation_service.list_history(limit, (search or "").strip() or None)
    return {"count": len(analyses), "analyses": analyses}


@router.get("/analyses/{analysis_id}", response_model=RecommendationResponse)
@router.get("/recommendations/{analysis_id}", response_model=RecommendationResponse)
def get_analysis(analysis_id: int = Path(..., ge=1)):
    try:
        response = recommendation_service.reopen(analysis_id)
    except (ValidationError, NoCompatibleMaterialError):
        raise HTTPException(status_code=409, detail="This earlier analysis can no longer be reopened with current data")
    if response is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return response
