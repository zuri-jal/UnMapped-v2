import os
import json
from typing import Any, Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

_redis_client = None


async def _get_client():
    """
    Lazily initialise the Redis client on first use.

    - Import aioredis and connect to REDIS_URL
    - Store the client in the module-level _redis_client variable
    - Return the client instance
    - On connection failure, log a warning and return None (cache is optional)
    """
    global _redis_client
    # TODO: Implement lazy Redis connection with aioredis
    return _redis_client


async def get_cache(key: str) -> Optional[Any]:
    """
    Retrieve a cached value by key.

    - Connect to Redis (or return None if unavailable)
    - GET the key; return None on cache miss
    - Deserialise the JSON string back to a Python object
    - Return None on any connection or parse error
    """
    client = await _get_client()
    if client is None:
        return None
    # TODO: Implement Redis GET with JSON deserialisation
    return None


async def set_cache(key: str, value: Any, ttl_seconds: int = 3600) -> bool:
    """
    Store a value in the cache under the given key with a TTL.

    - Serialise value to a JSON string
    - SET key value EX ttl_seconds
    - Return True on success, False if Redis is unavailable
    """
    client = await _get_client()
    if client is None:
        return False
    # TODO: Implement Redis SET with EX and JSON serialisation
    return False


async def delete_cache(key: str) -> bool:
    """
    Delete a key from the cache.

    - DEL key
    - Return True if the key existed and was removed, False otherwise
    """
    client = await _get_client()
    if client is None:
        return False
    # TODO: Implement Redis DEL
    return False


def cache_key(*parts: str) -> str:
    """
    Build a namespaced cache key from one or more string parts.

    Example: cache_key("flights", "LHR", "JFK", "2025-01-10") → "flights:lhr:jfk:2025-01-10"
    - Join all parts with ":" separator
    - Lowercase the entire key for consistency
    """
    return ":".join(str(p).lower() for p in parts)
