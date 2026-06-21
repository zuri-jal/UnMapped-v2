import json
import os
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ---------------------------------------------------------------------------
# Supabase cache (primary — used by discovery_service)
# ---------------------------------------------------------------------------

_supabase_client: Optional[Client] = None


def _get_supabase() -> Optional[Client]:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        if url and key:
            _supabase_client = create_client(url, key)
    return _supabase_client


async def get_cached(destination: str, source: str) -> Optional[dict]:
    try:
        client = _get_supabase()
        if not client:
            return None
        now = datetime.now(timezone.utc).isoformat()
        response = await asyncio.to_thread(
            lambda: client.table("cache")
            .select("results")
            .eq("destination", destination.lower())
            .eq("source", source)
            .gt("expires_at", now)
            .limit(1)
            .execute()
        )
        if response and response.data:
            return response.data[0]["results"]
        return None
    except Exception:
        return None


async def set_cached(destination: str, source: str, results: dict, ttl_hours: int) -> None:
    try:
        client = _get_supabase()
        if not client:
            return
        now = datetime.now(timezone.utc)
        expires_at = (now + timedelta(hours=ttl_hours)).isoformat()
        dest_lower = destination.lower()
        await asyncio.to_thread(
            lambda: client.table("cache")
            .delete()
            .eq("destination", dest_lower)
            .eq("source", source)
            .execute()
        )
        await asyncio.to_thread(
            lambda: client.table("cache")
            .insert({
                "destination": dest_lower,
                "source": source,
                "results": results,
                "timestamp": now.isoformat(),
                "expires_at": expires_at,
            })
            .execute()
        )
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Redis cache (legacy stubs — kept for backward compatibility)
# ---------------------------------------------------------------------------

_redis_client = None


async def _get_client():
    global _redis_client
    return _redis_client


async def get_cache(key: str) -> Optional[Any]:
    client = await _get_client()
    if client is None:
        return None
    return None


async def set_cache(key: str, value: Any, ttl_seconds: int = 3600) -> bool:
    client = await _get_client()
    if client is None:
        return False
    return False


async def delete_cache(key: str) -> bool:
    client = await _get_client()
    if client is None:
        return False
    return False


def cache_key(*parts: str) -> str:
    return ":".join(str(p).lower() for p in parts)
