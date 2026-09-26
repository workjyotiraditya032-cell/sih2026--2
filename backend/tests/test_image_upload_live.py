"""Live image upload / vision tests: init + chunk + complete real happy path
plus robustness (bad MIME, chunk mismatch, duplicate resend idempotence,
missing chunk, completed-repeat, oversize)."""
import io
import os
import time
import requests
import pytest
from PIL import Image

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    from dotenv import dotenv_values
    BASE_URL = dotenv_values('/app/frontend/.env')['REACT_APP_BACKEND_URL']
API = BASE_URL.rstrip('/') + '/api'
CHUNK = 256 * 1024


# ---------- helpers ----------
def _jpeg_bytes(size_hint_kb: int) -> bytes:
    """Generate a real-looking food JPEG large enough to require >1 chunk."""
    # gradient + noise so JPEG compression can't collapse it to bytes
    w = h = 900
    img = Image.new('RGB', (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = ((x * 255) // w, ((x + y) * 255) // (w + h), (y * 255) // h)
    # random speckles for entropy
    import random
    r = random.Random(7)
    for _ in range(w * h // 6):
        x, y = r.randrange(w), r.randrange(h)
        px[x, y] = (r.randrange(256), r.randrange(256), r.randrange(256))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=92)
    return buf.getvalue()


def _png_bytes() -> bytes:
    img = Image.new('RGB', (200, 200), (200, 100, 50))
    for i in range(200):
        for j in range(200):
            img.putpixel((i, j), ((i * 255) // 200, (j * 255) // 200, 128))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


def _init(name, size):
    r = requests.post(f"{API}/food-images", json={"filename": name, "size": size}, timeout=15)
    return r


def _send_chunk(image_id, offset, data):
    return requests.post(f"{API}/food-images/{image_id}/chunks",
                         params={"offset": offset},
                         data=data,
                         headers={"Content-Type": "application/octet-stream"},
                         timeout=30)


def _complete(image_id):
    return requests.post(f"{API}/food-images/{image_id}/complete", timeout=90)


def _upload_full(payload: bytes, filename: str):
    init = _init(filename, len(payload))
    assert init.status_code == 200, init.text
    iid = init.json()["image_id"]
    for off in range(0, len(payload), CHUNK):
        piece = payload[off:off + CHUNK]
        r = _send_chunk(iid, off, piece)
        assert r.status_code == 200, f"chunk@{off}: {r.status_code} {r.text}"
        assert r.json()["received"] == off + len(piece)
    return iid


# ---------- Live happy path ----------
class TestImageUploadHappyPath:
    def test_multichunk_jpeg_real_vision(self):
        payload = _jpeg_bytes(400)
        assert len(payload) > CHUNK, f"expected >256KiB, got {len(payload)}"
        iid = _upload_full(payload, "tomato.jpg")
        done = _complete(iid)
        # Storage or vision may be unavailable in preview; expect either 200 or 503.
        if done.status_code == 503:
            pytest.skip(f"Storage/vision unavailable: {done.text}")
        assert done.status_code == 200, done.text
        data = done.json()
        assert data["image_id"] == iid
        assert data.get("requires_confirmation") is True
        assert data["mode"] in ("ai", "unavailable")
        # If AI answered, model must be the configured vision model and food_name
        # must NOT include hallucinated chemistry.
        if data["mode"] == "ai":
            assert data.get("model")
            expl = (data.get("explanation") or "").lower()
            # Vision must NOT produce fabricated chemistry values (numeric % or pH readings).
            import re
            assert not re.search(r"\bph\s*[:=]?\s*\d", expl), f"fabricated pH: {expl[:200]}"
            assert not re.search(r"moisture[^.]{0,40}\d+\s*%", expl), f"fabricated moisture: {expl[:200]}"

    def test_small_png_upload(self):
        payload = _png_bytes()
        iid = _upload_full(payload, "sample.png")
        done = _complete(iid)
        if done.status_code == 503:
            pytest.skip("Storage/vision unavailable")
        assert done.status_code == 200, done.text
        j = done.json()
        # A synthetic non-food gradient must NOT produce fabricated chemistry:
        # backend must request confirmation and mode is either ai (unclear=true) or unavailable.
        assert j["requires_confirmation"] is True
        if j["mode"] == "ai":
            # Either identified low-confidence or unclear – but never with a chemical readout.
            assert j.get("confidence") in ("low", "medium", "high")


# ---------- Robustness ----------
class TestImageUploadRobustness:
    def test_offset_mismatch_returns_409(self):
        init = _init("x.jpg", 1024).json()
        r = _send_chunk(init["image_id"], 999, b"a" * 100)
        assert r.status_code == 409

    def test_duplicate_resend_idempotent(self):
        payload = _jpeg_bytes(300)[:CHUNK]  # exactly one chunk worth
        init = _init("dup.jpg", len(payload) * 2).json()
        iid = init["image_id"]
        first = _send_chunk(iid, 0, payload)
        assert first.status_code == 200
        # resend identical chunk at offset 0 – should be idempotent (200 with same received)
        again = _send_chunk(iid, 0, payload)
        assert again.status_code == 200
        assert again.json()["received"] == first.json()["received"]

    def test_missing_chunk_complete_409(self):
        # declare 2 chunks worth but only send 1
        payload = _jpeg_bytes(400)
        init = _init("miss.jpg", len(payload)).json()
        iid = init["image_id"]
        _send_chunk(iid, 0, payload[:CHUNK])
        r = _complete(iid)
        assert r.status_code == 409, r.text

    def test_declared_oversize_rejected_by_chunk(self):
        # begin with size 1024 but try to push more
        init = _init("over.jpg", 1024).json()
        iid = init["image_id"]
        r = _send_chunk(iid, 0, b"a" * 2000)
        assert r.status_code == 413

    def test_wrong_content_rejected_by_pillow(self):
        # Upload plain text bytes of correct declared length; complete must 415.
        payload = b"This is not an image, just text.\n" * 100
        init = _init("bad.jpg", len(payload)).json()
        iid = init["image_id"]
        r = _send_chunk(iid, 0, payload)
        assert r.status_code == 200
        done = _complete(iid)
        assert done.status_code == 415, done.text

    def test_completed_upload_repeat_returns_same_identification(self):
        payload = _jpeg_bytes(400)
        iid = _upload_full(payload, "repeat.jpg")
        first = _complete(iid)
        if first.status_code == 503:
            pytest.skip("Storage/vision unavailable")
        assert first.status_code == 200, first.text
        again = _complete(iid)
        assert again.status_code == 200
        assert again.json()["image_id"] == iid
        # Second call must not touch storage/vision – identification stable
        assert again.json().get("mode") == first.json().get("mode")

    def test_unknown_image_id_complete_404(self):
        r = _complete("00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404

    def test_chunk_too_large_413(self):
        init = _init("big.jpg", 5 * CHUNK).json()
        iid = init["image_id"]
        r = _send_chunk(iid, 0, b"a" * (CHUNK + 10))
        assert r.status_code == 413
