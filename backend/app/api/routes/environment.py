from fastapi import APIRouter, Query

from app.schemas.common import EnvironmentResponse
from app.services.environment_service import fetch_current_conditions

router = APIRouter(tags=["environment"])


@router.get("/environment", response_model=EnvironmentResponse)
def current_conditions(location: str = Query(..., min_length=2, max_length=80, pattern=r"^[A-Za-z .,'\-]+$")):
    return fetch_current_conditions(location.strip())
