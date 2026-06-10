import os
import json
import httpx
from dotenv import load_dotenv
from openai import AsyncOpenAI
from utils.cache import get_cache, set_cache, cache_key

load_dotenv()

BASE_URL = "https://api.duffel.com"
DUFFEL_VERSION = "v2"

# Shared headers for functions that still use them (book_flight, book_hotel)
_HEADERS = {
    "Authorization": f"Bearer {os.getenv('DUFFEL_API_KEY')}",
    "Duffel-Version": DUFFEL_VERSION,
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# Top 50+ travel destinations: lowercase city name → IATA airport code
_CITY_TO_IATA: dict[str, str] = {
    "london": "LHR",
    "paris": "CDG",
    "new york": "JFK",
    "new york city": "JFK",
    "los angeles": "LAX",
    "chicago": "ORD",
    "miami": "MIA",
    "san francisco": "SFO",
    "seattle": "SEA",
    "boston": "BOS",
    "dallas": "DFW",
    "houston": "IAH",
    "atlanta": "ATL",
    "denver": "DEN",
    "orlando": "MCO",
    "phoenix": "PHX",
    "toronto": "YYZ",
    "vancouver": "YVR",
    "montreal": "YUL",
    "cancun": "CUN",
    "mexico city": "MEX",
    "tokyo": "NRT",
    "osaka": "KIX",
    "seoul": "ICN",
    "beijing": "PEK",
    "shanghai": "PVG",
    "hong kong": "HKG",
    "taipei": "TPE",
    "singapore": "SIN",
    "bangkok": "BKK",
    "bali": "DPS",
    "kuala lumpur": "KUL",
    "jakarta": "CGK",
    "manila": "MNL",
    "ho chi minh city": "SGN",
    "hanoi": "HAN",
    "phuket": "HKT",
    "colombo": "CMB",
    "kathmandu": "KTM",
    "delhi": "DEL",
    "mumbai": "BOM",
    "dubai": "DXB",
    "abu dhabi": "AUH",
    "doha": "DOH",
    "riyadh": "RUH",
    "istanbul": "IST",
    "cairo": "CAI",
    "tel aviv": "TLV",
    "amsterdam": "AMS",
    "frankfurt": "FRA",
    "rome": "FCO",
    "milan": "MXP",
    "barcelona": "BCN",
    "madrid": "MAD",
    "lisbon": "LIS",
    "athens": "ATH",
    "vienna": "VIE",
    "zurich": "ZRH",
    "brussels": "BRU",
    "stockholm": "ARN",
    "oslo": "OSL",
    "copenhagen": "CPH",
    "helsinki": "HEL",
    "edinburgh": "EDI",
    "dublin": "DUB",
    "reykjavik": "KEF",
    "warsaw": "WAW",
    "prague": "PRG",
    "budapest": "BUD",
    "munich": "MUC",
    "sydney": "SYD",
    "melbourne": "MEL",
    "brisbane": "BNE",
    "auckland": "AKL",
    "johannesburg": "JNB",
    "cape town": "CPT",
    "nairobi": "NBO",
    "casablanca": "CMN",
    "accra": "ACC",
    "lagos": "LOS",
    "dar es salaam": "DAR",
    "sao paulo": "GRU",
    "rio de janeiro": "GIG",
    "buenos aires": "EZE",
    "lima": "LIM",
    "bogota": "BOG",
    "santiago": "SCL",
}


def city_to_iata(name: str) -> str | None:
    """Return IATA code for a city name, or pass through a 3-letter IATA code unchanged."""
    if not name:
        return None
    cleaned = name.strip().lower()
    if len(cleaned) == 3 and cleaned.isalpha():
        return cleaned.upper()
    return _CITY_TO_IATA.get(cleaned)


async def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    adults: int = 1,
    return_date: str | None = None,
    currency: str = "USD",
    max_results: int = 10,
) -> list:
    """
    Search for flight offers via the Duffel Offer Requests API.

    - Resolve city names to IATA codes via city_to_iata(); return [] if either is unknown
    - Check cache using cache_key("flights", origin_code, destination_code, departure_date)
    - POST /air/offer_requests with slices, passengers, and cabin_class="economy"
    - Map top 3 offers to dicts: airline, flight_number, departure_time, arrival_time,
      duration, price_usd, stops
    - Cache results for 15 minutes
    - Returns [] on any API error or missing results — never raises
    """
    origin_code = city_to_iata(origin)
    destination_code = city_to_iata(destination)
    if not origin_code or not destination_code:
        return []

    key = cache_key("flights", origin_code, destination_code, departure_date)
    cached = await get_cache(key)
    if cached is not None:
        return cached

    body = {
        "data": {
            "slices": [
                {
                    "origin": origin_code,
                    "destination": destination_code,
                    "departure_date": departure_date,
                }
            ],
            "passengers": [{"type": "adult"} for _ in range(max(adults, 1))],
            "cabin_class": "economy",
        }
    }

    headers = {
        "Authorization": f"Bearer {os.getenv('DUFFEL_API_KEY')}",
        "Duffel-Version": DUFFEL_VERSION,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/air/offer_requests",
                json=body,
                headers=headers,
                params={"return_offers": "true"},
            )

        if response.status_code not in (200, 201):
            return []

        offers = response.json().get("data", {}).get("offers", [])
        results = []
        for offer in offers:
            try:
                slice_ = offer["slices"][0]
                segments = slice_["segments"]
                first_seg = segments[0]
                last_seg = segments[-1]
                carrier_code = first_seg.get("marketing_carrier", {}).get("iata_code", "")
                flight_num = first_seg.get("marketing_carrier_flight_number", "")
                results.append(
                    {
                        "airline": offer.get("owner", {}).get("name", "Unknown Airline"),
                        "flight_number": f"{carrier_code}{flight_num}".strip(),
                        "departure_time": first_seg.get("departing_at", ""),
                        "arrival_time": last_seg.get("arriving_at", ""),
                        "duration": slice_.get("duration", ""),
                        "price_usd": float(offer.get("total_amount", 0)),
                        "stops": len(segments) - 1,
                    }
                )
            except (KeyError, IndexError, ValueError):
                continue

        top3 = results[:3]
        await set_cache(key, top3, ttl_seconds=900)
        return top3

    except Exception:
        return []


