"""Stage 3 — compatibility scoring: each criterion returns a 0–1 score plus evidence notes."""
from dataclasses import dataclass, field

from app.models import MaterialRecord
from app.recommendation.labels import TRANSPORT_LABELS, cost_label
from app.recommendation.requirements import PackagingRequirements

NEUTRAL_SCORE = 0.7


@dataclass
class CriterionScore:
    key: str
    score: float
    strengths: list[str] = field(default_factory=list)
    concerns: list[str] = field(default_factory=list)


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _fit(required: float, actual: float) -> float:
    return _clamp(1 - max(0.0, required - actual) / 4)


def _closeness(target: float, actual: float) -> float:
    return _clamp(1 - abs(target - actual) / 4)


def score_food(m: MaterialRecord, r: PackagingRequirements) -> CriterionScore:
    c = CriterionScore("food_compatibility", 1.0)
    if r.food_category in m.suitable_food_categories:
        c.strengths.append(f"Listed for {r.food_category} applications in the packaging knowledge base")
    else:
        c.score = 0.45
        c.concerns.append(f"Not a typical {r.food_category} packaging choice in the knowledge base")
    if r.high_fat and m.oxygen_barrier >= 4:
        c.strengths.append(f"Oxygen barrier ({m.oxygen_barrier}/5) limits oxidation of the {r.oil_content:g}% fat content")
    elif r.high_fat and m.oxygen_barrier <= 2:
        c.score -= 0.15
        c.concerns.append(f"Limited protection against fat oxidation (oxygen barrier {m.oxygen_barrier}/5)")
    if r.light_sensitive:
        if m.light_protection:
            c.strengths.append('Opaque structure limits light exposure relevant to this food profile')
        else:
            c.score -= 0.20
            c.concerns.append('Needs secondary light shielding; this material is not inherently opaque')
    if r.ph < 4.6:
        c.strengths.append('Acid compatibility requires a validated food-contact layer, liner or coating; metal-containing laminates are not categorically excluded')
    c.score = _clamp(c.score)
    return c


def score_storage(m: MaterialRecord, r: PackagingRequirements) -> CriterionScore:
    c = CriterionScore("storage_compatibility", 0.0)
    transport = TRANSPORT_LABELS[r.transportation]
    mech = _fit(r.mechanical_strength, m.mechanical_strength)
    if r.is_respiring and r.condensation_risk:
        humidity = _closeness(r.gas_exchange, m.gas_permeability)
    elif r.low_moisture_product and r.relative_humidity >= 70:
        humidity = _fit(4, m.moisture_barrier)
    else:
        humidity = 1.0
    c.score = _clamp(0.4 + 0.35 * mech + 0.25 * humidity)
    c.strengths.append(f"Rated for {' + '.join(r.required_storage_types)} conditions at {r.temperature:g} °C")
    if mech >= 0.99:
        c.strengths.append(f"Mechanical strength ({m.mechanical_strength}/5) suits {transport} transport")
    else:
        c.concerns.append(
            f"Mechanical strength ({m.mechanical_strength}/5) is below the ~{r.mechanical_strength:g}/5 suggested for {transport} transport"
        )
    if humidity < 0.7:
        c.concerns.append(
            f"Condensation risk at {r.relative_humidity:g}% RH (gas permeability {m.gas_permeability}/5)" if r.is_respiring
            else f"Moisture-ingress risk at {r.relative_humidity:g}% RH (moisture barrier {m.moisture_barrier}/5)"
        )
    elif r.condensation_risk and humidity >= 0.85:
        c.strengths.append(f"Breathable structure limits in-pack condensation at {r.relative_humidity:g}% RH")
    return c


def score_barrier(m: MaterialRecord, r: PackagingRequirements) -> CriterionScore:
    c = CriterionScore("barrier_requirements", 0.0)
    moist = _fit(r.moisture_barrier, m.moisture_barrier)
    if r.is_respiring:
        oxy = _clamp(1 - max(0.0, m.oxygen_barrier - r.oxygen_barrier) / 4)
        gas = _closeness(r.gas_exchange, m.gas_permeability)
        c.score = 0.3 * moist + 0.2 * oxy + 0.5 * gas
        if gas >= 0.85:
            c.strengths.append(
                f"Gas permeability ({m.gas_permeability}/5) matches the gas exchange needed for {r.respiration_rate}-respiration produce"
            )
        elif m.gas_permeability < r.gas_exchange:
            c.concerns.append(
                f"Gas permeability ({m.gas_permeability}/5) is below the ~{r.gas_exchange:g}/5 needed: risk of CO₂ build-up"
            )
        else:
            c.concerns.append(f"More permeable ({m.gas_permeability}/5) than needed: faster moisture and aroma loss")
    else:
        oxy = _fit(r.oxygen_barrier, m.oxygen_barrier)
        total = r.moisture_barrier + r.oxygen_barrier
        c.score = (r.moisture_barrier * moist + r.oxygen_barrier * oxy) / total
        if r.oxygen_barrier >= 3 and oxy >= 0.99:
            c.strengths.append(f"Oxygen barrier ({m.oxygen_barrier}/5) meets the required ~{r.oxygen_barrier:.1f}/5")
        elif oxy < 0.8:
            c.concerns.append(f"Oxygen barrier ({m.oxygen_barrier}/5) is below the required ~{r.oxygen_barrier:.1f}/5")
    if r.moisture_barrier >= 3 and moist >= 0.99:
        c.strengths.append(f"Moisture barrier ({m.moisture_barrier}/5) meets the required ~{r.moisture_barrier:.1f}/5")
    elif moist < 0.8:
        c.concerns.append(f"Moisture barrier ({m.moisture_barrier}/5) is below the required ~{r.moisture_barrier:.1f}/5")
    c.score = _clamp(c.score)
    return c


