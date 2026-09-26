from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MaterialRecord(BaseModel):
    id: int
    material_name: str
    material_category: str
    description: str
    min_thickness: float
    max_thickness: float
    otr_min: float
    otr_max: float
    wvtr_min: float
    wvtr_max: float
    sealability: int
    mechanical_strength: int
    gas_permeability: int
    moisture_barrier: int
    oxygen_barrier: int
    map_suitability: int
    recyclable: bool
    biodegradable: bool
    relative_cost: int
    suitable_food_categories: list[str]
    suitable_storage_types: list[str]
    packaging_structure: Optional[str] = None
    product_forms: list[str] = ['solid', 'liquid', 'semi_solid', 'powder']
    transparency: str = 'Grade-dependent'
    light_protection: bool = False
    food_contact_suitability: str = 'Food-contact grade and complete structure require validation.'
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
