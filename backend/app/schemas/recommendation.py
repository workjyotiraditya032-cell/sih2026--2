import re
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.recommendation.weights import DEFAULT_WEIGHTS
from app.schemas.material import MaterialOut
from app.schemas.food import IntelligenceOut

Level = Literal["low", "medium", "high"]
FoodCategory = Literal[
    "Fresh Produce", "Grains", "Bakery", "Snacks", "Dairy", "Powdered Food", "Processed Food"
]
StorageType = Literal["ambient", "chilled", "frozen"]
Transportation = Literal["normal", "refrigerated", "frozen", "long_distance", "high_humidity"]
CostPriority = Literal["low_cost", "balanced", "performance_first"]

_SAFE_TEXT = re.compile(r"^[A-Za-z0-9 .,&()'/+\-]+$")


class RecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    commodity: str = Field(..., min_length=1, max_length=60)
    food_category: FoodCategory
    moisture_content: float = Field(..., ge=0, le=100)
    oil_content: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    respiration_rate: Level
    moisture_sensitivity: Level
    oxygen_sensitivity: Level
    shelf_life_days: int = Field(..., ge=1, le=1825)
    storage_type: StorageType
    temperature: float = Field(..., ge=-40, le=50)
    relative_humidity: float = Field(..., ge=0, le=100)
    transportation: Transportation
    cost_priority: CostPriority
    sustainability_priority: Level
    map_required: Optional[bool] = Field(..., description="true = Yes, false = No, null = Not sure")
    weight_overrides: Optional[dict[str, float]] = None
    product_form: Optional[Literal['solid', 'liquid', 'semi_solid', 'powder']] = None
    light_sensitive: bool = False
    priority: Optional[Literal['cost', 'shelf_life', 'sustainability', 'balanced']] = None
    profile_source: Optional[Literal['reference', 'ai_estimated']] = None

    @field_validator("commodity")
    @classmethod
    def sanitize_commodity(cls, value: str) -> str:
        value = re.sub(r"\s+", " ", value)
        if not _SAFE_TEXT.match(value):
            raise ValueError("contains unsupported characters")
        return value

    @field_validator("weight_overrides")
    @classmethod
    def validate_weights(cls, value: Optional[dict[str, float]]) -> Optional[dict[str, float]]:
        if value is None:
            return None
        unknown = set(value) - set(DEFAULT_WEIGHTS)
        if unknown:
            raise ValueError(f"unknown criteria: {', '.join(sorted(unknown))}")
        if any(v < 0 or v > 1 for v in value.values()):
            raise ValueError("each weight must be between 0 and 1")
        return value

    @model_validator(mode="after")
    def check_consistency(self) -> "RecommendationRequest":
        if self.moisture_content + self.oil_content > 100:
            raise ValueError("Moisture and oil/fat content together cannot exceed 100%")
        if self.storage_type == "frozen" and self.temperature > -5:
            raise ValueError("Frozen storage requires a temperature of -5 °C or below")
        if self.storage_type == "chilled" and not -5 <= self.temperature <= 15:
            raise ValueError("Chilled storage temperature should be between -5 °C and 15 °C")
        if self.storage_type == "ambient" and self.temperature < 5:
            raise ValueError("Ambient storage temperature should be 5 °C or above")
        return self


class RatingSpec(BaseModel):
    rating: int
    label: str


class BarrierSpec(BaseModel):
    min: float
    max: float
    unit: str
    target: str
    status: Literal["meets", "partial", "outside", "not_critical"]


class ThicknessSpec(BaseModel):
    recommended: float
    min: float
    max: float
    unit: str


class Specifications(BaseModel):
    otr: BarrierSpec
    wvtr: BarrierSpec
    thickness: ThicknessSpec
    sealability: RatingSpec
    gas_permeability: RatingSpec
    mechanical_strength: RatingSpec
    map_suitability: RatingSpec
    package_format: str
    test_conditions: str


class ScoreComponent(BaseModel):
    criterion: str
    label: str
    weight: float
    score: float
    contribution: float


class DecisionFactorOut(BaseModel):
    factor: str
    value: str
    impact: str
    influence: Literal["high", "medium", "low"]


class AlternativeOut(BaseModel):
    rank: int
    material: MaterialOut
    suitability_score: float
    main_advantage: str
    main_tradeoff: str
    score_breakdown: list[ScoreComponent]


class RankingEntry(BaseModel):
    rank: int
    material_id: int
    material_name: str
    suitability_score: float


class ExcludedMaterialOut(BaseModel):
    material_id: int
    material_name: str
    reasons: list[str]


class RequirementsOut(BaseModel):
    moisture_barrier: float
    oxygen_barrier: float
    gas_exchange: float
    mechanical_strength: float
    protection_level: float
    shelf_life_class: str
    map_mode: str
    required_storage_types: list[str]
    otr_target: str
    wvtr_target: str


class RecommendationResponse(BaseModel):
    analysis_id: Optional[int]
    recommended_material: MaterialOut
    suitability_score: float
    summary: str
    specifications: Specifications
    reasons: list[str]
    key_factors: list[DecisionFactorOut]
    score_breakdown: list[ScoreComponent]
    alternatives: list[AlternativeOut]
    tradeoffs: list[str]
    ranking: list[RankingEntry]
    excluded_materials: list[ExcludedMaterialOut]
    requirements: RequirementsOut
    weights: dict[str, float]
    data_source: str
    engine_version: str
    disclaimer: str
    input: RecommendationRequest
    input_provenance: Optional[str] = None
    generated_at: datetime
    intelligence: Optional[IntelligenceOut] = None
    history_source: Optional[Literal["stored_snapshot", "recomputed"]] = None


class AnalysisSummary(BaseModel):
    id: int
    commodity: str
    food_category: str
    recommended_material: str
    suitability_score: float
    data_source: str
    storage_type: Optional[str]
    temperature: Optional[float]
    relative_humidity: Optional[float]
    shelf_life_days: Optional[int]
    has_snapshot: bool
    created_at: datetime


class AnalysisListResponse(BaseModel):
    count: int
    analyses: list[AnalysisSummary]
