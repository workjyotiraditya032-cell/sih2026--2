"""Derives indicative packaging specifications for a ranked material."""
from app.models import MaterialRecord
from app.recommendation.labels import GAS_PERMEABILITY_LABELS, rating_label
from app.recommendation.requirements import Band, PackagingRequirements

TEST_CONDITIONS = "Indicative reference ranges, not lab measurements: nominal OTR 23 °C / 0% RH; WVTR 38 °C / 90% RH. Validate the complete pack, lid and perforations."


def _band_status(low: float, high: float, band: Band) -> str:
    if not band.critical:
        return "not_critical"
    band_max = band.maximum if band.maximum is not None else float("inf")
    if low >= band.minimum and high <= band_max:
        return "meets"
    if low <= band_max and high >= band.minimum:
        return "partial"
    return "outside"


def _recommended_thickness(m: MaterialRecord, r: PackagingRequirements) -> float:
    demand = 0.2 + 0.3 * (r.protection_level - 2.5) / 2 + 0.3 * (r.mechanical_strength - 2.5) / 2
    demand = max(0.1, min(0.9, demand))
    value = m.min_thickness + (m.max_thickness - m.min_thickness) * demand
    return max(m.min_thickness, min(m.max_thickness, round(value / 5) * 5))


def _package_format(r: PackagingRequirements) -> str:
    suggested = " (MAP suggested by engine)" if r.map_preference == "not_sure" and r.map_mode != "none" else ""
    if r.map_mode == "passive":
        return "Sealed pouch or flow-wrap with passive MAP" + suggested
    if r.map_mode == "gas_flush":
        return "Hermetically heat-sealed pouch with nitrogen gas flushing" + suggested
    if r.is_respiring:
        return "Ventilated bag, punnet overwrap or liner"
    return "Heat-sealed pouch, bag or liner"


def _rating(value: int, labels: dict[int, str] | None = None) -> dict:
    return {"rating": value, "label": (labels or {}).get(value) or rating_label(value)}


def build_specifications(m: MaterialRecord, r: PackagingRequirements) -> dict:
    return {
        "otr": {
            "min": m.otr_min, "max": m.otr_max, "unit": "cm³/m²·day",
            "target": r.otr_target.label, "status": _band_status(m.otr_min, m.otr_max, r.otr_target),
        },
        "wvtr": {
            "min": m.wvtr_min, "max": m.wvtr_max, "unit": "g/m²·day",
            "target": r.wvtr_target.label, "status": _band_status(m.wvtr_min, m.wvtr_max, r.wvtr_target),
        },
        "thickness": {
            "recommended": _recommended_thickness(m, r), "min": m.min_thickness, "max": m.max_thickness, "unit": "µm",
        },
        "sealability": _rating(m.sealability),
        "gas_permeability": _rating(m.gas_permeability, GAS_PERMEABILITY_LABELS),
        "mechanical_strength": _rating(m.mechanical_strength),
        "map_suitability": _rating(m.map_suitability),
        "package_format": m.packaging_structure or _package_format(r),
        "test_conditions": TEST_CONDITIONS,
    }
