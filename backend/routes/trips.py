import asyncio
import logging

from fastapi import APIRouter, HTTPException

from services.supabase_service import supabase

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def list_trips(user_id: str):
    try:
        resp = await asyncio.to_thread(
            lambda: supabase.table("trips")
            .select("id, destination, departure_date, return_date, status, created_at")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .execute()
        )
        return resp.data or []
    except Exception as exc:
        logger.exception("list_trips failed for user_id=%s", user_id)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{trip_id}")
async def get_trip(trip_id: str, user_id: str):
    try:
        resp = await asyncio.to_thread(
            lambda: supabase.table("trips")
            .select("*")
            .eq("id", trip_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Trip not found")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("get_trip failed for trip_id=%s user_id=%s", trip_id, user_id)
        raise HTTPException(status_code=500, detail=str(exc))
