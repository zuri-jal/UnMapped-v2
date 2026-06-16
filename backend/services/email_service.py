import asyncio
import base64
import os

from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Attachment,
    Disposition,
    FileContent,
    FileName,
    FileType,
    Mail,
)

from utils.pdf_generator import generate_itinerary_pdf

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@unmapped.app")
FROM_NAME = os.getenv("SENDGRID_FROM_NAME", "Unmapped")


async def send_confirmation_email(
    passenger_email: str,
    passenger_name: str,
    booking_reference: str,
    pdf_bytes: bytes,
) -> bool:
    """Send booking confirmation email with PDF receipt attached."""
    print(f"[email_service] to:   {passenger_email}")
    print(f"[email_service] from: {FROM_EMAIL} ({FROM_NAME})")
    print(f"[email_service] SENDGRID_API_KEY set: {bool(SENDGRID_API_KEY)}")
    try:
        if not SENDGRID_API_KEY:
            print("[email_service] ERROR: SENDGRID_API_KEY is not set — aborting")
            return False

        message = Mail(
            from_email=(FROM_EMAIL, FROM_NAME),
            to_emails=passenger_email,
            subject=f"Your Unmapped booking is confirmed - {booking_reference}",
            html_content=_confirmation_html_body(passenger_name, booking_reference),
        )

        encoded = base64.b64encode(pdf_bytes).decode()
        message.attachment = Attachment(
            FileContent(encoded),
            FileName("booking_receipt.pdf"),
            FileType("application/pdf"),
            Disposition("attachment"),
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = await asyncio.to_thread(sg.send, message)
        print(f"[email_service] SendGrid status: {response.status_code}")
        print(f"[email_service] SendGrid body:   {response.body}")
        return response.status_code in (200, 202)
    except Exception as e:
        print(f"[email_service] EXCEPTION: {type(e).__name__}: {e}")
        return False


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


async def send_welcome_email(to_email: str, user_name: str) -> bool:
    """
    Send a welcome email to a newly registered user.

    - Greet the user by name with a warm brand-aligned HTML template
    - Include a CTA button linking to /plan to start their first trip
    - Return True on success
    """
    # TODO: Implement welcome email
    pass


def _confirmation_html_body(passenger_name: str, booking_reference: str) -> str:
    return f"""
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FDFAF8;">
      <div style="background:#B07050;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:2px;">Unmapped</h1>
        <p style="color:#fff;margin:8px 0 0;opacity:0.9;font-size:14px;">Your booking is confirmed</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#1a1a1a;margin-top:0;">Hi {passenger_name},</h2>
        <p style="color:#444;line-height:1.6;">
          Great news &mdash; your trip has been confirmed! Your full booking receipt is
          attached to this email as a PDF. Please save it for your records.
        </p>
        <div style="background:#F5F0EE;border-left:4px solid #B07050;border-radius:4px;padding:16px 20px;margin:24px 0;">
          <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:6px 0 0;font-size:22px;font-weight:bold;color:#B07050;">{booking_reference}</p>
        </div>
        <p style="color:#444;line-height:1.6;">
          Your receipt is attached as <strong>booking_receipt.pdf</strong> and includes
          your complete flight and hotel details.
        </p>
        <p style="color:#B07050;font-weight:bold;font-size:16px;">Have a wonderful trip!</p>
        <hr style="border:none;border-top:1px solid #F5F0EE;margin:32px 0 16px;">
        <p style="color:#aaa;font-size:11px;margin:0;">
          This email was sent by Unmapped. If you did not make this booking, please contact us immediately.
        </p>
      </div>
    </div>
    """


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
