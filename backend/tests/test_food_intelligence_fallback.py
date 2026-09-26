"""In-process unit tests exercising Groq fallback / failure paths.

These monkeypatch the Groq adapter to simulate outages, malformed JSON and
invalid material selections. They validate that the service degrades to
'knowledge_base' mode honestly, without leaking secrets or 500ing.
"""
import os
import sys
import pytest

sys.path.insert(0, "/app/backend")

from app.services import food_intelligence, groq_service  # noqa: E402
from app.schemas.food import SimpleRecommendationRequest  # noqa: E402

TOMATO = SimpleRecommendationRequest(
    food_name="Tomato", shelf_life_days=10, temperature=8,
    storage_type="chilled", transportation="refrigerated", priority="shelf_life",
)


def _force_ai_unavailable(*_a, **_kw):
    raise groq_service.AIUnavailable("simulated")


def _force_malformed(*_a, **_kw):
    raise groq_service.AIUnavailable("provider_unavailable_or_invalid")


def test_known_food_falls_back_to_knowledge_base(monkeypatch):
    """Groq outage on known food -> KB recommendation, no 500."""
    monkeypatch.setattr(groq_service, "complete", _force_ai_unavailable)
    result = food_intelligence.recommend(TOMATO)
    assert result.recommended_material.material_name
    assert result.intelligence.mode == "knowledge_base"
    assert result.intelligence.provider is None
    assert "unavailable" in result.intelligence.message.lower()
    # Warnings still surfaced (chilling injury etc.)
    assert result.intelligence.warnings


def test_malformed_ai_response_falls_back_to_kb(monkeypatch):
    monkeypatch.setattr(groq_service, "complete", _force_malformed)
    result = food_intelligence.recommend(TOMATO)
    assert result.intelligence.mode == "knowledge_base"
    assert result.intelligence.food_profile.food == "Tomato"


def test_invalid_material_selection_is_ignored(monkeypatch):
    """If Groq picks an out-of-shortlist material, engine must reject the AI
    selection and use KB order, not 500."""
    from app.schemas.food import AISelection, FoodEstimate

    def fake_complete(schema, *_a, **_kw):
        if schema is AISelection:
            return AISelection(
                primary_material_id=99999,  # not in shortlist
                explanation="This explanation is intentionally long enough to pass the schema length rule set by the food intelligence engine.",
                reasoning_factors=["fake", "invalid"],
                alternatives=[], alternative_reasons=[],
                confidence="low", warnings=[],
            )
        raise groq_service.AIUnavailable("unused")

    monkeypatch.setattr(groq_service, "complete", fake_complete)
    result = food_intelligence.recommend(TOMATO)
    assert result.intelligence.mode == "knowledge_base"


def test_duplicate_alternatives_ignored(monkeypatch):
    from app.schemas.food import AISelection

    def fake_complete(schema, *_a, **_kw):
        if schema is AISelection:
            # Grab a valid id then fabricate a duplicate list
            return AISelection(
                primary_material_id=1,
                explanation="This explanation is long enough to pass the minimum length restriction imposed by the AISelection schema definition.",
                reasoning_factors=["a", "b"],
                alternatives=[1, 1],  # duplicate of primary
                alternative_reasons=["r1", "r2"],
                confidence="low", warnings=[],
            )
        raise groq_service.AIUnavailable("unused")

    monkeypatch.setattr(groq_service, "complete", fake_complete)
    result = food_intelligence.recommend(TOMATO)
    assert result.intelligence.mode == "knowledge_base"


def test_missing_groq_key(monkeypatch):
    """Empty key -> AIUnavailable('not_configured') -> KB fallback."""
    from app.core.config import settings
    monkeypatch.setattr(settings, "groq_api_key", "")
    result = food_intelligence.recommend(TOMATO)
    assert result.intelligence.mode == "knowledge_base"


def test_unknown_food_with_ai_down_raises_422(monkeypatch):
    """Unknown food + AI down = honest 422, never a silent invented profile."""
    from fastapi import HTTPException
    monkeypatch.setattr(groq_service, "complete", _force_ai_unavailable)
    req = SimpleRecommendationRequest(
        food_name="zzznotfood123", shelf_life_days=10, temperature=8,
        storage_type="chilled", transportation="refrigerated", priority="shelf_life",
    )
    with pytest.raises(HTTPException) as exc:
        food_intelligence.recommend(req)
    assert exc.value.status_code == 422
    assert "unavailable" in exc.value.detail.lower() or "reference" in exc.value.detail.lower()


def test_priority_shifts_weights():
    """Same food, cost vs shelf-life priorities produce measurable differences."""
    cost_req = TOMATO.model_copy(update={"priority": "cost"})
    life_req = TOMATO.model_copy(update={"priority": "shelf_life"})
    a = food_intelligence.recommend(cost_req)
    b = food_intelligence.recommend(life_req)
    changed = (
        a.recommended_material.material_name != b.recommended_material.material_name
        or a.suitability_score != b.suitability_score
        or [m.material_name for m in a.ranking] != [m.material_name for m in b.ranking]
    )
    assert changed
