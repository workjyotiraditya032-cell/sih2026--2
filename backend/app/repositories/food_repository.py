"""Repository for food intelligence knowledge-base profiles stored in MongoDB."""
import logging
from typing import Optional
from app.db.mongodb import get_collection, ping_database
from app.database.food_knowledge import ALIASES, PROFILES
from app.schemas.food import FoodProfile

logger = logging.getLogger(__name__)


def fetch_food_profile(name: str) -> Optional[FoodProfile]:
    """Look up a normalized food profile by name or alias."""
    canonical = ALIASES.get(" ".join(name.casefold().split()))
    if not canonical:
        return None

    if ping_database():
        try:
            col = get_collection("food_profiles")
            doc = col.find_one({"food_name": canonical})
            if doc and "profile" in doc:
                return FoodProfile.model_validate(doc["profile"])
        except Exception as exc:
            logger.warning("MongoDB fetch_food_profile failed: %s", exc)

    # Fallback to in-memory dictionary
    profile = PROFILES.get(canonical)
    return profile.model_copy(deep=True) if profile else None
