from fastapi import APIRouter, HTTPException

from models.request_models import PlanRequest
from models.response_models import PlanResponse

router = APIRouter()


@router.post("/", response_model=PlanResponse)
async def plan_trip(request: PlanRequest):
    """
    Main planning endpoint — converts a natural-language message into a full trip.

    Steps:
    1. Call nlp_service.extract_trip_intent() to parse destination, dates, budget
    2. Call nlp_service.extract_entities() on the raw message for extra context
    3. Call openai_service.generate_itinerary() with extracted params
    4. Call amadeus_service.search_flights() with origin, destination, departure_date
    5. Call amadeus_service.search_hotels() with city code and check-in/check-out
    6. Call discovery_service.aggregate_discovery_data() for community enrichment
    7. Call supabase_service.save_trip() to persist the draft trip
    8. Return structured PlanResponse to the frontend
    """
    # TODO: Implement full planning pipeline
    raise HTTPException(status_code=501, detail="Not implemented yet")
