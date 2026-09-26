"""Bootstrap routine for database initialization on startup."""
import logging
import threading
import time

from app.core.config import settings
from app.db.mongodb import init_indexes, ping_database

logger = logging.getLogger(__name__)

RECOVERY_COOLDOWN_SECONDS = 60
_lock = threading.Lock()
_state = {"running": False, "last_attempt": 0.0}


def _bootstrap() -> None:
    try:
        if not settings.db_configured:
            logger.info("MongoDB Atlas not configured (MONGODB_URI not set); API serving built-in reference data.")
            return

        connected = ping_database(force=True)
        if connected:
            init_indexes()
            logger.info("MongoDB Atlas connected and initialized successfully.")
        else:
            logger.warning("MongoDB Atlas currently unavailable; API serving built-in reference data.")
    except Exception as exc:
        logger.warning("Database bootstrap encountered an error: %s", exc)
    finally:
        _state["running"] = False


def start_database_bootstrap(force: bool = True) -> None:
    """Check MongoDB Atlas connection and initialize collection indexes in background."""
    with _lock:
        now = time.monotonic()
        if _state["running"] or (not force and now - _state["last_attempt"] < RECOVERY_COOLDOWN_SECONDS):
            return
        _state.update(running=True, last_attempt=now)
    threading.Thread(target=_bootstrap, name="mongodb-bootstrap", daemon=True).start()
