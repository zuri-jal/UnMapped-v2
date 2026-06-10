import os
from fastapi import HTTPException
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Service-role client for backend operations (bypasses RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


async def save_trip(user_id: str, trip_data: dict) -> dict:
    """
    Insert a new trip record into the `trips` table.

    - trip_data must include: destination, departure_date, return_date,
      itinerary (JSON blob), flights (JSON array), hotels (JSON array)
    - Set status="draft", user_id=user_id, created_at=now()
    - Return the inserted row (with id and timestamps)
    - Raise HTTPException 500 on insert error
    """
    # TODO: Implement Supabase insert with error handling
    pass


async def get_trip(trip_id: str) -> dict:
    """
    Fetch a single trip by its UUID from the `trips` table.

    - SELECT * FROM trips WHERE id = trip_id AND deleted_at IS NULL
    - Raise HTTPException 404 if no matching record
    - Return the trip dict
    """
    # TODO: Implement Supabase select with 404 handling
    pass


async def update_trip(trip_id: str, updates: dict) -> dict:
    """
    Update specific fields of a trip record.

    - Only update the fields present in the updates dict
    - Set updated_at = now()
    - Return the updated row
    - Raise HTTPException 404 if trip not found
    """
    # TODO: Implement Supabase update
    pass


async def list_user_trips(user_id: str) -> list:
    """
    List all non-deleted trips belonging to a user.

    - SELECT id, destination, departure_date, return_date, status, created_at
      FROM trips WHERE user_id = user_id AND deleted_at IS NULL
      ORDER BY created_at DESC
    - Return list of summary dicts (no full itinerary blobs)
    """
    # TODO: Implement Supabase select with projection
    pass


async def delete_trip(trip_id: str, user_id: str) -> bool:
    """
    Soft-delete a trip by setting deleted_at to now().

    - First verify the trip belongs to user_id (raise 403 if not)
    - UPDATE trips SET deleted_at = now() WHERE id = trip_id
    - Return True on success
    """
    # TODO: Implement soft delete with ownership check
    pass


async def verify_user_token(token: str) -> dict:
    """
    Verify a Supabase JWT access token and return the user payload.

    - Call supabase.auth.get_user(token)
    - Return the user dict on success
    - Raise HTTPException 401 if token is invalid or expired
    """
    # TODO: Implement JWT verification
    pass
