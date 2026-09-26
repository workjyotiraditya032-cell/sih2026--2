"""Database connection compatibility module for MongoDB Atlas."""
import logging
from app.db.mongodb import ping_database, init_indexes

logger = logging.getLogger(__name__)


class DatabaseUnavailable(Exception):
    pass


def ping(force: bool = False) -> bool:
    """Check database health."""
    return ping_database(force=force)


def initialize_schema() -> None:
    """Initialize database indexes on startup."""
    init_indexes()
