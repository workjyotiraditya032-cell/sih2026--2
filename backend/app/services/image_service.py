"""Image upload and food identification service.

Stores confirmed images into MongoDB GridFS (or local storage).
"""
import io
import json
import logging
import threading
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timezone
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import HTTPException

from app.core.config import settings
from app.db.mongodb import get_collection, get_gridfs, ping_database
from app.schemas.food import ImageIdentification
from app.services.ai_provider import AIUnavailable, get_ai_provider

logger = logging.getLogger(__name__)

CHUNK_SIZE = 256 * 1024
MAX_SIZE = 8 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 20_000_000

_upload_lock = threading.Lock()


def image_record(image_id: str) -> dict:
    """Fetch image upload record from MongoDB food_images collection."""
    if not ping_database():
        raise HTTPException(503, "Database is currently unavailable. Food-name recommendations remain available.")

    col = get_collection("food_images")
    row = col.find_one({"id": str(image_id), "is_deleted": {"$ne": True}})
    if not row:
        raise HTTPException(404, "Image upload not found. Please upload the image again.")
    return row


def begin_upload(filename: str, size: int) -> dict:
    """Initiate a chunked image upload session."""
    temp_dir = settings.upload_temp_dir or "/tmp/packintel_uploads"
    folder = Path(temp_dir)
    folder.mkdir(parents=True, exist_ok=True)

    # Clean up stale partial uploads older than 24 hours
    import time
    for old in folder.glob("*.part"):
        try:
            if time.time() - old.stat().st_mtime > 86400:
                old.unlink(missing_ok=True)
        except OSError:
            pass

    image_id = str(uuid4())

    if ping_database():
        col = get_collection("food_images")
        col.insert_one({
            "id": image_id,
            "expected_size": size,
            "original_filename": filename,
            "status": "uploading",
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc),
        })

    (folder / f"{image_id}.part").touch()
    return {"image_id": image_id, "chunk_size": CHUNK_SIZE}


def receive_chunk(image_id: str, offset: int, data: bytes) -> dict:
    """Receive and append an uploaded chunk."""
    if not data or len(data) > CHUNK_SIZE:
        raise HTTPException(413, "Upload chunks must be 1–256 KiB.")

    with _upload_lock:
        record = image_record(image_id)
        if record.get("status") != "uploading":
            raise HTTPException(409, "This image has already finished uploading.")

        temp_dir = settings.upload_temp_dir or "/tmp/packintel_uploads"
        path = Path(temp_dir) / f"{image_id}.part"
        if not path.exists():
            raise HTTPException(410, "Upload session expired; please select the image again.")

        received = path.stat().st_size
        if offset != received:
            with path.open("rb") as stream:
                stream.seek(offset)
                if offset < received and stream.read(len(data)) == data:
                    return {"received": received}
            raise HTTPException(409, f"Upload offset mismatch; received {received} bytes. Please retry the upload.")

        if received + len(data) > record.get("expected_size", MAX_SIZE) or received + len(data) > MAX_SIZE:
            raise HTTPException(413, "Image exceeds the declared upload size or 8 MiB limit.")

        with path.open("ab") as stream:
            stream.write(data)
        return {"received": received + len(data)}


def finish_upload(image_id: str) -> dict:
    """Finalize upload, normalize image, persist into MongoDB GridFS, and identify food."""
    record = image_record(image_id)
    if record.get("status") == "complete":
        return {"image_id": image_id, **record.get("identification", {})}

    temp_dir = settings.upload_temp_dir or "/tmp/packintel_uploads"
    path = Path(temp_dir) / f"{image_id}.part"
    if not path.exists() or path.stat().st_size != record.get("expected_size"):
        raise HTTPException(409, "Image upload is incomplete. Please retry selecting the file.")

    try:
        with Image.open(path) as image:
            if image.format not in ("JPEG", "PNG"):
                raise HTTPException(415, "Only JPEG and PNG images are supported.")
            image.verify()

        with Image.open(path) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            image.thumbnail((1280, 1280))
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=85)
            data = buffer.getvalue()
    except HTTPException:
        path.unlink(missing_ok=True)
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        path.unlink(missing_ok=True)
        logger.warning("Invalid image upload: %s", exc)
        raise HTTPException(415, "The file is not a valid JPEG/PNG image, or its pixel dimensions are too large.")

    # Save to MongoDB GridFS
    canonical_path = f"gridfs://food-images/{image_id}.jpg"
    try:
        if ping_database():
            fs = get_gridfs()
            grid_file_id = fs.put(data, filename=f"{image_id}.jpg", content_type="image/jpeg")
            canonical_path = f"gridfs://food-images/{grid_file_id}"
    except Exception as exc:
        logger.warning("MongoDB GridFS upload failed: %s", exc)
        raise HTTPException(503, "Image storage is temporarily unavailable. Retry the upload or continue using only the food name.")

    # Perform AI vision identification using configured AIProvider
    ai_provider = get_ai_provider()
    active_vision_model = (
        getattr(ai_provider, "vision_model", None)
        or settings.ai_vision_model
        or "qwen/qwen3.8-27b"
    )
    try:
        detection = ai_provider.complete(
            ImageIdentification,
            "Identify the main visible food only. Do not measure or guess chemical properties. "
            "If blurry, multiple foods, non-food or uncertain: set unclear=true and confidence=low. "
            "Name=null if not identifiable. Ask user to confirm or correct the identification.",
            {},
            image=data,
        )
        identification = {
            **detection.model_dump(),
            "mode": "ai",
            "model": active_vision_model,
            "requires_confirmation": True,
            "error_code": None,
        }
    except AIUnavailable as exc:
        err_code = getattr(exc, "code", "unavailable")
        err_detail = getattr(exc, "detail", str(exc))
        logger.warning("AI vision identification unavailable (code: %s, detail: %s)", err_code, err_detail)

        user_explanations = {
            "auth_error": "AI service authentication error. Enter the food name manually and confirm it to continue.",
            "model_unavailable": "AI vision model is temporarily unavailable. Enter the food name manually and confirm it to continue.",
            "rate_limit": "AI service rate limit reached. Please enter the food name manually or retry shortly.",
            "timeout": "AI image analysis timed out. Enter the food name manually and confirm it to continue.",
            "not_configured": "AI image identification is not configured. Enter the food name manually and confirm it to continue.",
            "generic_ai_failure": "AI image identification could not complete. Enter the food name manually and confirm it to continue.",
        }
        explanation = user_explanations.get(
            err_code,
            "AI image identification is temporarily unavailable. Enter the food name manually and confirm it to continue.",
        )
        identification = {
            "food_name": None,
            "confidence": "low",
            "unclear": True,
            "mode": "unavailable",
            "model": active_vision_model,
            "explanation": explanation,
            "requires_confirmation": True,
            "error_code": err_code,
        }

    # Update record in MongoDB
    if ping_database():
        col = get_collection("food_images")
        col.update_one(
            {"id": image_id},
            {
                "$set": {
                    "storage_path": canonical_path,
                    "identification": identification,
                    "status": "complete",
                    "completed_at": datetime.now(timezone.utc),
                }
            },
        )

    path.unlink(missing_ok=True)
    return {"image_id": image_id, **identification}
