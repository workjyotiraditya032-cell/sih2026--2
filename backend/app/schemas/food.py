"""Public simple inputs and validated Food Intelligence Engine contracts."""
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator

Level = Literal['low', 'medium', 'high']
Category = Literal['Fresh Produce', 'Grains', 'Bakery', 'Snacks', 'Dairy', 'Powdered Food', 'Processed Food']
Priority = Literal['cost', 'shelf_life', 'sustainability', 'balanced']

class ClosedModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)

class FoodInput(ClosedModel):
    food_name: str = Field(min_length=1, max_length=60, pattern=r"^[A-Za-z0-9 .,&()'/+\-]+$")
    image_id: UUID | None = None
    image_confirmed: bool = False

class SimpleRecommendationRequest(FoodInput):
    shelf_life_days: int = Field(ge=1, le=1825)
    temperature: float = Field(ge=-40, le=50, allow_inf_nan=False)
    storage_type: Literal['ambient', 'chilled', 'frozen']
    transportation: Literal['normal', 'refrigerated', 'long_distance', 'high_humidity']
    priority: Priority

    @model_validator(mode='after')
    def storage_consistency(self):
        if self.storage_type == 'frozen' and self.temperature > -5:
            raise ValueError('Frozen storage requires -5 °C or below')
        if self.storage_type == 'chilled' and not -5 <= self.temperature <= 15:
            raise ValueError('Chilled storage should be between -5 and 15 °C')
        if self.storage_type == 'ambient' and self.temperature < 5:
            raise ValueError('Ambient storage requires 5 °C or above')
        return self

class PropertyValue(ClosedModel):
    value: str
    source: Literal['reference', 'ai_estimated', 'unavailable']
    basis: str

class FoodProfile(ClosedModel):
    food: str
    food_category: Category
    provenance: Literal['reference', 'ai_estimated']
    properties: dict[str, PropertyValue]
    moisture_range: tuple[float, float] | None
    ph_range: tuple[float, float] | None
    fat_range: tuple[float, float] | None
    respiration: Level
    oxygen_sensitivity: Level
    moisture_sensitivity: Level
    product_form: Literal['solid', 'liquid', 'semi_solid', 'powder']
    light_sensitive: bool
    temperature_range: tuple[float, float] | None
    storage_notes: str
    packaging_considerations: list[str]
    sources: list[str]
    confidence: Level

class FoodEstimate(ClosedModel):
    food: str = Field(max_length=60)
    recognized: bool
    needs_clarification: bool
    clarification: str = Field(max_length=300)
    category: Category
    moisture_min: float | None = Field(ge=0, le=100)
    moisture_max: float | None = Field(ge=0, le=100)
    ph_min: float | None = Field(ge=0, le=14)
    ph_max: float | None = Field(ge=0, le=14)
    fat_min: float | None = Field(ge=0, le=100)
    fat_max: float | None = Field(ge=0, le=100)
    respiration: Level
    oxygen_sensitivity: Level
    moisture_sensitivity: Level
    acidity: str
    fat_characteristic: str
    co2_sensitivity: str
    product_form: Literal['solid', 'liquid', 'semi_solid', 'powder']
    light_sensitive: bool
    temperature_min: float | None
    temperature_max: float | None
    storage_notes: str = Field(max_length=500)
    packaging_considerations: list[str] = Field(max_length=5)
    confidence: Level

    @model_validator(mode='after')
    def check_ranges(self):
        for name in ('moisture', 'ph', 'fat', 'temperature'):
            low, high = getattr(self, name + '_min'), getattr(self, name + '_max')
            if (low is None) != (high is None) or (low is not None and low >= high):
                raise ValueError('Estimated properties must be ranges, not precise measurements')
        if self.moisture_min is not None and self.fat_min is not None:
            if (self.moisture_min + self.moisture_max + self.fat_min + self.fat_max) / 2 > 100:
                raise ValueError('Inconsistent food composition')
        return self

class AISelection(ClosedModel):
    primary_material_id: int
    explanation: str = Field(min_length=30, max_length=950)
    reasoning_factors: list[str] = Field(min_length=2, max_length=4)
    alternatives: list[int] = Field(min_length=0, max_length=2)
    alternative_reasons: list[str] = Field(min_length=0, max_length=2)
    confidence: Level
    warnings: list[str] = Field(max_length=5)

class ImageIdentification(ClosedModel):
    food_name: str | None
    confidence: Level
    unclear: bool
    explanation: str = Field(max_length=500)

class IntelligenceOut(ClosedModel):
    mode: Literal['ai', 'knowledge_base']
    provider: str | None
    model: str | None
    message: str
    food_profile: FoodProfile
    user_requirements: SimpleRecommendationRequest
    packaging_structure: str
    cost_level: Level
    sustainability_level: Level
    confidence: Level
    confidence_basis: str
    warnings: list[str]
    assumptions: list[str]
    image_identification: dict | None
