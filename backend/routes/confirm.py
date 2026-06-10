from fastapi import APIRouter, HTTPException

from models.request_models import ConfirmRequest
from models.response_models import ConfirmResponse

router = APIRouter()


@router.post("/", response_model=ConfirmResponse)
async def confirm_trip(request: ConfirmRequest):
    """
    Confirm endpoint — books the selected flight and hotel, then sends a confirmation email.

    Steps:
    1. Call supabase_service.get_trip(trip_id) to load the finalised trip
    2. Call amadeus_service.book_flight(selected_flight_id, traveller_details)
    3. Call amadeus_service.book_hotel(selected_hotel_id, traveller_details)
    4. Call pdf_generator.generate_itinerary_pdf(trip_data) to create the PDF
    5. Call email_service.send_itinerary_email(user_email, trip_data) with PDF attachment
    6. Call email_service.send_confirmation_email(user_email, booking_refs)
    7. Call supabase_service.update_trip() to mark the trip as confirmed
    8. Return ConfirmResponse with flight_booking_ref, hotel_booking_ref, pdf_url
    """
    # TODO: Implement booking and email pipeline
    raise HTTPException(status_code=501, detail="Not implemented yet")
