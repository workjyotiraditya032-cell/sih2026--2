"""PackIntel v2 Food Intelligence backend API tests (iteration 4).

Covers the simplified /recommend contract, /analyze-food identification,
food KB grounding, validation, priority effects and history endpoints.
Uses only public HTTP endpoints via REACT_APP_BACKEND_URL.
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    from dotenv import dotenv_values
    BASE_URL = dotenv_values('/app/frontend/.env')['REACT_APP_BACKEND_URL']
BASE_URL = BASE_URL.rstrip('/')
API = f"{BASE_URL}/api"

TOMATO = {"food_name": "Tomato", "shelf_life_days": 10, "temperature": 8,
          "storage_type": "chilled", "transportation": "refrigerated", "priority": "shelf_life"}
CURD = {"food_name": "Curd", "shelf_life_days": 15, "temperature": 4,
        "storage_type": "chilled", "transportation": "refrigerated", "priority": "shelf_life"}
POTATO = {"food_name": "Potato", "shelf_life_days": 20, "temperature": 12,
          "storage_type": "chilled", "transportation": "normal", "priority": "balanced"}
BISCUITS = {"food_name": "Biscuits", "shelf_life_days": 90, "temperature": 25,
            "storage_type": "ambient", "transportation": "normal", "priority": "balanced"}
MILK = {"food_name": "Milk", "shelf_life_days": 7, "temperature": 4,
        "storage_type": "chilled", "transportation": "refrigerated", "priority": "shelf_life"}


# ---------- System ----------
class TestSystem:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "ok"
        assert "MongoDB" in d["database"]["engine"] or d["database"]["engine"] == "PostgreSQL"

    def test_materials_list(self):
        r = requests.get(f"{API}/materials", timeout=10)
        assert r.status_code == 200
        mats = r.json()["materials"]
        assert len(mats) >= 9
        # All items expose required schema fields
        for m in mats[:3]:
            for k in ("id", "material_name", "packaging_structure", "relative_cost", "recyclable"):
                assert k in m

    def test_material_detail_and_404(self):
        mats = requests.get(f"{API}/materials", timeout=10).json()["materials"]
        mid = mats[0]["id"]
        r = requests.get(f"{API}/materials/{mid}", timeout=10)
        assert r.status_code == 200
        assert r.json()["material"]["id"] == mid
        assert requests.get(f"{API}/materials/999999", timeout=10).status_code == 404

    def test_commodities_list(self):
        r = requests.get(f"{API}/commodities", timeout=10)
        assert r.status_code == 200
        assert r.json()["count"] > 0

    def test_engine_config(self):
        r = requests.get(f"{API}/engine/config", timeout=10)
        assert r.status_code == 200
        assert "base_weights" in r.json()


# ---------- Food profiles & identify ----------
class TestFoodProfiles:
    def test_food_profiles_endpoint(self):
        r = requests.get(f"{API}/food-profiles", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["count"] >= 20
        foods = {f["food"] for f in d["foods"]}
        for f in ("Tomato", "Curd", "Potato", "Milk", "Biscuits"):
            assert f in foods, f"{f} missing from food KB"

    def test_analyze_food_alias_yogurt_to_curd(self):
        r = requests.post(f"{API}/analyze-food", json={"food_name": "yogurt"}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["food"] == "Curd"
        assert d["food_profile"]["provenance"] == "reference"

    def test_analyze_food_biscuit_ph_unavailable(self):
        d = requests.post(f"{API}/analyze-food", json={"food_name": "Biscuits"}, timeout=15).json()
        # pH range explicitly unavailable for biscuits
        assert d["food_profile"]["ph_range"] is None
        assert d["food_profile"]["properties"]["ph"]["source"] == "unavailable"

    def test_analyze_food_tomato_kb_grounded(self):
        d = requests.post(f"{API}/analyze-food", json={"food_name": "Tomato"}, timeout=15).json()
        prof = d["food_profile"]
        assert prof["provenance"] == "reference"
        assert prof["moisture_range"] == [90, 95]
        assert prof["ph_range"] == [4.0, 4.9]

    def test_analyze_food_ambiguous_rejected(self):
        # Non-food/ambiguous name should be rejected (422) via AI clarification path
        r = requests.post(f"{API}/analyze-food", json={"food_name": "asdfqwerty"}, timeout=40)
        assert r.status_code in (422, 503), r.text

    def test_analyze_food_forbids_extra_fields(self):
        r = requests.post(f"{API}/analyze-food",
                          json={"food_name": "Tomato", "ph": 4.3}, timeout=10)
        assert r.status_code == 422

    def test_analyze_food_empty_name(self):
        assert requests.post(f"{API}/analyze-food", json={"food_name": ""}, timeout=10).status_code == 422

    def test_analyze_food_invalid_chars(self):
        r = requests.post(f"{API}/analyze-food",
                          json={"food_name": "<script>alert(1)</script>"}, timeout=10)
        assert r.status_code == 422


# ---------- /recommend simplified contract ----------
def _post_recommend(payload, timeout=60):
    return requests.post(f"{API}/recommend", json=payload, timeout=timeout)


class TestRecommend:
    def test_tomato_shape_and_ai_or_kb(self):
        r = _post_recommend(TOMATO)
        assert r.status_code == 200, r.text
        d = r.json()
        # simplified engine still returns the classic RecommendationResponse
        assert d["recommended_material"]["material_name"]
        assert isinstance(d.get("analysis_id"), int)
        assert "intelligence" in d and d["intelligence"] is not None
        intel = d["intelligence"]
        assert intel["mode"] in ("ai", "knowledge_base")
        assert intel["food_profile"]["food"] == "Tomato"
        assert intel["food_profile"]["provenance"] == "reference"
        # tomato @ 8C/10d chilling-injury warning must surface
        warnings_blob = " ".join(intel["warnings"]).lower()
        assert ("chilling" in warnings_blob) or ("8 °c" in warnings_blob) or ("outside" in warnings_blob)
        # assumptions include humidity assumption text
        assert any("relative humidity" in a.lower() for a in intel["assumptions"])
        # disclaimer present
        assert d.get("disclaimer")

    def test_forbid_technical_fields(self):
        # New simplified contract must reject old technical params
        bad = {**TOMATO, "moisture_content": 94, "ph": 4.3}
        r = _post_recommend(bad, timeout=15)
        assert r.status_code == 422

    def test_validation_shelf_life_bounds(self):
        assert _post_recommend({**TOMATO, "shelf_life_days": 0}, timeout=10).status_code == 422
        assert _post_recommend({**TOMATO, "shelf_life_days": 5000}, timeout=10).status_code == 422

    def test_validation_frozen_needs_cold(self):
        r = _post_recommend({**TOMATO, "storage_type": "frozen", "temperature": 5}, timeout=10)
        assert r.status_code == 422

    def test_validation_ambient_min_temp(self):
        r = _post_recommend({**TOMATO, "storage_type": "ambient", "temperature": -5}, timeout=10)
        assert r.status_code == 422

    def test_validation_empty_food_name(self):
        r = _post_recommend({**TOMATO, "food_name": ""}, timeout=10)
        assert r.status_code == 422

    def test_four_demos_produce_distinct_structures(self):
        results = {}
        for name, payload in [("Tomato", TOMATO), ("Curd", CURD), ("Potato", POTATO), ("Biscuits", BISCUITS)]:
            r = _post_recommend(payload, timeout=90)
            assert r.status_code == 200, f"{name}: {r.text[:400]}"
            d = r.json()
            results[name] = {
                "material": d["recommended_material"]["material_name"],
                "structure": d["recommended_material"].get("packaging_structure"),
                "mode": d["intelligence"]["mode"],
            }
            time.sleep(0.5)
        print("\nDEMO RESULTS:", results)
        # All four requested demo foods must yield distinct, grounded packaging structures.
        distinct = {v["material"] for v in results.values()}
        assert len(distinct) == 4, f"The four required demo recommendations must differ: {results}"

    def test_milk_demo_kb_grounded(self):
        r = _post_recommend(MILK, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["intelligence"]["food_profile"]["food"] == "Milk"
        assert d["intelligence"]["food_profile"]["food_category"] == "Dairy"

    def test_curd_no_blanket_metal_ban(self):
        d = _post_recommend(CURD, timeout=60).json()
        ranking = d.get("ranking", [])
        metal_present = any(
            ("Foil" in m.get("material_name", "") or "Metallized" in m.get("material_name", "")
             or "metal" in (m.get("packaging_structure") or "").lower())
            for m in ranking
        )
        assert metal_present, "Curd ranking should not blanket-exclude metal-containing laminates"

    def test_priority_changes_result(self):
        cost_d = _post_recommend({**BISCUITS, "priority": "cost"}, timeout=60).json()
        shelf_d = _post_recommend({**BISCUITS, "priority": "shelf_life"}, timeout=60).json()
        # Either the primary changes, or the score / ranking order changes
        changed = (
            cost_d["recommended_material"]["material_name"] != shelf_d["recommended_material"]["material_name"]
            or cost_d["suitability_score"] != shelf_d["suitability_score"]
            or [m["material_name"] for m in cost_d["ranking"]] != [m["material_name"] for m in shelf_d["ranking"]]
        )
        assert changed, "Priority change had no visible effect on scoring"

    def test_high_humidity_transport_no_paper_primary(self):
        # Paper-based structures must not win for wet/respiring produce under high humidity
        r = _post_recommend({**TOMATO, "transportation": "high_humidity"}, timeout=60)
        assert r.status_code == 200
        name = r.json()["recommended_material"]["material_name"].lower()
        assert "paper" not in name and "kraft" not in name

    def test_ai_estimated_for_unknown_recognized_food(self):
        # papaya is not in the KB but is a well-known food – AI should return ai_estimated ranges
        r = _post_recommend({**TOMATO, "food_name": "Papaya"}, timeout=90)
        # If AI down we expect 422 (reference unavailable); if AI up expect 200 ai_estimated
        assert r.status_code in (200, 422), r.text
        if r.status_code == 200:
            prof = r.json()["intelligence"]["food_profile"]
            assert prof["provenance"] == "ai_estimated"
            assert r.json()["intelligence"]["confidence"] == "low"


# ---------- History ----------
class TestHistory:
    def test_recommend_returns_analysis_id_and_reopen_snapshot(self):
        r = _post_recommend({**TOMATO}, timeout=60).json()
        aid = r["analysis_id"]
        assert isinstance(aid, int) and aid >= 1
        got = requests.get(f"{API}/analyses/{aid}", timeout=15)
        assert got.status_code == 200, got.text
        gd = got.json()
        assert gd["analysis_id"] == aid
        assert gd["history_source"] in ("stored_snapshot", "recomputed")
        assert gd["recommended_material"]["material_name"] == r["recommended_material"]["material_name"]

    def test_list_analyses_newest_first(self):
        r = _post_recommend({**TOMATO}, timeout=60).json()
        aid = r["analysis_id"]
        lst = requests.get(f"{API}/analyses", params={"limit": 5}, timeout=10).json()
        assert lst["analyses"][0]["id"] == aid
        for item in lst["analyses"]:
            for k in ("id", "commodity", "recommended_material", "created_at", "has_snapshot"):
                assert k in item

    def test_legacy_snapshot_rehydrates(self):
        """Reopen an actual OLD stored snapshot (payload lacks 'intelligence')."""
        lst = requests.get(f"{API}/analyses", params={"limit": 500}, timeout=15).json()
        # Legacy snapshots are stored_snapshot rows written by the old engine
        # (no intelligence field). Reopen at least one and confirm it rehydrates.
        for a in lst["analyses"]:
            if not a["has_snapshot"]:
                continue
            r = requests.get(f"{API}/analyses/{a['id']}", timeout=15)
            if r.status_code != 200:
                continue
            d = r.json()
            if d["history_source"] == "stored_snapshot" and d.get("intelligence") is None:
                assert d["recommended_material"]["material_name"]
                assert d["analysis_id"] == a["id"]
                return
        pytest.skip("No pre-existing legacy (pre-intelligence) snapshots to verify")

    def test_analyses_search_invalid_chars_422(self):
        r = requests.get(f"{API}/analyses", params={"search": "<script>"}, timeout=10)
        assert r.status_code == 422

    def test_get_unknown_analysis_404(self):
        assert requests.get(f"{API}/analyses/99999999", timeout=10).status_code == 404


# ---------- Image upload validation (public surface only) ----------
class TestImageUpload:
    def test_begin_upload_extra_fields_forbidden(self):
        r = requests.post(f"{API}/food-images",
                          json={"filename": "f.jpg", "size": 1024, "extra": True}, timeout=10)
        assert r.status_code == 422

    def test_begin_upload_zero_size_rejected(self):
        r = requests.post(f"{API}/food-images", json={"filename": "f.jpg", "size": 0}, timeout=10)
        assert r.status_code == 422

    def test_begin_upload_oversize_rejected(self):
        r = requests.post(f"{API}/food-images",
                          json={"filename": "f.jpg", "size": 20 * 1024 * 1024}, timeout=10)
        assert r.status_code == 422

    def test_recommend_rejects_unconfirmed_image_id(self):
        # A random UUID is not a real upload; identify_food should 404/422
        r = _post_recommend({**TOMATO,
                             "image_id": "00000000-0000-0000-0000-000000000000",
                             "image_confirmed": True}, timeout=15)
        assert r.status_code in (404, 422)
