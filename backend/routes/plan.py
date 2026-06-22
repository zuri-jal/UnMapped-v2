import asyncio
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException

from models.request_models import TripRequest
from models.response_models import CityItinerary, TripResponse
from services.nlp_service import extract_origin
from services.openai_service import generate_itinerary
from services.duffel_service import search_flights, search_hotels
from services.supabase_service import get_user_profile
from services.discovery_service import get_hidden_gems
from utils.city_detection import detect_cities, distribute_days, extract_country, lookup_country

router = APIRouter()


@router.post("/", response_model=TripResponse)
async def plan_trip(request: TripRequest):
    # --- Three-tier origin fallback (unchanged) ---
    origin: str | None = request.origin or None
    if not origin and request.user_id:
        profile = await get_user_profile(request.user_id)
        if profile:
            origin = profile.get("home_city") or None
    if not origin:
        origin = extract_origin(request.user_message)
    if not origin:
        raise HTTPException(status_code=400, detail="Please provide your departure city")

    # --- City resolution: use pre-confirmed list or run Case 1/2/3 detection ---
    if request.confirmed_cities:
        # Pre-confirmed / edit-and-regenerate path: skip all NLP/OpenAI detection.
        # Works identically whether this is the first generation or a re-generation
        # after the user has edited cities — no special-casing between the two cases.
        city_names   = [c.name for c in request.confirmed_cities]
        day_counts   = [c.day_count for c in request.confirmed_cities]
        country_name = None   # inferred per-city from itinerary output below
    else:
        # Standard NLP path: Case 1/2/3 detection (unchanged behaviour)
        city_names, day_counts, country_name = await detect_cities(
            user_message=request.user_message,
            destination=request.destination,
            origin=origin,
            duration_days=request.duration_days,
        )

    # --- Distribute days and build per-city date ranges ---
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
    flight_tos   = city_names
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

    # Pass explicit day_counts when confirmed_cities is set so generate_itinerary
    # respects them exactly instead of redistributing via duration_days // n.
    # When confirmed_cities is absent, day_counts=None triggers the auto-distribution.
    itinerary_day_counts = day_counts if request.confirmed_cities else None

    try:
        gathered = await asyncio.gather(
            generate_itinerary(request, city_names, day_counts=itinerary_day_counts),
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

    hotel_results      = gathered[1:1 + n]
    flight_results     = gathered[1 + n:1 + 2 * n]
    hidden_gems_raw    = gathered[1 + 2 * n]
    hidden_gems        = hidden_gems_raw if not isinstance(hidden_gems_raw, Exception) else []

    # --- Slice itinerary days into per-city blocks ---
    all_days   = itinerary_result.get("days", [])
    day_offset = 0
    city_itineraries: list[CityItinerary] = []

    for i, city in enumerate(city_names):
        city_days  = all_days[day_offset: day_offset + day_counts[i]]
        day_offset += day_counts[i]

        hotels_list = hotel_results[i] if not isinstance(hotel_results[i], Exception) else []
        hotel       = hotels_list[0] if hotels_list else None

        # Infer country: known for Case 3; parse from itinerary output for Cases 1/2,
        # with CITY_TO_COUNTRY as a fallback if the itinerary text doesn't carry it.
        if country_name:
            inferred_country = country_name
        elif city_days:
            inferred_country = extract_country(city_days[0].get("location", "")) or lookup_country(city)
        else:
            inferred_country = lookup_country(city)

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
                "to":   flight_tos[i],
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
