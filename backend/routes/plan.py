import asyncio
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException

from models.request_models import TripRequest
from models.response_models import CityItinerary, TripResponse
from services.nlp_service import extract_locations, extract_origin, split_compound_location
from services.openai_service import generate_itinerary, resolve_country_to_city, select_cities_for_country
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

_KNOWN_COUNTRIES = set(COUNTRY_TO_CITY.keys())


def _distribute_days(total_days: int, num_cities: int) -> list[int]:
    base = total_days // num_cities
    remainder = total_days % num_cities
    return [base + (1 if i < remainder else 0) for i in range(num_cities)]


def _extract_country(location_str: str) -> str:
    parts = location_str.split(",", 1)
    return parts[1].strip() if len(parts) > 1 else ""


@router.post("/", response_model=TripResponse)
async def plan_trip(request: TripRequest):
    nlp_locations = extract_locations(request.user_message)

    locations = list(nlp_locations)
    if request.destination and request.destination not in locations:
        locations.insert(0, request.destination)

    # --- Three-tier origin fallback ---
    origin: str | None = request.origin or None
    if not origin and request.user_id:
        profile = await get_user_profile(request.user_id)
        if profile:
            origin = profile.get("home_city") or None
    if not origin:
        origin = extract_origin(request.user_message)
    if not origin:
        raise HTTPException(status_code=400, detail="Please provide your departure city")

    # --- Detect input case and build city list ---
    # Remove origin from destination candidates
    dest_locs = [loc for loc in locations if loc.lower() != origin.lower()]

    country_name: str | None = None
    city_names: list[str] = []

    if request.destination:
        raw = request.destination
        if raw.lower() in _KNOWN_COUNTRIES:
            country_name = raw        # Case 3: explicit country override
        else:
            city_names = split_compound_location(raw)  # split "Bali and Yogyakarta" → ['Bali', 'Yogyakarta']
    elif len(dest_locs) >= 2:
        city_names = dest_locs        # Case 2: multiple NLP-detected cities
    elif len(dest_locs) == 1:
        single = dest_locs[0]
        if single.lower() in _KNOWN_COUNTRIES:
            country_name = single     # Case 3: single country from NLP
        else:
            city_names = [single]     # Case 1: single city from NLP
    else:
        raise HTTPException(status_code=400, detail="Please specify a destination")

    # Case 3: country only — ask OpenAI to select representative cities
    if country_name and not city_names:
        city_names = await select_cities_for_country(country_name, request.duration_days)
        if not city_names:
            # Fallback to single representative city (hardcoded map, then OpenAI resolver)
            single = COUNTRY_TO_CITY.get(country_name.lower())
            if not single:
                single = await resolve_country_to_city(country_name)
            city_names = [single] if single else []
        if not city_names:
            raise HTTPException(status_code=400, detail=f"Could not determine cities for {country_name}")

    if not city_names:
        raise HTTPException(status_code=400, detail="Please specify a destination")

    # --- Distribute days and build per-city date ranges ---
    day_counts = _distribute_days(request.duration_days, len(city_names))

    city_start_dates: list[date] = []
    cur = request.departure_date
    for dc in day_counts:
        city_start_dates.append(cur)
        cur += timedelta(days=dc)

    # --- Build concurrent task lists ---
    n = len(city_names)

    hotel_tasks = [
        search_hotels(
            destination=city_names[i],
            check_in_date=str(city_start_dates[i]),
            check_out_date=str(city_start_dates[i] + timedelta(days=day_counts[i])),
            travelers=request.travelers,
            total_budget_usd=request.budget_usd / n,
            duration_days=day_counts[i],
        )
        for i in range(n)
    ]

    # One leg: origin→city[0], then city[0]→city[1], etc.
    flight_froms = [origin] + city_names[:-1]
    flight_tos = city_names
    flight_dates = [str(request.departure_date)] + [str(d) for d in city_start_dates[1:]]

    flight_tasks = [
        search_flights(
            origin=flight_froms[i],
            destination=flight_tos[i],
            departure_date=flight_dates[i],
            adults=request.travelers,
        )
        for i in range(n)
    ]

    try:
        gathered = await asyncio.gather(
            generate_itinerary(request, city_names),
            *hotel_tasks,
            *flight_tasks,
            get_hidden_gems(city_names[0]),
            return_exceptions=True,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    itinerary_result = gathered[0]
    if isinstance(itinerary_result, Exception):
        raise HTTPException(status_code=502, detail=str(itinerary_result))

    hotel_results = gathered[1:1 + n]
    flight_results = gathered[1 + n:1 + 2 * n]
    hidden_gems_raw = gathered[1 + 2 * n]
    hidden_gems = hidden_gems_raw if not isinstance(hidden_gems_raw, Exception) else []

    # --- Slice itinerary days into per-city blocks ---
    all_days = itinerary_result.get("days", [])
    day_offset = 0
    city_itineraries: list[CityItinerary] = []

    for i, city in enumerate(city_names):
        city_days = all_days[day_offset: day_offset + day_counts[i]]
        day_offset += day_counts[i]

        hotels_list = hotel_results[i] if not isinstance(hotel_results[i], Exception) else []
        hotel = hotels_list[0] if hotels_list else None

        # Infer country: known for Case 3; parse from day location field for Cases 1/2
        if country_name:
            inferred_country = country_name
        elif city_days:
            inferred_country = _extract_country(city_days[0].get("location", ""))
        else:
            inferred_country = ""

        city_itineraries.append(CityItinerary(
            name=city,
            country=inferred_country,
            day_count=day_counts[i],
            order_index=i,
            days=city_days,
            hotel=hotel,
        ))

    # --- Flatten flight legs: tag each offer with from/to ---
    flat_flights: list[dict] = []
    for i, offers in enumerate(flight_results):
        if isinstance(offers, Exception) or not offers:
            flat_flights.append({
                "from": flight_froms[i],
                "to": flight_tos[i],
                "unavailable": True,
            })
            continue
        for offer in offers:
            flat_flights.append({"from": flight_froms[i], "to": flight_tos[i], **offer})

    return TripResponse(
        summary=itinerary_result.get("summary", ""),
        budget_breakdown=itinerary_result.get("budget_breakdown", {}),
        discovery_insights=itinerary_result.get("discovery_insights", []),
        hidden_gems=hidden_gems,
        cities=city_itineraries,
        flights=flat_flights,
        suggested_route_order=None,  # geographic reordering out of scope; null = input order is suggested
    )