async def search_hotels(
    destination: str,
    check_in_date: str,
    check_out_date: str,
    travelers: int = 1,
    total_budget_usd: float = 1000.0,
    duration_days: int = 7,
) -> list:
    nightly_cap = round((total_budget_usd * 0.30) / max(duration_days, 1), 2)

    key = cache_key("hotels", destination.lower(), check_in_date, check_out_date)
    cached = await get_cache(key)
    if cached is not None:
        return cached

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return []

    prompt = (
        f"You are a travel expert. Recommend exactly 3 real, named hotels that actually exist in {destination}. "
        f"All hotels must be within 30 minutes of the main airport serving {destination}. "
        f"All prices must be at most ${nightly_cap:.2f} per night. "
        f"Include one budget option, one mid-range option, and one best-value option within this cap.\n\n"
        f"Check-in: {check_in_date}\n"
        f"Check-out: {check_out_date}\n"
        f"Travelers: {travelers}\n\n"
        f"Return a raw JSON array with exactly 3 objects. No markdown, no backticks, no explanation — only the JSON array.\n"
        f"Each object must have exactly these fields:\n"
        f'  "name": string,\n'
        f'  "stars": integer 1-5,\n'
        f'  "price_per_night_usd": number,\n'
        f'  "total_price_usd": number,\n'
        f'  "location": string (neighborhood or district in {destination}),\n'
        f'  "check_in": "{check_in_date}",\n'
        f'  "check_out": "{check_out_date}",\n'
        f'  "distance_from_airport": string (e.g. "20 minutes by taxi"),\n'
        f'  "why_recommended": string (one sentence)\n'
    )

    client = AsyncOpenAI(api_key=api_key)

    for attempt in range(2):
        try:
            completion = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            raw = completion.choices[0].message.content.strip()
            hotels = json.loads(raw)
            if isinstance(hotels, list):
                top3 = hotels[:3]
                await set_cache(key, top3, ttl_seconds=900)
                return top3
        except json.JSONDecodeError:
            if attempt == 1:
                return []
            continue
        except Exception:
            return []

    return []


async def book_flight(offer_id: str, traveller_info: dict) -> dict:
    """
    Book a flight via the Duffel Orders API.

    - POST /air/orders with the offer_id and passenger details
    - traveller_info should include name, date_of_birth, passport details
    - Return dict with: booking_ref, pnr, ticket_numbers, airline_contact
    - Raise HTTPException on booking failure with Duffel error details
    """
    # TODO: Implement flight booking
    pass


async def book_hotel(offer_id: str, guest_info: dict) -> dict:
    """
    Book a hotel via the Duffel Stays Orders API.

    - POST /stays/orders with offer_id and guest details
    - guest_info should include name, email, phone, payment method
    - Return dict with: confirmation_number, hotel_name, check_in, check_out
    - Raise HTTPException on booking failure with Duffel error details
    """
    # TODO: Implement hotel booking
    pass
