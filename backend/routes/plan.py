import asyncio
import re
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException

from models.request_models import TripRequest
from models.response_models import CityItinerary, TripResponse
from services.nlp_service import extract_origin
from services.openai_service import generate_itinerary
from services.duffel_service import search_flights, search_hotels, city_to_iata
from services.supabase_service import get_user_profile, supabase
from services.discovery_service import get_hidden_gems
from services.ground_transport_service import get_ground_transport
from services.google_places_service import get_hotels_from_places
from services.aviation_stack_service import get_route_info
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

    places_hotel_tasks = [
        get_hotels_from_places(
            destination=city_names[i],
            budget_per_night=(request.budget_usd / n) * 0.30 / max(day_counts[i], 1),
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

    print(f"[PLAN-PLACES] About to gather places_hotel_tasks (n={len(places_hotel_tasks)}) for cities={city_names}", flush=True)

    try:
        gathered = await asyncio.gather(
            generate_itinerary(request, city_names, day_counts=itinerary_day_counts),
            *hotel_tasks,
            *places_hotel_tasks,
            *flight_tasks,
            get_hidden_gems(city_names[0]),
            return_exceptions=True,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    itinerary_result = gathered[0]
    if isinstance(itinerary_result, Exception):
        raise HTTPException(status_code=502, detail=str(itinerary_result))

    hotel_results         = gathered[1:1 + n]
    places_hotel_results  = gathered[1 + n:1 + 2 * n]
    print(f"[PLAN-PLACES] places_hotel_results after gather: {places_hotel_results}", flush=True)
    flight_results        = gathered[1 + 2 * n:1 + 3 * n]
    hidden_gems_raw       = gathered[1 + 3 * n]
    hidden_gems           = hidden_gems_raw if not isinstance(hidden_gems_raw, Exception) else []

    # --- Slice itinerary days into per-city blocks ---
    all_days   = itinerary_result.get("days", [])
    day_offset = 0
    city_itineraries: list[CityItinerary] = []

    for i, city in enumerate(city_names):
        city_days  = all_days[day_offset: day_offset + day_counts[i]]
        day_offset += day_counts[i]

        # Overwrite AI-generated date strings with deterministically-computed dates
        for j, day in enumerate(city_days):
            day["date"] = str(city_start_dates[i] + timedelta(days=j))

        hotels_list        = hotel_results[i] if not isinstance(hotel_results[i], Exception) else []
        hotel              = hotels_list[0] if hotels_list else None
        places_hotels_list = places_hotel_results[i] if not isinstance(places_hotel_results[i], Exception) else []

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
            places_hotels=places_hotels_list,
        ))

    # --- Ground transport for qualifying domestic legs (multi-city only) ---
    # Threshold: 50–800 km driving distance AND ≤8 h driving duration (enforced in service).
    ground_transport: list[dict] = []
    if n > 1:
        # Country for the origin: lookup from the city name string
        from_countries = [lookup_country(flight_froms[0])] + [
            city_itineraries[i].country for i in range(n - 1)
        ]
        to_countries = [city_itineraries[i].country for i in range(n)]

        import pathlib
        _log_path = pathlib.Path(__file__).parent.parent / "_gt_debug.log"
        def _plog(msg):
            print(msg, flush=True)
            with open(_log_path, "a", encoding="utf-8") as _f:
                _f.write(msg + "\n")

        _plog("[GT-PLAN] All legs considered for ground transport:")
        for i in range(n):
            same = (from_countries[i] or "").lower() == (to_countries[i] or "").lower()
            _plog(f"  leg {i}: {flight_froms[i]} ({from_countries[i]}) → {flight_tos[i]} ({to_countries[i]}) — same_country={same}")

        gt_inputs = [
            (flight_froms[i], flight_tos[i])
            for i in range(n)
            if from_countries[i]
            and to_countries[i]
            and from_countries[i].lower() == to_countries[i].lower()
        ]
        _plog(f"[GT-PLAN] Domestic legs passed to get_ground_transport: {gt_inputs}")

        if gt_inputs:
            gt_results = await asyncio.gather(
                *[get_ground_transport(fc, tc) for fc, tc in gt_inputs],
                return_exceptions=True,
            )
            _plog(f"[GT-PLAN] Raw gt_results: {gt_results}")
            ground_transport = [
                r for r in gt_results
                if r is not None and not isinstance(r, Exception)
            ]

    import pathlib as _pl
    _lp = _pl.Path(__file__).parent.parent / "_gt_debug.log"
    with open(_lp, "a", encoding="utf-8") as _f:
        _f.write(f"[GT-PLAN] Final ground_transport returned: {ground_transport}\n")
    print(f"[GT-PLAN] Final ground_transport returned: {ground_transport}", flush=True)

    # --- Aviation Stack enrichment: route verification, one call per leg, quota-safe ---
    # Aviation Stack's free tier only tracks real-time/current flights via /v1/flights, so
    # future scheduled flights always returned None there. /v1/routes instead confirms the
    # airline operates the origin→destination route, which works regardless of flight date.
    # Only the first offer on each leg with a real-looking IATA airline code is enriched —
    # Duffel's sandbox/test offers (e.g. "Duffel Airways") are skipped, and legs with no
    # real-airline offer or unresolved IATA codes get no Aviation Stack call at all. Every
    # result is cached (see aviation_stack_service), so the same route is never re-queried.
    _FAKE_AIRLINE_MARKERS = ("duffel airways", "duffel", "test airways")
    _FLIGHT_CODE_RE = re.compile(r"^([A-Z]{2,3})(\d+)$")

    def _first_real_airline_offer(offers: list[dict]):
        for offer in offers:
            name = (offer.get("airline") or "").strip().lower()
            if not name or any(marker in name for marker in _FAKE_AIRLINE_MARKERS):
                continue
            match = _FLIGHT_CODE_RE.match((offer.get("flight_number") or "").strip())
            if not match:
                continue
            airline_iata = match.group(1)
            if airline_iata == "ZZ":  # Duffel's sandbox placeholder carrier code
                continue
            return offer, airline_iata
        return None

    enrichment_targets: list[tuple[dict, str, str, str]] = []
    for i, offers in enumerate(flight_results):
        if isinstance(offers, Exception) or not offers:
            continue
        found = _first_real_airline_offer(offers)
        if not found:
            continue
        offer, airline_iata = found
        origin_iata = city_to_iata(flight_froms[i])
        destination_iata = city_to_iata(flight_tos[i])
        if not origin_iata or not destination_iata:
            continue
        enrichment_targets.append((offer, airline_iata, origin_iata, destination_iata))

    print(f"[PLAN-AVIATION] About to gather aviation_stack route tasks (n={len(enrichment_targets)}): {[(a, o, d) for _, a, o, d in enrichment_targets]}", flush=True)

    aviation_results = (
        await asyncio.gather(
            *[get_route_info(a_iata, o_iata, d_iata) for _, a_iata, o_iata, d_iata in enrichment_targets],
            return_exceptions=True,
        )
        if enrichment_targets
        else []
    )

    print(f"[PLAN-AVIATION] aviation_stack route gather returned: {aviation_results}", flush=True)

    aviation_by_offer_id: dict[int, dict] = {}
    for (offer, _, _, _), result in zip(enrichment_targets, aviation_results):
        if result and not isinstance(result, Exception):
            aviation_by_offer_id[id(offer)] = result

    # --- Flatten flight legs: tag each offer with from/to (+ Aviation Stack data if any) ---
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
            flat_flights.append({
                "from": flight_froms[i],
                "to": flight_tos[i],
                **offer,
                "aviation_stack_data": aviation_by_offer_id.get(id(offer)),
            })

    trip_response = TripResponse(
        summary=itinerary_result.get("summary", ""),
        budget_breakdown=itinerary_result.get("budget_breakdown", {}),
        discovery_insights=itinerary_result.get("discovery_insights", []),
        hidden_gems=hidden_gems,
        cities=city_itineraries,
        flights=flat_flights,
        ground_transport=ground_transport,
        suggested_route_order=None,  # geographic reordering out of scope; null = input order is suggested
    )

    if request.user_id:
        dest    = city_names[0] if len(city_names) == 1 else " → ".join(city_names)
        ret_str = str(city_start_dates[-1] + timedelta(days=day_counts[-1]))

        async def _save_planned(
            uid=request.user_id,
            d=dest,
            dep=str(city_start_dates[0]),
            ret=ret_str,
            itin=[c.model_dump() for c in city_itineraries],
            fl=flat_flights,
            sm=itinerary_result.get("summary", ""),
        ):
            try:
                await asyncio.to_thread(
                    lambda: supabase.table("trips").insert({
                        "user_id": uid,
                        "destination": d,
                        "departure_date": dep,
                        "return_date": ret,
                        "itinerary": {"cities": itin, "summary": sm},
                        "flights": fl,
                        "hotels": [],
                        "status": "planned",
                    }).execute()
                )
            except Exception:
                pass

        asyncio.create_task(_save_planned())

    return trip_response
