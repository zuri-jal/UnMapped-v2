import os
import base64
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Mail,
    Attachment,
    FileContent,
    FileName,
    FileType,
    Disposition,
)
from utils.pdf_generator import generate_itinerary_pdf

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@unmapped.app")
FROM_NAME = os.getenv("SENDGRID_FROM_NAME", "Unmapped")


async def send_itinerary_email(to_email: str, trip_data: dict) -> bool:
    """
    Generate a PDF itinerary and email it to the user.

    - Call generate_itinerary_pdf(trip_data) to get PDF bytes
    - Base64-encode the PDF bytes for SendGrid attachment
    - Build a SendGrid Mail object with an HTML body (see _itinerary_html_body)
    - Attach the PDF with filename "unmapped-itinerary.pdf"
    - Send via SendGridAPIClient and return True on 202 status
    - Log and return False on SendGrid API error
    """
    # TODO: Implement itinerary email with PDF attachment
    pass


async def send_confirmation_email(to_email: str, booking_refs: dict) -> bool:
    """
    Send a booking confirmation email with flight and hotel references.

    - booking_refs contains: flight_booking_ref, hotel_booking_ref, trip_id
    - Build an HTML email body with the booking references clearly displayed
    - Include links to manage/cancel bookings on the Amadeus portal
    - Send via SendGrid and return True on success
    """
    # TODO: Implement booking confirmation email
    pass


async def send_welcome_email(to_email: str, user_name: str) -> bool:
    """
    Send a welcome email to a newly registered user.

    - Greet the user by name with a warm brand-aligned HTML template
    - Include a CTA button linking to /plan to start their first trip
    - Return True on success
    """
    # TODO: Implement welcome email
    pass


def _itinerary_html_body(trip_data: dict) -> str:
    """
    Build the HTML email body for an itinerary email.

    - Use inline CSS (SendGrid strips external stylesheets)
    - Apply Unmapped brand colours: rose gold #B07050, warm white #FDFAF8
    - Show a summary section: destination, dates, total estimated cost
    - List flight and hotel booking references if present
    - Return raw HTML string
    """
    # TODO: Build branded HTML email template
    return f"<p>Your trip to {trip_data.get('destination', 'your destination')} is ready!</p>"
