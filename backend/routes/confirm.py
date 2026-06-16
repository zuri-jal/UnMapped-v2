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
        trip_row = {
            "user_id": request.user_id,
            "destination": request.trip_data.get("destination", "") or "",
            "departure_date": request.trip_data.get("departure_date"),
            "return_date": request.trip_data.get("return_date"),
            "itinerary": request.trip_data.get("days", []),
            "flights": [request.selected_flight.model_dump(exclude_none=True)],
            "hotels": [request.selected_hotel.model_dump(exclude_none=True)],
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
                    "flight": request.selected_flight.model_dump(),
                    "hotel": request.selected_hotel.model_dump(),
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
            )
    except Exception:
        pass

    return {
        "booking_reference": booking_reference,
        "message": "Booking confirmed",
        "email_sent": email_sent,
        "trip_id": trip_id,
    }
