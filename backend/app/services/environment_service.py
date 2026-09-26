"""Optional Open-Meteo lookup for ambient temperature / relative humidity. Not used for recommendations."""
import logging

import requests

from app.core.config import settings
from app.core.errors import ExternalServiceError, LocationNotFoundError

logger = logging.getLogger(__name__)
TIMEOUT_SECONDS = 6


def fetch_current_conditions(location: str) -> dict:
    if not settings.open_meteo_geocoding_url or not settings.open_meteo_forecast_url:
        raise ExternalServiceError("Weather lookup is not configured. Please enter conditions manually.")
    try:
        geo = requests.get(
            settings.open_meteo_geocoding_url,
            params={"name": location, "count": 1, "language": "en", "format": "json"},
            timeout=TIMEOUT_SECONDS,
        )
        geo.raise_for_status()
        results = geo.json().get("results") or []
        if not results:
            raise LocationNotFoundError(f"Location '{location}' was not found. Try a nearby city name.")
        place = results[0]
        forecast = requests.get(
            settings.open_meteo_forecast_url,
            params={
                "latitude": place["latitude"],
                "longitude": place["longitude"],
                "current": "temperature_2m,relative_humidity_2m",
                "timezone": "auto",
            },
            timeout=TIMEOUT_SECONDS,
        )
        forecast.raise_for_status()
        current = forecast.json()["current"]
    except LocationNotFoundError:
        raise
    except (requests.RequestException, KeyError, ValueError) as exc:
        logger.warning("Open-Meteo lookup failed: %s", exc)
        raise ExternalServiceError("Weather service is currently unavailable. Please enter conditions manually.")

    label = ", ".join(p for p in [place.get("name"), place.get("admin1"), place.get("country")] if p)
    return {
        "location": label,
        "latitude": place["latitude"],
        "longitude": place["longitude"],
        "temperature": current["temperature_2m"],
        "relative_humidity": current["relative_humidity_2m"],
        "observed_at": current.get("time"),
        "source": "Open-Meteo",
    }
