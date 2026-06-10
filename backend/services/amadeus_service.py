import os
import httpx
from utils.cache import get_cache, set_cache, cache_key

AMADEUS_CLIENT_ID = os.getenv("AMADEUS_CLIENT_ID")
AMADEUS_CLIENT_SECRET = os.getenv("AMADEUS_CLIENT_SECRET")
AMADEUS_ENV = os.getenv("AMADEUS_ENV", "test")

BASE_URL = (
    "https://api.amadeus.com"
    if AMADEUS_ENV == "production"
    else "https://test.api.amadeus.com"
)
AUTH_URL = f"{BASE_URL}/v1/security/oauth2/token"


async def _get_access_token() -> str:
    """
    Fetch and cache an Amadeus OAuth2 bearer token.

    - Check Redis cache for an existing token under key "amadeus:token"
    - If cache miss, POST to AUTH_URL with client_credentials grant type
    - Cache the returned token with (expires_in - 60) seconds TTL
    - Return the bearer token string
    """
    # TODO: Implement OAuth2 client credentials flow with caching
    pass


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
    Search for flight offers via Amadeus Flight Offers Search API.

    - Check cache using cache_key("flights", origin, destination, departure_date)
    - GET /v2/shopping/flight-offers with IATA codes, dates, adults, currencyCode
    - Map each offer to a FlightOffer-compatible dict with: offer_id, airline,
      origin, destination, departure_time, arrival_time, duration, stops, price, currency
    - Cache the result for 15 minutes
    - Return list of flight offer dicts
    """
    # TODO: Implement Amadeus flight search with caching
    pass


async def search_hotels(
    city_code: str,
    check_in: str,
    check_out: str,
    adults: int = 1,
    currency: str = "USD",
    max_results: int = 10,
) -> list:
    """
    Search for hotel offers via Amadeus Hotel Search API.

    - Check cache using cache_key("hotels", city_code, check_in, check_out)
    - GET /v3/shopping/hotel-offers?cityCode=... with dates and guest count
    - Map each offer to a HotelOffer-compatible dict with: offer_id, name, city,
      stars, price_per_night, currency, amenities, coordinates
    - Cache the result for 15 minutes
    - Return list of hotel offer dicts
    """
    # TODO: Implement Amadeus hotel search with caching
    pass


async def book_flight(offer_id: str, traveller_info: dict) -> dict:
    """
    Book a flight via Amadeus Flight Create Orders API.

    - POST /v1/booking/flight-orders with the offer_id and traveller details
    - traveller_info should include name, date_of_birth, passport details
    - Return dict with: booking_ref, pnr, ticket_numbers, airline_contact
    - Raise HTTPException on booking failure with Amadeus error details
    """
    # TODO: Implement flight booking
    pass


async def book_hotel(offer_id: str, guest_info: dict) -> dict:
    """
    Book a hotel via Amadeus Hotel Orders API.

    - POST /v1/booking/hotel-bookings with offer_id and guest details
    - guest_info should include name, email, phone, payment method
    - Return dict with: confirmation_number, hotel_name, check_in, check_out
    - Raise HTTPException on booking failure with Amadeus error details
    """
    # TODO: Implement hotel booking
    pass
