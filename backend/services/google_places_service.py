import os
import httpx
from dotenv import load_dotenv

from utils.cache import get_cached, set_cached

load_dotenv()

GOOGLE_PLACES_KEY = os.getenv("GOOGLE_PLACES_KEY")
TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

_PRICE_LEVEL_LABELS = {0: "$", 1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}


def _budget_to_price_level(budget_per_night: float | None) -> int | None:
    """Rough mapping of a nightly USD budget to Google's 0-4 price_level scale."""
    if budget_per_night is None:
        return None
    if budget_per_night < 75:
        return 1
    if budget_per_night < 150:
        return 2
    if budget_per_night < 300:
        return 3
    return 4


async def get_hotels_from_places(destination: str, budget_per_night: float | None = None) -> list[dict]:
    """
    Fetch up to 5 verified hotels for a destination via Google Places.
    Cached in Supabase (source="google_places", 24h TTL) — checked before any API call.
    Returns [] on a missing API key, any request error, or no results — never raises.
    """
    print(f"[GOOGLE-PLACES] get_hotels_from_places called for destination={destination!r}", flush=True)

    if not GOOGLE_PLACES_KEY or not destination:
        return []

    cached = await get_cached(destination, "google_places")
    if cached is not None:
        return cached.get("hotels", [])

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            search_params = {
                "query": f"hotels in {destination}",
                "type": "lodging",
                "key": GOOGLE_PLACES_KEY,
            }
            max_price = _budget_to_price_level(budget_per_night)
            if max_price is not None:
                search_params["maxprice"] = max_price

            search_resp = await client.get(TEXT_SEARCH_URL, params=search_params)
            search_data = search_resp.json()
            print(f"[GOOGLE-PLACES] Text Search status={search_data.get('status')!r} results_count={len(search_data.get('results', []))}", flush=True)
            if search_data.get("status") != "OK":
                return []

            hotels: list[dict] = []
            for place in search_data.get("results", [])[:5]:
                place_id = place.get("place_id")
                details = {}
                if place_id:
                    try:
                        details_resp = await client.get(
                            DETAILS_URL,
                            params={
                                "place_id": place_id,
                                "fields": "price_level,rating,user_ratings_total,formatted_address,website",
                                "key": GOOGLE_PLACES_KEY,
                            },
                        )
                        details_data = details_resp.json()
                        if details_data.get("status") == "OK":
                            details = details_data.get("result", {})
                    except Exception:
                        details = {}

                price_level = details.get("price_level", place.get("price_level"))

                hotels.append({
                    "name": place.get("name", "Unknown Hotel"),
                    "rating": details.get("rating", place.get("rating")),
                    "user_ratings_total": details.get("user_ratings_total", place.get("user_ratings_total")),
                    "price_level": _PRICE_LEVEL_LABELS.get(price_level),
                    "address": details.get("formatted_address", place.get("formatted_address")),
                    "website": details.get("website"),
                    "place_id": place_id,
                    "source": "Google Places",
                })

        await set_cached(destination, "google_places", {"hotels": hotels}, ttl_hours=24)
        return hotels

    except Exception as exc:
        print(f"[GOOGLE-PLACES] Exception in get_hotels_from_places({destination!r}): {exc}", flush=True)
        return []
