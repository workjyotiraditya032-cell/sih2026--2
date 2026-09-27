import json
import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = BACKEND_DIR.parent
SQL_DIR = PROJECT_DIR / "database"

load_dotenv(BACKEND_DIR / ".env")


def _normalize_origin(origin: str) -> str:
    return origin.strip().rstrip("/")


def _csv(value: str) -> list[str]:
    return [_normalize_origin(item) for item in value.split(",") if item.strip()]


class Settings:
    app_name = "PackIntel — Food Packaging Recommendation API"
    app_version = "1.0.0"

    # Server binding
    port = int(os.environ.get("PORT", "8000"))

    # MongoDB Atlas settings
    mongodb_uri = os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URL") or ""
    mongodb_db_name = os.environ.get("MONGODB_DB_NAME") or os.environ.get("DB_NAME") or "packintel"

    # Frontend URL & CORS
    frontend_url = os.environ.get("FRONTEND_URL", "https://sih2026-2.vercel.app")
    _custom_cors = _csv(os.environ.get("CORS_ORIGINS", ""))

    @property
    def cors_origins(self) -> list[str]:
        origins = [
            "https://sih2026-2.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8000",
        ]
        if self.frontend_url:
            origins.extend(_csv(self.frontend_url))
        if self._custom_cors:
            origins.extend(self._custom_cors)
        return list(dict.fromkeys(origins))

    # Geocoding & Weather
    open_meteo_geocoding_url = os.environ.get("OPEN_METEO_GEOCODING_URL")
    open_meteo_forecast_url = os.environ.get("OPEN_METEO_FORECAST_URL")

    # Provider-independent AI configuration
    ai_provider = os.environ.get("AI_PROVIDER", "groq")
    ai_api_key = os.environ.get("AI_API_KEY")
    ai_model = os.environ.get("AI_MODEL") or os.environ.get("GROQ_MODEL") or "openai/gpt-oss-120b"
    ai_vision_model = (
        os.environ.get("AI_VISION_MODEL")
        or os.environ.get("GROQ_VISION_MODEL")
        or "qwen/qwen3.8-27b"
    )

    # Groq-specific backwards compatibility
    groq_api_key = os.environ.get("GROQ_API_KEY")
    groq_model = os.environ.get("GROQ_MODEL")
    groq_vision_model = (
        os.environ.get("GROQ_VISION_MODEL")
        or os.environ.get("AI_VISION_MODEL")
        or "qwen/qwen3.8-27b"
    )
    groq_base_url = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

    # File uploads
    upload_temp_dir = os.environ.get("UPLOAD_TEMP_DIR", str(BACKEND_DIR / ".uploads"))

    # Recommendation scoring weights
    weight_overrides = json.loads(os.environ.get("RECOMMENDATION_WEIGHTS") or "{}")

    @property
    def db_configured(self) -> bool:
        return bool(self.mongodb_uri)


settings = Settings()
