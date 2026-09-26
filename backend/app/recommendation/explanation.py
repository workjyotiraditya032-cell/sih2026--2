"""Stage 5 — explanation built from the factors that actually drove each score."""
from app.recommendation.ranking import ScoredMaterial
from app.recommendation.weights import CRITERION_LABELS


def _lower(key: str) -> str:
    label = CRITERION_LABELS[key]
    return label if label.startswith("MAP") else label.lower()


def _by_contribution(s: ScoredMaterial, weights: dict[str, float]) -> list[str]:
    return sorted(s.criteria, key=lambda k: s.contribution(k, weights), reverse=True)


def build_reasons(top: ScoredMaterial, weights: dict[str, float], limit: int = 5) -> list[str]:
    ordered = _by_contribution(top, weights)
    primary = [top.criteria[k].strengths[0] for k in ordered if top.criteria[k].strengths]
    extra = [n for k in ordered for n in top.criteria[k].strengths[1:]]
    return (primary + extra)[:limit]


def build_score_breakdown(s: ScoredMaterial, weights: dict[str, float]) -> list[dict]:
    return [
        {
            "criterion": key,
            "label": CRITERION_LABELS[key],
            "weight": round(weights[key], 4),
            "score": round(c.score, 3),
            "contribution": round(weights[key] * c.score * 100, 2),
        }
        for key, c in s.criteria.items()
    ]


def _weighted_diffs(alt: ScoredMaterial, top: ScoredMaterial, weights: dict[str, float]) -> list[tuple[str, float]]:
    diffs = [(k, weights[k] * (alt.criteria[k].score - top.criteria[k].score)) for k in alt.criteria]
    return sorted(diffs, key=lambda item: item[1], reverse=True)


def describe_alternative(alt: ScoredMaterial, top: ScoredMaterial, weights: dict[str, float]) -> tuple[str, str]:
    diffs = _weighted_diffs(alt, top, weights)
    best_key, best_diff = diffs[0]
    worst_key, worst_diff = diffs[-1]
    top_name = top.material.material_name

    if best_diff > 0.001:
        strengths = alt.criteria[best_key].strengths
        advantage = strengths[0] if strengths else (
            f"Higher {_lower(best_key)} score than {top_name} "
            f"({alt.criteria[best_key].score:.0%} vs {top.criteria[best_key].score:.0%})"
        )
    else:
        strongest = _by_contribution(alt, weights)[0]
        notes = alt.criteria[strongest].strengths
        advantage = notes[0] if notes else f"Strongest on {_lower(strongest)}"

    if worst_diff < -0.001:
        concerns = alt.criteria[worst_key].concerns
        tradeoff = concerns[0] if concerns else (
            f"Lower {_lower(worst_key)} score than {top_name} "
            f"({alt.criteria[worst_key].score:.0%} vs {top.criteria[worst_key].score:.0%})"
        )
    else:
        tradeoff = f"Overall score {alt.score} vs {top.score} for {top_name}"
    return advantage, tradeoff


def build_tradeoffs(top: ScoredMaterial, alternatives: list[ScoredMaterial], weights: dict[str, float]) -> list[str]:
    tradeoffs = [f"{top.material.material_name}: {note}" for c in top.criteria.values() for note in c.concerns]
    for alt in alternatives:
        key, diff = _weighted_diffs(alt, top, weights)[0]
        if diff > 0.001:
            tradeoffs.append(
                f"{alt.material.material_name} scores higher on {_lower(key)} but ranks "
                f"{round(top.score - alt.score, 1)} points lower overall"
            )
    return tradeoffs[:5]


def build_summary(req, top: ScoredMaterial, n_candidates: int, n_excluded: int, weights: dict[str, float]) -> str:
    drivers = [_lower(k) for k in _by_contribution(top, weights)[:2]]
    excluded = f" {n_excluded} material(s) were filtered out as incompatible." if n_excluded else ""
    return (
        f"{top.material.material_name} ranks first among {n_candidates} compatible material(s) for "
        f"{req.commodity} ({req.food_category}) stored {req.storage_type} at {req.temperature:g} °C / "
        f"{req.relative_humidity:g}% RH, with a suitability score of {top.score}/100. "
        f"Main contributing criteria: {drivers[0]} and {drivers[1]}.{excluded}"
    )
