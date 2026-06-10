import os
import httpx
from dotenv import load_dotenv
from utils.cache import get_cache, set_cache, cache_key

load_dotenv()

DUFFEL_API_KEY = os.getenv("DUFFEL_API_KEY")

BASE_URL = "https://api.duffel.com"
DUFFEL_VERSION = "v2"

_HEADERS = {
    "Authorization": f"Bearer {DUFFEL_API_KEY}",
    "Duffel-Version": DUFFEL_VERSION,
    "Content-Type": "application/json",
    "Accept": "application/json",
}


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

    - Check cache using cache_key("flights", origin, destination, departure_date)
    - POST /air/offer_requests with slices (origin, destination, departure_date),
      passengers list, and cabin_class
    - Map each offer to a FlightOffer-compatible dict with: offer_id, airline,
      origin, destination, departure_time, arrival_time, duration, stops, price, currency
    - Cache the result for 15 minutes
    - Return list of flight offer dicts
    """
    # TODO: Implement Duffel flight search with caching
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
