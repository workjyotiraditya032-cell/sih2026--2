from typing import Optional

from app.database import repository
from app.models import MaterialRecord


def list_materials(
    search: Optional[str] = None,
    category: Optional[str] = None,
    food_category: Optional[str] = None,
    storage_type: Optional[str] = None,
    map_suitable: Optional[bool] = None,
    recyclable: Optional[bool] = None,
    biodegradable: Optional[bool] = None,
    max_cost: Optional[int] = None,
) -> tuple[list[MaterialRecord], str]:
    materials, source = repository.fetch_materials()
    term = (search or "").strip().lower()

    def matches(m: MaterialRecord) -> bool:
        if term and term not in f"{m.material_name} {m.material_category} {m.description} {m.notes or ''}".lower():
            return False
        if category and m.material_category != category:
            return False
        if food_category and food_category not in m.suitable_food_categories:
            return False
        if storage_type and storage_type not in m.suitable_storage_types:
            return False
        if map_suitable is not None and (m.map_suitability >= 4) != map_suitable:
            return False
        if recyclable is not None and m.recyclable != recyclable:
            return False
        if biodegradable is not None and m.biodegradable != biodegradable:
            return False
        return max_cost is None or m.relative_cost <= max_cost

    return [m for m in materials if matches(m)], source


def get_material(material_id: int) -> tuple[Optional[MaterialRecord], str]:
    materials, source = repository.fetch_materials()
    return next((m for m in materials if m.id == material_id), None), source
