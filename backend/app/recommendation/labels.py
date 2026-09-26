RATING_LABELS = {1: "Poor", 2: "Fair", 3: "Moderate", 4: "Good", 5: "Excellent"}
COST_LABELS = {1: "Very low", 2: "Low", 3: "Medium", 4: "High", 5: "Very high"}
GAS_PERMEABILITY_LABELS = {
    1: "Very low (near-hermetic)", 2: "Low", 3: "Moderate", 4: "High", 5: "Very high (breathable)",
}
STORAGE_LABELS = {"ambient": "ambient", "chilled": "chilled", "frozen": "frozen"}
TRANSPORT_LABELS = {
    "normal": "normal", "refrigerated": "refrigerated", "frozen": "frozen", "long_distance": "long-distance", "high_humidity": "high-humidity",
}
MAP_MODE_LABELS = {
    "passive": "Passive MAP (respiration-driven equilibrium atmosphere)",
    "gas_flush": "Active MAP (N2/CO2 gas flushing)",
    "none": "Not required",
}


def rating_label(value: int) -> str:
    return RATING_LABELS.get(value, str(value))


def cost_label(value: int) -> str:
    return COST_LABELS.get(value, str(value))
