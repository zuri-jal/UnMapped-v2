from fastapi import APIRouter

from models.request_models import ResolveCitiesRequest
from models.response_models import CityItem, ResolveCitiesResponse
from utils.city_detection import detect_cities, lookup_country

router = APIRouter()


@router.post("/", response_model=ResolveCitiesResponse)
async def resolve_cities(request: ResolveCitiesRequest):
    """
    Lightweight city-resolution endpoint.

    Runs the same Case 1/2/3 detection logic as /plan (single city, multiple cities,
    country-only → OpenAI city selection) without generating an itinerary, fetching
    flights, or looking up hotels.

    Returns the detected city list with per-city day counts, suitable for a
    pre-confirmation UI step before the user commits to a full /plan call.

    country is populated for all cases: Case 3 uses the known country name directly;
    Cases 1/2 use a CITY_TO_COUNTRY reverse lookup; falls back to "" if the city
    isn't in the lookup table.
    """
    city_names, day_counts, country_name = await detect_cities(
        user_message=request.user_message,
        destination=request.destination,
        origin=request.origin,
        duration_days=request.duration_days,
    )

    cities = [
        CityItem(
            name=city_names[i],
            # Case 3: country_name is the known country for all detected cities.
            # Cases 1/2: look up each city individually; fall back to "" if unknown.
            country=country_name or lookup_country(city_names[i]),
            day_count=day_counts[i],
        )
        for i in range(len(city_names))
    ]
    return ResolveCitiesResponse(cities=cities)
