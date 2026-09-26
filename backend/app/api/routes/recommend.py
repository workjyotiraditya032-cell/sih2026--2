from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.schemas.recommendation import RecommendationResponse
from app.schemas.food import SimpleRecommendationRequest
from app.services import food_intelligence
from app.db.mongodb import get_collection, ping_database

router = APIRouter(tags=["recommendation"])


class FeedbackRequest(BaseModel):
    analysis_id: Optional[int] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    comments: Optional[str] = Field(None, max_length=1000)
    helpful: Optional[bool] = None


@router.post("/recommend", response_model=RecommendationResponse)
@router.post("/recommendations", response_model=RecommendationResponse)
def recommend(request: SimpleRecommendationRequest):
    return food_intelligence.recommend(request)


@router.post("/feedback")
def submit_feedback(feedback: FeedbackRequest):
    if ping_database():
        try:
            get_collection("feedback").insert_one({
                **feedback.model_dump(),
                "created_at": datetime.now(timezone.utc),
            })
        except Exception:
            pass
    return {"status": "ok", "message": "Feedback submitted successfully."}
