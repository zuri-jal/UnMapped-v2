import asyncio
from datetime import timedelta
from fastapi import APIRouter, HTTPException

from models.request_models import TripRequest
from models.response_models import TripResponse
from services.nlp_service import extract_locations, extract_origin
from services.openai_service import generate_itinerary, resolve_country_to_city
from services.duffel_service import search_flights, search_hotels
from services.supabase_service import get_user_profile
from services.discovery_service import get_hidden_gems

router = APIRouter()

COUNTRY_TO_CITY: dict[str, str] = {
    "indonesia": "Bali",
    "japan": "Tokyo",
    "thailand": "Bangkok",
    "india": "Delhi",
    "vietnam": "Ho Chi Minh City",
    "malaysia": "Kuala Lumpur",
    "philippines": "Manila",
    "nepal": "Kathmandu",
    "sri lanka": "Colombo",
    "united arab emirates": "Dubai",
    "uae": "Dubai",
    "turkey": "Istanbul",
    "egypt": "Cairo",
    "australia": "Sydney",
    "new zealand": "Auckland",
    "south africa": "Johannesburg",
    "brazil": "Sao Paulo",
    "mexico": "Mexico City",
    "greece": "Athens",
    "south korea": "Seoul",
}


@router.post("/", response_model=TripResponse)
async def plan_trip(request: TripRequest):
    # Run spaCy once; keep a clean copy for origin detection before destination injection
    nlp_locations = extract_locations(request.user_message)

    # Build locations list for OpenAI (explicit destination inserted at front if needed)
    locations = list(nlp_locations)
    if request.destination and request.destination not in locations:
        locations.insert(0, request.destination)

    destination = request.destination or (locations[-1] if locations else "")
    if destination:
        resolved = COUNTRY_TO_CITY.get(destination.lower())
        if resolved:
            destination = resolved
        else:
            try:
                fallback = await resolve_country_to_city(destination)
                if fallback:
                    destination = fallback
            except Exception:
                pass

    # --- Three-tier origin fallback ---

    # Tier 1: explicit origin field on the request
    origin: str | None = request.origin or None

    # Tier 2: saved home_city from the user's Supabase profile
    if not origin and request.user_id:
        profile = await get_user_profile(request.user_id)
        if profile:
            origin = profile.get("home_city") or None

    # Tier 3: regex "from [city]" pattern first, then spaCy two-location positional fallback
    if not origin:
        origin = extract_origin(request.user_message)

    if not origin:
        raise HTTPException(status_code=400, detail="Please provide your departure city")

    check_in_date = str(request.departure_date)
    check_out_date = str(request.departure_date + timedelta(days=request.duration_days))

    try:
        result, flights, hotels, hidden_gems = await asyncio.gather(
            generate_itinerary(request, locations),
            search_flights(
                origin=origin,
                destination=destination,
                departure_date=check_in_date,
                adults=request.travelers,
            ),
            search_hotels(
                destination=destination,
                check_in_date=check_in_date,
                check_out_date=check_out_date,
                travelers=request.travelers,
                total_budget_usd=request.budget_usd,
                duration_days=request.duration_days,
            ),
            get_hidden_gems(destination),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    result["flights"] = flights
    result["hotels"] = hotels
    result["hidden_gems"] = hidden_gems
    return TripResponse(**result)
