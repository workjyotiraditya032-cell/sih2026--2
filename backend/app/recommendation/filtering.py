"""Stage 2 — candidate filtering: removes clearly incompatible materials (hard constraints)."""
from dataclasses import dataclass

from app.models import MaterialRecord
from app.recommendation.requirements import PackagingRequirements


@dataclass
class ExcludedMaterial:
    material: MaterialRecord
    reasons: list[str]


def _exclusion_reasons(m: MaterialRecord, r: PackagingRequirements) -> list[str]:
    reasons = []
    missing = [s for s in r.required_storage_types if s not in m.suitable_storage_types]
    if missing:
        reasons.append(f"Not rated for {' / '.join(missing)} storage or transport conditions")
    if r.gas_exchange >= 4.0 and m.gas_permeability <= 1:
        reasons.append("Near-hermetic barrier: with high respiration this risks anaerobic conditions and off-flavours")
    if r.low_moisture_product and r.moisture_barrier >= 4.5 and m.moisture_barrier <= 1:
        reasons.append(f"Moisture barrier ({m.moisture_barrier}/5) is too low for a moisture-sensitive dry product")
    if r.oxygen_barrier >= 4.5 and m.oxygen_barrier <= 1:
        reasons.append(f"Oxygen barrier ({m.oxygen_barrier}/5) is too low for a highly oxygen-sensitive product")
    if not r.is_respiring and m.gas_permeability >= 5:
        reasons.append("Perforated, breathable structure gives no barrier protection to a non-respiring product")
    if r.product_form and r.product_form not in m.product_forms:
        reasons.append('Packaging format is not suitable for containing this food form')
    if r.is_respiring and m.gas_permeability <= 1:
        reasons.append('Respiring produce requires ventilation; an unmodified hermetic barrier is unsuitable')
    if r.product_form and r.food_category not in m.suitable_food_categories:
        reasons.append('No grounded food-category compatibility for this structure')
    if r.product_form and not r.is_respiring and r.oxygen_barrier >= 4.5 and m.oxygen_barrier < 3:
        reasons.append('Insufficient oxygen barrier for the oxidation-sensitive profile')
    if r.transportation == 'high_humidity' and m.material_category == 'Paper-based structure':
        reasons.append('Uncoated paper loses strength and barrier performance in high humidity')
    if r.product_form and r.moisture_barrier >= 3.5 and m.moisture_barrier <= 1:
        reasons.append('Moisture barrier is insufficient; sustainability cannot override technical suitability')
    return reasons


def filter_candidates(
    materials: list[MaterialRecord], r: PackagingRequirements
) -> tuple[list[MaterialRecord], list[ExcludedMaterial]]:
    candidates, excluded = [], []
    for material in materials:
        reasons = _exclusion_reasons(material, r)
        if reasons:
            excluded.append(ExcludedMaterial(material, reasons))
        else:
            candidates.append(material)
    return candidates, excluded
