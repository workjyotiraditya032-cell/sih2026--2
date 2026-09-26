"""Stage 1 — requirement extraction: converts food and storage inputs into packaging requirements."""
from dataclasses import dataclass, field
from typing import Optional

from app.recommendation.labels import MAP_MODE_LABELS, TRANSPORT_LABELS

SHORT_SHELF_LIFE_DAYS = 30
LONG_SHELF_LIFE_DAYS = 120
HIGH_FAT_THRESHOLD = 15.0
LOW_MOISTURE_THRESHOLD = 20.0

MOISTURE_BASE = {"low": 2.0, "medium": 3.0, "high": 4.5}
OXYGEN_BASE = {"low": 1.5, "medium": 3.0, "high": 4.5}
GAS_EXCHANGE = {"low": 2.5, "medium": 3.5, "high": 5.0}
TRANSPORT_STRENGTH = {"normal": 2.5, "refrigerated": 3.0, "frozen": 4.0, "long_distance": 4.5, "high_humidity": 3.0}
PROTECTION_LEVEL = {"short": 2.5, "medium": 3.5, "long": 4.5}


@dataclass
class DecisionFactor:
    factor: str
    value: str
    impact: str
    influence: str


@dataclass
class Band:
    label: str
    minimum: float
    maximum: Optional[float]
    critical: bool = True


@dataclass
class PackagingRequirements:
    commodity: str
    food_category: str
    storage_type: str
    transportation: str
    temperature: float
    relative_humidity: float
    shelf_life_days: int
    shelf_life_class: str
    respiration_rate: str
    oil_content: float
    required_storage_types: list[str]
    is_respiring: bool
    high_fat: bool
    low_moisture_product: bool
    condensation_risk: bool
    moisture_barrier: float
    oxygen_barrier: float
    gas_exchange: float
    mechanical_strength: float
    protection_level: float
    map_preference: str
    map_mode: str
    cost_priority: str
    sustainability_priority: str
    otr_target: Band
    wvtr_target: Band
    product_form: Optional[str] = None
    light_sensitive: bool = False
    ph: float = 7.0
    factors: list[DecisionFactor] = field(default_factory=list)


def _clamp(value: float, low: float = 1.0, high: float = 5.0) -> float:
    return max(low, min(high, value))


def _shelf_life_class(days: int) -> str:
    if days <= SHORT_SHELF_LIFE_DAYS:
        return "short"
    return "medium" if days <= LONG_SHELF_LIFE_DAYS else "long"


def _otr_band(gas_exchange: float, oxygen: float) -> Band:
    if gas_exchange >= 4.5:
        return Band("Very high / breathable (> 5,000 cm³/m²·day or micro-perforated)", 5000, None)
    if gas_exchange >= 3.0:
        return Band("Moderate–high (1,000–10,000 cm³/m²·day)", 1000, 10000)
    if gas_exchange > 0:
        return Band("Moderate (100–5,000 cm³/m²·day)", 100, 5000)
    if oxygen >= 4.5:
        return Band("Very low (< 5 cm³/m²·day)", 0, 5)
    if oxygen >= 3.5:
        return Band("Low (< 100 cm³/m²·day)", 0, 100)
    if oxygen >= 2.5:
        return Band("Moderate (< 2,000 cm³/m²·day)", 0, 2000)
    return Band("Not critical", 0, None, critical=False)


def _wvtr_band(moisture: float, is_respiring: bool) -> Band:
    if is_respiring and moisture >= 3.5:
        return Band("Low–moderate (5–60 g/m²·day) to limit weight loss without condensation", 5, 60)
    if moisture >= 4.5:
        return Band("Very low (< 1 g/m²·day)", 0, 1)
    if moisture >= 3.5:
        return Band("Low (< 10 g/m²·day)", 0, 10)
    if moisture >= 2.5:
        return Band("Moderate (< 30 g/m²·day)", 0, 30)
    return Band("Not critical", 0, None, critical=False)


def _map_mode(map_required: Optional[bool], is_respiring: bool, respiration: str, oxygen: float, shelf: str) -> str:
    if map_required is False:
        return "none"
    if map_required is True:
        return "passive" if is_respiring else "gas_flush"
    if is_respiring and respiration == "high":
        return "passive"
    if not is_respiring and oxygen >= 4.5 and shelf != "short":
        return "gas_flush"
    return "none"


