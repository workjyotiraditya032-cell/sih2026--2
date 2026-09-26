from fastapi import APIRouter

from app.core.config import settings
from app.database.connection import ping
from app.repositories import SOURCE_FALLBACK, SOURCE_MONGODB
from app.recommendation.engine import ENGINE_VERSION, TOP_N
from app.recommendation.ranking import RuleBasedRanker
from app.recommendation.weights import CRITERION_LABELS, PRIORITY_MULTIPLIERS, resolve_base_weights
from app.schemas.common import HealthResponse

router = APIRouter(tags=["system"])


@router.get("/")
def root():
    return {"service": settings.app_name, "version": settings.app_version, "docs": "/api/docs"}


@router.get("/health", response_model=HealthResponse)
def health():
    connected = ping(force=True)
    return {
        "status": "ok",
        "api": "online",
        "version": settings.app_version,
        "database": {
            "engine": "MongoDB Atlas",
            "connected": connected,
            "detail": "Connected" if connected else "Unavailable: serving built-in fallback reference data",
        },
        "data_source": SOURCE_MONGODB if connected else SOURCE_FALLBACK,
    }


@router.get("/engine/config")
def engine_config():
    return {
        "engine_version": ENGINE_VERSION,
        "ranker": RuleBasedRanker.name,
        "top_n": TOP_N,
        "base_weights": resolve_base_weights(settings.weight_overrides),
        "criterion_labels": CRITERION_LABELS,
        "priority_multipliers": PRIORITY_MULTIPLIERS,
        "note": "Weights are configurable scoring parameters, not model accuracy figures.",
    }
