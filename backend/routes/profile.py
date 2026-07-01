import asyncio

from fastapi import APIRouter

from models.request_models import ProfileUpdate
from services.supabase_service import supabase

router = APIRouter()


@router.get("/")
async def get_profile(user_id: str):
    """Fetch the user's profile row, creating a default one if it doesn't exist."""
    try:
        response = await asyncio.to_thread(
            lambda: supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        if response and response.data:
            return response.data[0]

        # No row yet — insert a minimal default and return it
        insert_response = await asyncio.to_thread(
            lambda: supabase.table("profiles").insert({"id": user_id}).execute()
        )
        if insert_response and insert_response.data:
            return insert_response.data[0]
        return {"id": user_id}
    except Exception as exc:
        return {"id": user_id, "error": str(exc)}


@router.put("/")
async def update_profile(request: ProfileUpdate):
    """Upsert all editable profile fields for the given user."""
    payload = {
        "id": request.user_id,
        "travel_style": request.travel_style,
        "budget_range": request.budget_range,
        "interests": request.interests or [],
        "home_city": request.home_city,
        "currency": request.currency,
        "dietary_restrictions": request.dietary_restrictions or [],
    }
    try:
        response = await asyncio.to_thread(
            lambda: supabase.table("profiles").upsert(payload).execute()
        )
        if response and response.data:
            return response.data[0]
        return {"id": request.user_id}
    except Exception as exc:
        return {"id": request.user_id, "error": str(exc)}
