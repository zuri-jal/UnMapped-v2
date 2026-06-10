from fastapi import APIRouter, HTTPException

from models.request_models import UpdateRequest
from models.response_models import UpdateResponse

router = APIRouter()


@router.post("/", response_model=UpdateResponse)
async def update_trip(request: UpdateRequest):
    """
    Update endpoint — applies a natural-language change to an existing trip.

    Steps:
    1. Call supabase_service.get_trip(trip_id) to load the current trip
    2. Call nlp_service.detect_travel_intent() to classify the change type
    3. Call nlp_service.extract_entities() to find new dates, destinations, etc.
    4. Call openai_service.refine_itinerary() with current itinerary + change message
    5. If dates changed, re-call duffel_service.search_flights() and search_hotels()
    6. Call supabase_service.update_trip() to persist the updated record
    7. Return UpdateResponse with modified days, flights, hotels
    """
    # TODO: Implement update pipeline
    raise HTTPException(status_code=501, detail="Not implemented yet")
