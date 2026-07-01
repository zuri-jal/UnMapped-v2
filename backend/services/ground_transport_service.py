import asyncio
import json
import os
import sys

import httpx
from dotenv import load_dotenv
from openai import AsyncOpenAI

def _gtlog(msg: str):
    print(msg, flush=True)
    with open(os.path.join(os.path.dirname(__file__), "..", "_gt_debug.log"), "a", encoding="utf-8") as f:
        f.write(msg + "\n")

load_dotenv()

_GMAPS_KEY = os.getenv("GOOGLE_MAPS_KEY")
_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Legs outside these bounds are skipped — too short for scheduled services or too
# long to be competitive with flying (thresholds: 50–800 km, ≤8 h driving).
_MIN_KM = 50
_MAX_KM = 1500
_MAX_DRIVE_HOURS = 20.0


async def get_ground_transport(from_city: str, to_city: str) -> dict | None:
    """
    Return a ground transport dict for a domestic leg, or None if the route
    doesn't qualify or the API calls fail.
    """
    distance_km, driving_hours = await _get_distance(from_city, to_city)
    _gtlog(f"[GT] {from_city} → {to_city}: distance_km={distance_km}, driving_hours={driving_hours}")
    if distance_km is None:
        _gtlog(f"[GT] {from_city} → {to_city}: EXCLUDED — distance_km is None (API failure or no GMAPS key)")
        return None
    if not (_MIN_KM <= distance_km <= _MAX_KM):
        _gtlog(f"[GT] {from_city} → {to_city}: EXCLUDED — {distance_km} km outside [{_MIN_KM}, {_MAX_KM}] km threshold")
        return None
    if driving_hours > _MAX_DRIVE_HOURS:
        _gtlog(f"[GT] {from_city} → {to_city}: EXCLUDED — {driving_hours:.1f}h driving exceeds {_MAX_DRIVE_HOURS}h max")
        return None
    _gtlog(f"[GT] {from_city} → {to_city}: PASSED threshold — generating options")

    options = await _generate_options(from_city, to_city, distance_km, driving_hours)
    if not options:
        return None

    return {
        "leg_from": from_city,
        "leg_to": to_city,
        "distance_km": round(distance_km),
        "driving_duration_hours": round(driving_hours, 1),
        "options": options,
    }


async def _get_distance(from_city: str, to_city: str) -> tuple[float | None, float | None]:
    if not _GMAPS_KEY:
        return None, None
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": from_city,
        "destinations": to_city,
        "mode": "driving",
        "key": _GMAPS_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as http:
            resp = await http.get(url, params=params)
            data = resp.json()
        _gtlog(f"[GT-RAW] {from_city} → {to_city}: HTTP {resp.status_code} | full response = {json.dumps(data)}")
        if data.get("status") != "OK":
            _gtlog(f"[GT-MAPS] {from_city} → {to_city}: top-level status={data.get('status')} — {data.get('error_message', '')}")
            return None, None
        rows = data.get("rows", [])
        if not rows or not rows[0].get("elements"):
            return None, None
        element = rows[0]["elements"][0]
        _gtlog(f"[GT-MAPS] {from_city} → {to_city}: element status={element.get('status')}, element={element}")
        if element.get("status") != "OK":
            return None, None
        return element["distance"]["value"] / 1000, element["duration"]["value"] / 3600
    except Exception as e:
        _gtlog(f"[GT-MAPS] {from_city} → {to_city}: exception — {e}")
        return None, None


async def _generate_options(
    from_city: str, to_city: str, distance_km: float, driving_hours: float
) -> list[dict]:
    prompt = (
        f"Generate 2-3 realistic ground transport options (train or bus) for traveling "
        f"from {from_city} to {to_city}.\n"
        f"Real route data: approximately {distance_km:.0f} km, driving takes about {driving_hours:.1f} hours.\n"
        f"Use this data to produce realistic travel times and prices.\n"
        f"Only include operators that actually or plausibly serve this route.\n"
        f'Return a JSON object with key "options" containing the array:\n'
        f'{{"options": [{{"id": "gt_1", "mode": "train", "operator": "Name", '
        f'"departure_time": "HH:MM", "arrival_time": "HH:MM", '
        f'"duration": "Xh Ym", "price_usd": 25}}, ...]}}'
    )
    try:
        resp = await _client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a ground transport expert. "
                        "Return only valid JSON with an 'options' key."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        raw = json.loads(resp.choices[0].message.content)
        opts = raw.get("options", []) if isinstance(raw, dict) else []
        valid: list[dict] = []
        for i, opt in enumerate(opts[:3]):
            if not isinstance(opt, dict):
                continue
            mode = opt.get("mode", "")
            if mode not in ("train", "bus"):
                continue
            valid.append({
                "id": opt.get("id", f"gt_{i + 1}"),
                "mode": mode,
                "operator": opt.get("operator", "Unknown"),
                "departure_time": opt.get("departure_time", "08:00"),
                "arrival_time": opt.get("arrival_time", "12:00"),
                "duration": opt.get("duration", "—"),
                "price_usd": float(opt.get("price_usd", 0)),
            })
        return valid
    except Exception:
        return []
