"""Repository for food commodities stored in MongoDB Atlas with in-memory fallback."""
import logging
from typing import Optional
from app.db.mongodb import get_collection, ping_database
from app.database.reference_data import COMMODITIES
from app.models.commodity import CommodityRecord

logger = logging.getLogger(__name__)

SOURCE_MONGODB = "mongodb"
SOURCE_FALLBACK = "fallback_reference_data"

FALLBACK_COMMODITIES = [CommodityRecord(id=i, **c) for i, c in enumerate(COMMODITIES, start=1)]


def _commodity_from_doc(doc: dict, default_id: int = 1) -> CommodityRecord:
    data = dict(doc)
    data.pop("_id", None)
    if "id" not in data or data["id"] is None:
        data["id"] = default_id
    return CommodityRecord(**data)


def fetch_all_commodities() -> tuple[list[CommodityRecord], str]:
    """Fetch all commodities from MongoDB Atlas or fall back to reference data."""
    if ping_database():
        try:
            col = get_collection("food_commodities")
            docs = list(col.find().sort("id", 1))
            if docs:
                records = [_commodity_from_doc(d, idx) for idx, d in enumerate(docs, start=1)]
                return records, SOURCE_MONGODB
        except Exception as exc:
            logger.warning("MongoDB fetch_commodities failed, using fallback data: %s", exc)

    return FALLBACK_COMMODITIES, SOURCE_FALLBACK
