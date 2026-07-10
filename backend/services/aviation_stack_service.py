import os
import httpx
from dotenv import load_dotenv

from utils.cache import get_cached, set_cached

load_dotenv()

AVIATION_STACK_KEY = os.getenv("AVIATION_STACK_KEY")
ROUTES_URL = "http://api.aviationstack.com/v1/routes"


async def get_route_info(airline_iata: str, origin_iata: str, destination_iata: str) -> dict | None:
    """
    Verify an airline operates a given route via Aviation Stack's /v1/routes endpoint.

    Route data works regardless of flight date — unlike /v1/flights (real-time
    tracking only), which returns nothing for future scheduled flights on the
    free tier. Every result (including "not found") is cached under
    source="aviation_stack_route" with a 24h TTL, keyed by
    airline_iata+origin_iata+destination_iata, so the same route is never
    queried against the API twice — this protects the 100/month free quota.
    Returns None on a missing API key, missing identifiers, any request error,
    or no match — never raises.
    """
    print(f"[AVIATION-STACK] get_route_info called for airline_iata={airline_iata!r} origin_iata={origin_iata!r} destination_iata={destination_iata!r}", flush=True)

    if not AVIATION_STACK_KEY or not airline_iata or not origin_iata or not destination_iata:
        return None

    cache_key = f"{airline_iata}{origin_iata}{destination_iata}".upper()
    cached = await get_cached(cache_key, "aviation_stack_route")
    if cached is not None:
        return cached.get("route_info")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                ROUTES_URL,
                params={
                    "access_key": AVIATION_STACK_KEY,
                    "airline_iata": airline_iata,
                    "dep_iata": origin_iata,
                    "arr_iata": destination_iata,
                },
            )
            data = response.json()
            routes = data.get("data", [])
            print(f"[AVIATION-STACK] routes response status_code={response.status_code} result_count={len(routes)}", flush=True)

            if not routes:
                await set_cached(cache_key, "aviation_stack_route", {"route_info": None}, ttl_hours=24)
                return None

            r = routes[0]
            airline = r.get("airline") or {}

            route_info = {
                "verified": True,
                "airline_name": airline.get("name"),
                "airline_iata": airline.get("iata", airline_iata),
                "route_operated": True,
            }
            await set_cached(cache_key, "aviation_stack_route", {"route_info": route_info}, ttl_hours=24)
            return route_info

    except Exception as exc:
        print(f"[AVIATION-STACK] Exception in get_route_info({airline_iata!r}, {origin_iata!r}, {destination_iata!r}): {exc}", flush=True)
        return None