def extract_requirements(req) -> PackagingRequirements:
    factors: list[DecisionFactor] = []
    shelf = _shelf_life_class(req.shelf_life_days)
    is_respiring = req.food_category == "Fresh Produce" or req.respiration_rate != "low"
    low_moisture = req.moisture_content < LOW_MOISTURE_THRESHOLD
    high_fat = req.oil_content >= HIGH_FAT_THRESHOLD

    gas_exchange = GAS_EXCHANGE[req.respiration_rate] if is_respiring else 0.0
    factors.append(DecisionFactor(
        "Respiration rate", req.respiration_rate.title(),
        f"Controlled gas exchange required (target permeability ~{gas_exchange:g}/5)" if is_respiring
        else "Non-respiring product: hermetic barrier packaging is acceptable",
        "high" if req.respiration_rate == "high" or is_respiring else "low",
    ))

    moisture = MOISTURE_BASE[req.moisture_sensitivity]
    moisture_notes = [f"{req.moisture_sensitivity} sensitivity"]
    if low_moisture and req.relative_humidity >= 70:
        moisture += 0.5
        moisture_notes.append(f"dry product at {req.relative_humidity:g}% RH")
    if shelf == "long":
        moisture += 0.5
        moisture_notes.append("long shelf life")
    if req.temperature > 30:
        moisture += 0.25
        moisture_notes.append("warm storage")
    if is_respiring:
        moisture = min(moisture, 4.0)
    moisture = _clamp(moisture)
    factors.append(DecisionFactor(
        "Moisture sensitivity", req.moisture_sensitivity.title(),
        f"Moisture barrier ≥ {moisture:.1f}/5 ({', '.join(moisture_notes)})",
        "high" if moisture >= 4 else "medium" if moisture >= 3 else "low",
    ))

    oxygen = OXYGEN_BASE[req.oxygen_sensitivity]
    oxygen_notes = [f"{req.oxygen_sensitivity} sensitivity"]
    if high_fat:
        oxygen += 0.75
        oxygen_notes.append(f"{req.oil_content:g}% fat, risk of rancidity")
    if shelf == "long":
        oxygen += 0.5
        oxygen_notes.append("long shelf life")
    if is_respiring:
        oxygen = min(oxygen, 2.5)
        oxygen_notes.append("capped because respiring produce needs O₂ ingress")
    oxygen = _clamp(oxygen)
    factors.append(DecisionFactor(
        "Oxygen sensitivity", req.oxygen_sensitivity.title(),
        f"Oxygen barrier ~{oxygen:.1f}/5 ({', '.join(oxygen_notes)})",
        "high" if oxygen >= 4 else "medium" if oxygen >= 2.5 else "low",
    ))

    required_storage = [req.storage_type]
    if req.transportation == "frozen" and "frozen" not in required_storage:
        required_storage.append("frozen")
    if req.transportation == "refrigerated" and req.storage_type == "ambient":
        required_storage.append("chilled")
    factors.append(DecisionFactor(
        "Storage temperature", f"{req.temperature:g} °C ({req.storage_type})",
        f"Material must be rated for {' + '.join(required_storage)} conditions",
        "high" if req.storage_type == "frozen" else "medium",
    ))

    condensation = is_respiring and req.relative_humidity >= 85
    humidity_impact = (
        "High humidity around respiring produce: breathability reduces condensation risk" if condensation
        else "High humidity around a dry product increases moisture-ingress risk" if low_moisture and req.relative_humidity >= 70
        else "Humidity within a manageable range"
    )
    factors.append(DecisionFactor(
        "Relative humidity", f"{req.relative_humidity:g}%", humidity_impact,
        "high" if condensation or (low_moisture and req.relative_humidity >= 70) else "low",
    ))

    protection = PROTECTION_LEVEL[shelf] + (0.5 if is_respiring and req.shelf_life_days > 21 else 0.0)
    factors.append(DecisionFactor(
        "Shelf-life target", f"{req.shelf_life_days} days ({shelf})",
        f"Protection level ~{protection:.1f}/5 required", "high" if shelf == "long" else "medium",
    ))

    mechanical = TRANSPORT_STRENGTH[req.transportation]
    if req.storage_type == "frozen":
        mechanical = max(mechanical, 3.5)
    factors.append(DecisionFactor(
        "Transportation", TRANSPORT_LABELS[req.transportation].title(),
        f"Mechanical strength ≥ {mechanical:g}/5 suggested",
        "high" if mechanical >= 4 else "low",
    ))

    map_preference = {True: "yes", False: "no", None: "not_sure"}[req.map_required]
    map_mode = _map_mode(req.map_required, is_respiring, req.respiration_rate, oxygen, shelf)
    factors.append(DecisionFactor(
        "MAP requirement", {"yes": "Yes", "no": "No", "not_sure": "Not sure"}[map_preference],
        MAP_MODE_LABELS[map_mode] + (" — suggested by engine" if map_preference == "not_sure" and map_mode != "none" else ""),
        "high" if map_preference == "yes" else "medium" if map_mode != "none" else "low",
    ))

    if high_fat:
        factors.append(DecisionFactor(
            "Oil/fat content", f"{req.oil_content:g}%", "Oxidation risk raises the oxygen-barrier requirement", "medium",
        ))

    return PackagingRequirements(
        commodity=req.commodity,
        food_category=req.food_category,
        storage_type=req.storage_type,
        transportation=req.transportation,
        temperature=req.temperature,
        relative_humidity=req.relative_humidity,
        shelf_life_days=req.shelf_life_days,
        shelf_life_class=shelf,
        respiration_rate=req.respiration_rate,
        oil_content=req.oil_content,
        required_storage_types=required_storage,
        is_respiring=is_respiring,
        high_fat=high_fat,
        low_moisture_product=low_moisture,
        condensation_risk=condensation,
        moisture_barrier=moisture,
        oxygen_barrier=oxygen,
        gas_exchange=gas_exchange,
        mechanical_strength=mechanical,
        protection_level=protection,
        map_preference=map_preference,
        map_mode=map_mode,
        cost_priority=req.cost_priority,
        sustainability_priority=req.sustainability_priority,
        otr_target=_otr_band(gas_exchange, oxygen),
        wvtr_target=_wvtr_band(moisture, is_respiring),
        product_form=getattr(req, 'product_form', None),
        light_sensitive=getattr(req, 'light_sensitive', False),
        ph=req.ph,
        factors=factors,
    )
