import os
import httpx
from dotenv import load_dotenv
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
    city_code: str,
    check_in: str,
    check_out: str,
    adults: int = 1,
    currency: str = "USD",
    max_results: int = 10,
) -> list:
    """
    Search for hotel offers via the Duffel Stays Search API.

    - Check cache using cache_key("hotels", city_code, check_in, check_out)
    - POST /stays/search with location, check_in_date, check_out_date, and guests
    - Map each result to a HotelOffer-compatible dict with: offer_id, name, city,
      stars, price_per_night, currency, amenities, coordinates
    - Cache the result for 15 minutes
    - Return list of hotel offer dicts
    """
    # TODO: Implement Duffel hotel search with caching
    pass


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
