"""Repository for recommendation logs and prediction history in MongoDB Atlas."""
import logging
from datetime import datetime, timezone
import re
from typing import Optional

from app.core.errors import HistoryUnavailableError
from app.db.mongodb import get_collection, ping_database

logger = logging.getLogger(__name__)


def _next_recommendation_id() -> int:
    """Generate next sequential integer ID for recommendations."""
    col = get_collection("recommendations")
    highest = col.find_one(sort=[("id", -1)])
    if highest and "id" in highest and isinstance(highest["id"], int):
        return highest["id"] + 1
    return 1


def save_recommendation_log(
    payload: dict,
    response_payload: dict,
    material_name: str,
    score: float,
    data_source: str,
) -> Optional[int]:
    """Store recommendation in recommendations and prediction_history collections."""
    if not ping_database():
        return None

    try:
        rec_id = _next_recommendation_id()
        now = datetime.now(timezone.utc)

        # Full record in recommendations collection
        rec_doc = {
            "id": rec_id,
            "commodity": payload.get("commodity", ""),
            "food_category": payload.get("food_category", ""),
            "request_payload": payload,
            "response_payload": response_payload,
            "recommended_material": material_name,
            "suitability_score": score,
            "data_source": data_source,
            "created_at": now,
        }
        get_collection("recommendations").insert_one(rec_doc)

        # Searchable summary in prediction_history collection
        hist_doc = {
            "id": rec_id,
            "commodity": payload.get("commodity", ""),
            "food_category": payload.get("food_category", ""),
            "recommended_material": material_name,
            "suitability_score": score,
            "data_source": data_source,
            "storage_type": payload.get("storage_type"),
            "temperature": float(payload.get("temperature", 0.0)) if payload.get("temperature") is not None else None,
            "relative_humidity": float(payload.get("relative_humidity", 0.0)) if payload.get("relative_humidity") is not None else None,
            "shelf_life_days": int(payload.get("shelf_life_days", 0)) if payload.get("shelf_life_days") is not None else None,
            "has_snapshot": response_payload is not None,
            "created_at": now,
        }
        get_collection("prediction_history").insert_one(hist_doc)

        return rec_id
    except Exception as exc:
        logger.warning("Failed to save recommendation log to MongoDB: %s", exc)
        return None


def list_analyses(limit: int, search: Optional[str] = None) -> list[dict]:
    """List recommendation history from prediction_history collection."""
    if not ping_database():
        raise HistoryUnavailableError(
            "Analysis history requires MongoDB, which is currently unavailable. New analyses still work."
        )

    try:
        col = get_collection("prediction_history")
        query: dict = {}
        if search:
            escaped = re.escape(search.strip())
            regex = {"$regex": escaped, "$options": "i"}
            query = {
                "$or": [
                    {"commodity": regex},
                    {"food_category": regex},
                    {"recommended_material": regex},
                ]
            }

        docs = list(
            col.find(query, {"_id": 0})
            .sort([("created_at", -1), ("id", -1)])
            .limit(limit)
        )
        return docs
    except Exception as exc:
        logger.warning("MongoDB list_analyses failed: %s", exc)
        raise HistoryUnavailableError(
            "Analysis history requires MongoDB, which is currently unavailable. New analyses still work."
        ) from exc


def get_analysis(analysis_id: int) -> Optional[dict]:
    """Retrieve full analysis snapshot by ID."""
    if not ping_database():
        raise HistoryUnavailableError(
            "Retrieving past analyses requires MongoDB, which is currently unavailable."
        )

    try:
        col = get_collection("recommendations")
        doc = col.find_one({"id": analysis_id}, {"_id": 0})
        if not doc:
            return None
        return {
            "id": doc.get("id"),
            "request_payload": doc.get("request_payload"),
            "response_payload": doc.get("response_payload"),
            "created_at": doc.get("created_at"),
        }
    except Exception as exc:
        logger.warning("MongoDB get_analysis failed: %s", exc)
        raise HistoryUnavailableError(
            "Retrieving past analyses requires MongoDB, which is currently unavailable."
        ) from exc
