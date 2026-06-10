from fastapi import APIRouter, HTTPException

from models.request_models import TripRequest
from models.response_models import TripResponse
from services.nlp_service import extract_locations
from services.openai_service import generate_itinerary

router = APIRouter()


@router.post("/", response_model=TripResponse)
async def plan_trip(request: TripRequest):
    locations = extract_locations(request.user_message)
    if request.destination and request.destination not in locations:
        locations.insert(0, request.destination)

    try:
        result = await generate_itinerary(request, locations)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return TripResponse(**result)
