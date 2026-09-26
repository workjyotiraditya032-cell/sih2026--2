"""MongoDB Atlas connection and database manager for PackIntel.

Manages connection pooling, health checks, GridFS storage, and indexes.
"""
import logging
import os
import time
from typing import Optional
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.collection import Collection
import gridfs

logger = logging.getLogger(__name__)

# Connection state tracking
_client: Optional[MongoClient] = None
_db: Optional[Database] = None
_fs: Optional[gridfs.GridFS] = None
_last_ping_time: float = 0.0
_last_ping_result: bool = False
PING_CACHE_SECONDS = 5.0


def get_mongodb_uri() -> str:
    """Read MongoDB connection string from environment variables."""
    return os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URL") or ""


def get_db_name() -> str:
    """Read MongoDB database name from environment variables."""
    return os.environ.get("MONGODB_DB_NAME") or os.environ.get("DB_NAME") or "packintel"


def get_client() -> MongoClient:
    """Get or create singleton MongoClient with connection pooling and timeouts."""
    global _client
    if _client is not None:
        return _client

    uri = get_mongodb_uri()
    if not uri:
        raise ConnectionError("MONGODB_URI environment variable is not configured.")

    # Configure connection pool and fail-fast timeouts
    _client = MongoClient(
        uri,
        serverSelectionTimeoutMS=4000,
        connectTimeoutMS=4000,
        socketTimeoutMS=10000,
        maxPoolSize=50,
        minPoolSize=5,
        retryWrites=True,
    )
    return _client


def get_database() -> Database:
    """Get MongoDB database handle."""
    global _db
    if _db is not None:
        return _db
    client = get_client()
    db_name = get_db_name()
    _db = client[db_name]
    return _db


def get_collection(name: str) -> Collection:
    """Get a specific collection handle."""
    return get_database()[name]


def get_gridfs() -> gridfs.GridFS:
    """Get GridFS instance for binary file storage (images, documents)."""
    global _fs
    if _fs is None:
        _fs = gridfs.GridFS(get_database())
    return _fs


def ping_database(force: bool = False) -> bool:
    """Check whether MongoDB Atlas is reachable and responsive."""
    global _last_ping_time, _last_ping_result
    now = time.monotonic()
    if not force and (now - _last_ping_time) < PING_CACHE_SECONDS:
        return _last_ping_result

    uri = get_mongodb_uri()
    if not uri:
        _last_ping_result = False
        _last_ping_time = now
        return False

    try:
        client = get_client()
        # The 'ping' command is cheap and does not require auth permissions on specific collections
        client.admin.command("ping")
        _last_ping_result = True
    except Exception as exc:
        logger.warning("MongoDB ping failed: %s", exc)
        _last_ping_result = False
    _last_ping_time = now
    return _last_ping_result


def init_indexes() -> None:
    """Ensure required indexes on MongoDB collections."""
    try:
        db = get_database()
        # packaging_materials indexes
        db.packaging_materials.create_index([("id", ASCENDING)], unique=True, sparse=True)
        db.packaging_materials.create_index([("material_name", ASCENDING)], unique=True)
        db.packaging_materials.create_index([("material_category", ASCENDING)])
        db.packaging_materials.create_index([("suitable_food_categories", ASCENDING)])

        # food_commodities indexes
        db.food_commodities.create_index([("id", ASCENDING)], unique=True, sparse=True)
        db.food_commodities.create_index([("commodity_name", ASCENDING)], unique=True)
        db.food_commodities.create_index([("category", ASCENDING)])

        # food_profiles index
        db.food_profiles.create_index([("food_name", ASCENDING)], unique=True)

        # recommendations and prediction_history indexes
        db.recommendations.create_index([("id", DESCENDING)], unique=True, sparse=True)
        db.recommendations.create_index([("created_at", DESCENDING)])
        db.recommendations.create_index([("commodity", ASCENDING)])

        db.prediction_history.create_index([("id", DESCENDING)], unique=True, sparse=True)
        db.prediction_history.create_index([("created_at", DESCENDING)])
        db.prediction_history.create_index([("commodity", ASCENDING)])

        # food_images index
        db.food_images.create_index([("id", ASCENDING)], unique=True)

        logger.info("MongoDB Atlas indexes initialized successfully.")
    except Exception as exc:
        logger.warning("Could not initialize MongoDB indexes (DB may be offline): %s", exc)


def close_connections() -> None:
    """Close MongoDB connection pool on shutdown."""
    global _client, _db, _fs
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        _fs = None
        logger.info("MongoDB connection pool closed.")
