"""Database repository layer delegating to MongoDB Atlas with offline fallback."""
from typing import Optional

from app.models import CommodityRecord, MaterialRecord
from app.schemas.food import FoodProfile
from app.repositories import (
    fetch_all_materials,
    get_material_by_id,
    fetch_all_commodities,
    fetch_food_profile as _fetch_food_profile,
    save_recommendation_log as _save_recommendation_log,
    list_analyses as _list_analyses,
    get_analysis as _get_analysis,
    SOURCE_MONGODB,
    SOURCE_FALLBACK,
)

SOURCE_POSTGRES = SOURCE_MONGODB  # backwards compatibility alias


def fetch_materials() -> tuple[list[MaterialRecord], str]:
    return fetch_all_materials()


def fetch_commodities() -> tuple[list[CommodityRecord], str]:
    return fetch_all_commodities()


def save_recommendation_log(
    payload: dict, response_payload: dict, material_name: str, score: float, data_source: str
) -> Optional[int]:
    return _save_recommendation_log(payload, response_payload, material_name, score, data_source)


def list_analyses(limit: int, search: Optional[str] = None) -> list[dict]:
    return _list_analyses(limit, search)


def get_analysis(analysis_id: int) -> Optional[dict]:
    return _get_analysis(analysis_id)


def fetch_food_profile(name: str) -> Optional[FoodProfile]:
    return _fetch_food_profile(name)
