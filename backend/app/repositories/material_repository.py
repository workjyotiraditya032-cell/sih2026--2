"""Repository for packaging materials stored in MongoDB Atlas with in-memory fallback."""
import logging
from typing import Optional
from app.db.mongodb import get_collection, ping_database
from app.database.reference_data import MATERIALS
from app.database.material_knowledge import context_for
from app.models.material import MaterialRecord

logger = logging.getLogger(__name__)

SOURCE_MONGODB = "mongodb"
SOURCE_FALLBACK = "fallback_reference_data"

FALLBACK_MATERIALS = [
    MaterialRecord(id=i, **m, **context_for(m["material_name"]))
    for i, m in enumerate(MATERIALS, start=1)
]


def _material_from_doc(doc: dict, default_id: int = 1) -> MaterialRecord:
    """Convert a MongoDB document into a MaterialRecord, ensuring all required fields exist."""
    data = dict(doc)
    data.pop("_id", None)
    if "id" not in data or data["id"] is None:
        data["id"] = default_id

    # Augment with context if missing
    context = context_for(data.get("material_name", ""))
    for k, v in context.items():
        if k not in data or data[k] is None:
            data[k] = v

    return MaterialRecord(**data)


def fetch_all_materials() -> tuple[list[MaterialRecord], str]:
    """Fetch all packaging materials from MongoDB or fall back to reference data."""
    if ping_database():
        try:
            col = get_collection("packaging_materials")
            docs = list(col.find().sort("id", 1))
            if docs:
                records = [_material_from_doc(d, idx) for idx, d in enumerate(docs, start=1)]
                return records, SOURCE_MONGODB
        except Exception as exc:
            logger.warning("MongoDB fetch_materials failed, using fallback data: %s", exc)

    return FALLBACK_MATERIALS, SOURCE_FALLBACK


def get_material_by_id(material_id: int) -> tuple[Optional[MaterialRecord], str]:
    """Retrieve a single packaging material by ID."""
    materials, source = fetch_all_materials()
    for m in materials:
        if m.id == material_id:
            return m, source
    return None, source