def protection_index(m: MaterialRecord, r: PackagingRequirements) -> float:
    if r.is_respiring:
        gas = _closeness(r.gas_exchange, m.gas_permeability)
        return 0.6 * gas * 5 + 0.25 * m.moisture_barrier + 0.15 * m.sealability
    total = r.moisture_barrier + r.oxygen_barrier
    barrier = (r.moisture_barrier * m.moisture_barrier + r.oxygen_barrier * m.oxygen_barrier) / total
    return 0.8 * barrier + 0.2 * m.sealability


def score_shelf_life(m: MaterialRecord, r: PackagingRequirements) -> CriterionScore:
    index = protection_index(m, r)
    c = CriterionScore("shelf_life", _fit(r.protection_level, index))
    if c.score >= 0.95:
        c.strengths.append(f"Prototype protection index {index:.1f}/5 considered for the {r.shelf_life_days}-day target; achievable shelf life is not validated")
    else:
        c.concerns.append(
            f"Protection index {index:.1f}/5 is below the ~{r.protection_level:.1f}/5 suggested for {r.shelf_life_days} days"
        )
    return c


def score_cost(m: MaterialRecord, r: PackagingRequirements) -> CriterionScore:
    affordability = (5 - m.relative_cost) / 4
    scale = {"low_cost": (0.0, 1.0), "balanced": (0.35, 0.65), "performance_first": (0.7, 0.3)}[r.cost_priority]
    c = CriterionScore("cost", _clamp(scale[0] + scale[1] * affordability))
    if m.relative_cost <= 2:
        c.strengths.append(f"{cost_label(m.relative_cost)} relative material cost")
    elif m.relative_cost >= 4:
        c.concerns.append(f"{cost_label(m.relative_cost)} relative material cost")
    return c


def score_sustainability(m: MaterialRecord, r: PackagingRequirements) -> CriterionScore:
    raw = 1.0 if m.biodegradable else 0.75 if m.recyclable else 0.2
    score = 0.6 + 0.4 * raw if r.sustainability_priority == "low" else raw
    c = CriterionScore("sustainability", score)
    if m.biodegradable:
        c.strengths.append("Biodegradable / compostable (industrial composting)")
    elif m.recyclable:
        c.strengths.append("Recyclable mono-material structure")
    else:
        c.concerns.append("Multi-material structure that is difficult to recycle")
    return c


def _map_fit(m: MaterialRecord, r: PackagingRequirements) -> float:
    if r.map_mode == "passive":
        return 0.5 * m.map_suitability / 5 + 0.5 * _closeness(r.gas_exchange, m.gas_permeability)
    return 0.4 * m.map_suitability / 5 + 0.35 * m.oxygen_barrier / 5 + 0.25 * m.sealability / 5


def score_map(m: MaterialRecord, r: PackagingRequirements) -> CriterionScore:
    c = CriterionScore("map_suitability", NEUTRAL_SCORE)
    if r.map_mode == "none":
        return c
    fit = _map_fit(m, r)
    c.score = fit if r.map_preference == "yes" else 0.5 * fit + 0.5 * NEUTRAL_SCORE
    if fit >= 0.8 and r.map_mode == "passive":
        c.strengths.append(
            f"MAP suitability {m.map_suitability}/5 with gas permeability {m.gas_permeability}/5 supports passive MAP"
        )
    elif fit >= 0.8:
        c.strengths.append(
            f"Supports gas-flush MAP (oxygen barrier {m.oxygen_barrier}/5, sealability {m.sealability}/5)"
        )
    elif fit < 0.6:
        c.concerns.append(f"Limited suitability for the required MAP mode (fit {fit:.0%})")
    return c


SCORERS = (score_food, score_storage, score_barrier, score_shelf_life, score_cost, score_sustainability, score_map)
