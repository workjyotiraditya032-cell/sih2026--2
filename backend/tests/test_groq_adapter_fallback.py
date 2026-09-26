"""Groq adapter fallback coverage.

Uses httpx MockTransport to prove the adapter converts 429, 5xx, timeouts,
malformed JSON and Pydantic validation errors into a single AIUnavailable,
and that food_intelligence.recommend continues to return a KB result.
"""
import sys
import pytest
import httpx

sys.path.insert(0, "/app/backend")
from app.services import groq_service, food_intelligence  # noqa: E402
from app.schemas.food import SimpleRecommendationRequest, AISelection  # noqa: E402
from app.core.config import settings  # noqa: E402

TOMATO = SimpleRecommendationRequest(
    food_name="Tomato", shelf_life_days=10, temperature=8,
    storage_type="chilled", transportation="refrigerated", priority="shelf_life",
)


def _patch_httpx(monkeypatch, handler):
    """Install a MockTransport-wrapped Client so groq_service.complete uses it."""
    real_client = httpx.Client

    def factory(*a, **kw):
        kw["transport"] = httpx.MockTransport(handler)
        return real_client(*a, **kw)

    monkeypatch.setattr(groq_service.httpx, "Client", factory)
    # Ensure adapter proceeds past config check
    monkeypatch.setattr(settings, "groq_api_key", settings.groq_api_key or "test-key")
    monkeypatch.setattr(settings, "groq_model", settings.groq_model or "openai/gpt-oss-120b")
    monkeypatch.setattr(settings, "groq_base_url", settings.groq_base_url or "https://api.groq.com/openai/v1")


def test_adapter_maps_http_429(monkeypatch):
    _patch_httpx(monkeypatch, lambda req: httpx.Response(429, json={"error": {"message": "rate limit"}}))
    with pytest.raises(groq_service.AIUnavailable):
        groq_service.complete(AISelection, "t", {"a": 1})


def test_adapter_maps_http_500(monkeypatch):
    _patch_httpx(monkeypatch, lambda req: httpx.Response(500, text="upstream boom"))
    with pytest.raises(groq_service.AIUnavailable):
        groq_service.complete(AISelection, "t", {"a": 1})


def test_adapter_maps_timeout(monkeypatch):
    def timeout(req):
        raise httpx.ReadTimeout("slow", request=req)
    _patch_httpx(monkeypatch, timeout)
    with pytest.raises(groq_service.AIUnavailable):
        groq_service.complete(AISelection, "t", {"a": 1})


def test_adapter_maps_connect_error(monkeypatch):
    def refuse(req):
        raise httpx.ConnectError("no route", request=req)
    _patch_httpx(monkeypatch, refuse)
    with pytest.raises(groq_service.AIUnavailable):
        groq_service.complete(AISelection, "t", {"a": 1})


def test_adapter_maps_malformed_json_string(monkeypatch):
    # 200 but response.json() cannot be parsed -> ValueError -> AIUnavailable
    _patch_httpx(monkeypatch, lambda req: httpx.Response(
        200, headers={"content-type": "application/json"}, content=b"not-json-at-all"))
    with pytest.raises(groq_service.AIUnavailable):
        groq_service.complete(AISelection, "t", {"a": 1})


def test_adapter_maps_json_missing_choices(monkeypatch):
    _patch_httpx(monkeypatch, lambda req: httpx.Response(200, json={"foo": "bar"}))
    with pytest.raises(groq_service.AIUnavailable):
        groq_service.complete(AISelection, "t", {"a": 1})


def test_adapter_maps_pydantic_validation(monkeypatch):
    # choices[0].message.content is JSON but does NOT match AISelection schema
    body = {"choices": [{"message": {"content": '{"primary_material_id": "not-int"}'}}]}
    _patch_httpx(monkeypatch, lambda req: httpx.Response(200, json=body))
    with pytest.raises(groq_service.AIUnavailable):
        groq_service.complete(AISelection, "t", {"a": 1})


def test_recommend_survives_httpx_429(monkeypatch):
    """End-to-end: /recommend must degrade to knowledge_base when the real HTTP
    adapter is hammered by 429 – not just when AIUnavailable is pre-injected."""
    _patch_httpx(monkeypatch, lambda req: httpx.Response(429, text="rate"))
    result = food_intelligence.recommend(TOMATO)
    assert result.intelligence.mode == "knowledge_base"
    assert result.recommended_material.material_name
    assert "unavailable" in result.intelligence.message.lower()


def test_recommend_survives_httpx_timeout(monkeypatch):
    def timeout(req):
        raise httpx.ConnectTimeout("boom", request=req)
    _patch_httpx(monkeypatch, timeout)
    result = food_intelligence.recommend(TOMATO)
    assert result.intelligence.mode == "knowledge_base"
