import asyncio
import random
import string

from fastapi import APIRouter

from models.request_models import ConfirmRequest
from services.email_service import send_confirmation_email
from services.supabase_service import supabase
from utils.pdf_generator import generate_receipt

router = APIRouter()


def _booking_reference() -> str:
    chars = string.ascii_uppercase + string.digits
    return "UNM-" + "".join(random.choices(chars, k=8))


@router.post("/")
async def confirm_trip(request: ConfirmRequest):
    booking_reference = _booking_reference()
    trip_id = None

    # Persist to Supabase — failure is non-fatal; booking reference is still returned
    try:
        cities = request.trip_data.get("cities", [])

        if len(cities) == 1:
            destination = cities[0].get("name", "")
        elif len(cities) > 1:
            destination = " → ".join(c.get("name", "") for c in cities)
        else:
            destination = ""

        first_days     = cities[0].get("days", [])  if cities else []
        last_days      = cities[-1].get("days", []) if cities else []
        departure_date = first_days[0].get("date")  if first_days else None
        return_date    = last_days[-1].get("date")   if last_days  else None

        trip_row = {
            "user_id": request.user_id,
            "destination": destination,
            "departure_date": departure_date,
            "return_date": return_date,
            "itinerary": cities,
            "flights": [f.model_dump(exclude_none=True) for f in request.selected_flights],
            "hotels": [h.model_dump(exclude_none=True) for h in request.selected_hotels],
            "status": "confirmed",
        }
        trip_resp = await asyncio.to_thread(
            lambda: supabase.table("trips").insert(trip_row).execute()
        )
        if trip_resp and trip_resp.data:
            trip_id = trip_resp.data[0]["id"]

            booking_row = {
                "trip_id": trip_id,
                "user_id": request.user_id,
                "type": "flight+hotel",
                "details": {
                    "flights": [f.model_dump() for f in request.selected_flights],
                    "hotels": [h.model_dump() for h in request.selected_hotels],
                    "ground_transport": [gt.model_dump() for gt in request.selected_ground_transport],
                },
                "booking_reference": booking_reference,
                "total_cost": request.total_cost,
                "status": "confirmed",
            }
            await asyncio.to_thread(
                lambda: supabase.table("bookings").insert(booking_row).execute()
            )
    except Exception:
        pass

    # Generate PDF receipt — failure is non-fatal
    pdf_bytes = None
    try:
        pdf_bytes = generate_receipt(request, booking_reference)
    except Exception:
        pass

    # Send confirmation email — failure is non-fatal
    email_sent = False
    try:
        if pdf_bytes is not None:
            email_sent = await send_confirmation_email(
                request.passenger_email,
                request.passenger_name,
                booking_reference,
                pdf_bytes,
                selected_flights=request.selected_flights,
                selected_hotels=request.selected_hotels,
                selected_ground_transport=request.selected_ground_transport,
                total_cost=request.total_cost,
            )
    except Exception:
        pass

    return {
        "booking_reference": booking_reference,
        "message": "Booking confirmed",
        "email_sent": email_sent,
        "trip_id": trip_id,
    }
