"""Configurable weighting parameters for the scoring stage (NOT model accuracy figures)."""

DEFAULT_WEIGHTS: dict[str, float] = {
    "food_compatibility": 0.25,
    "storage_compatibility": 0.20,
    "barrier_requirements": 0.20,
    "shelf_life": 0.15,
    "cost": 0.10,
    "sustainability": 0.05,
    "map_suitability": 0.05,
}

CRITERION_LABELS: dict[str, str] = {
    "food_compatibility": "Food compatibility",
    "storage_compatibility": "Storage compatibility",
    "barrier_requirements": "Barrier requirements",
    "shelf_life": "Shelf-life suitability",
    "cost": "Cost",
    "sustainability": "Sustainability",
    "map_suitability": "MAP suitability",
}

# User preferences scale the relevant base weight before normalisation.
PRIORITY_MULTIPLIERS: dict[str, dict[str, float]] = {
    "cost": {"low_cost": 2.0, "balanced": 1.0, "performance_first": 0.5},
    "sustainability": {"low": 0.5, "medium": 1.0, "high": 3.0},
    "map_suitability": {"yes": 2.0, "not_sure": 1.0, "no": 0.6},
}


def resolve_base_weights(*overrides: dict[str, float] | None) -> dict[str, float]:
    weights = dict(DEFAULT_WEIGHTS)
    for override in overrides:
        if override:
            weights.update({k: float(v) for k, v in override.items() if k in weights})
    return weights


def effective_weights(
    base: dict[str, float], cost_priority: str, sustainability_priority: str, map_preference: str
) -> dict[str, float]:
    scaled = dict(base)
    if cost_priority == 'performance_first':
        scaled['barrier_requirements'] *= 1.5
        scaled['shelf_life'] *= 2.0
    scaled["cost"] *= PRIORITY_MULTIPLIERS["cost"][cost_priority]
    scaled["sustainability"] *= PRIORITY_MULTIPLIERS["sustainability"][sustainability_priority]
    scaled["map_suitability"] *= PRIORITY_MULTIPLIERS["map_suitability"][map_preference]
    total = sum(scaled.values()) or 1.0
    return {k: v / total for k, v in scaled.items()}
