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
    selected_flights=None,
    selected_hotels=None,
    selected_ground_transport=None,
    total_cost: float = None,
    trip_data: dict = None,
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
            html_content=_confirmation_html_body(
                passenger_name, booking_reference,
                selected_flights=selected_flights,
                selected_hotels=selected_hotels,
                selected_ground_transport=selected_ground_transport,
                total_cost=total_cost,
                trip_data=trip_data,
            ),
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


def _trip_date_range(trip_data: dict) -> tuple:
    """Overall trip start/end date, from the first city's first day to the last city's last day."""
    cities = (trip_data or {}).get("cities", [])
    if not cities:
        return None, None
    first_days = cities[0].get("days", [])
    last_days = cities[-1].get("days", [])
    start = first_days[0].get("date") if first_days else None
    end = last_days[-1].get("date") if last_days else None
    return start, end


def _city_departure_date(trip_data: dict, leg_from: str):
    """The date a traveller leaves `leg_from`, taken from that city's last itinerary day.

    Ground transport legs carry no date of their own (see ground_transport_service),
    so this matches the leg's origin against trip_data["cities"] by name — city names
    and leg_from/leg_to are built from the same source list in routes/plan.py.
    """
    if not trip_data or not leg_from:
        return None
    for city in trip_data.get("cities", []) or []:
        if city.get("name") == leg_from:
            days = city.get("days", [])
            if days:
                return days[-1].get("date")
    return None


def _flight_departure_date(flight, trip_data: dict):
    """Departure date for a flight leg: parsed from its own timestamp when present
    (Duffel offers carry a full ISO datetime), else derived from the origin city's dates."""
    raw = getattr(flight, "departure_time", None)
    if raw:
        for sep in ("T", " "):
            if sep in raw:
                return raw.split(sep)[0]
    return _city_departure_date(trip_data, getattr(flight, "leg_from", None))


def _itinerary_days_html(trip_data: dict) -> str:
    """Full day-by-day itinerary section, grouped by city."""
    cities = (trip_data or {}).get("cities", [])
    if not cities:
        return ""
    city_blocks = ""
    for city in cities:
        day_blocks = ""
        for day in city.get("days", []):
            day_blocks += f"""
            <div style="margin-bottom:14px;">
              <p style="margin:0 0 4px;font-weight:bold;color:#1a1a1a;font-size:13px;">
                Day {day.get('day', '?')} &mdash; {day.get('date', '')}
              </p>
              <p style="margin:0;color:#444;font-size:12px;line-height:1.6;">
                <strong>Morning:</strong> {day.get('morning', '—')}<br>
                <strong>Afternoon:</strong> {day.get('afternoon', '—')}<br>
                <strong>Evening:</strong> {day.get('evening', '—')}
              </p>
            </div>
            """
        city_blocks += f"""
        <div style="margin-bottom:20px;">
          <p style="color:#B07050;font-weight:bold;font-size:14px;margin:0 0 8px;">{city.get('name', '')}</p>
          {day_blocks}
        </div>
        """
    return f"""
    <h3 style="color:#1a1a1a;font-size:14px;margin:24px 0 8px;text-transform:uppercase;
               letter-spacing:1px;">Your Itinerary</h3>
    {city_blocks}
    <hr style="border:none;border-top:1px solid #F5F0EE;margin:24px 0;">
    """


def _confirmation_html_body(
    passenger_name: str,
    booking_reference: str,
    selected_flights=None,
    selected_hotels=None,
    selected_ground_transport=None,
    total_cost: float = None,
    trip_data: dict = None,
) -> str:
    flights_html = _flights_summary_html(selected_flights or [], trip_data)
    gt_html      = _ground_transport_summary_html(selected_ground_transport or [], trip_data)
    hotels_html  = _hotels_summary_html(selected_hotels or [])
    total_html   = (
        f'<p style="color:#B07050;font-size:16px;font-weight:bold;margin:16px 0 0;">'
        f'Grand total: ${total_cost:,.2f} USD</p>'
    ) if total_cost is not None else ""

    trip_section = ""
    if flights_html or gt_html or hotels_html:
        trip_section = f"""
        <h3 style="color:#1a1a1a;font-size:14px;margin:24px 0 8px;text-transform:uppercase;
                   letter-spacing:1px;">Your trip at a glance</h3>
        {flights_html}
        {gt_html}
        {hotels_html}
        {total_html}
        <hr style="border:none;border-top:1px solid #F5F0EE;margin:24px 0;">
        """

    start_date, end_date = _trip_date_range(trip_data)
    dates_html = (
        f'<p style="color:#666;font-size:13px;margin:0 0 20px;">'
        f'<strong>Travel dates:</strong> {start_date or "TBD"} &rarr; {end_date or "TBD"}</p>'
    ) if (start_date or end_date) else ""

    itinerary_html = _itinerary_days_html(trip_data)

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
        {dates_html}
        <div style="background:#F5F0EE;border-left:4px solid #B07050;border-radius:4px;padding:16px 20px;margin:24px 0;">
          <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:6px 0 0;font-size:22px;font-weight:bold;color:#B07050;">{booking_reference}</p>
        </div>
        {trip_section}
        {itinerary_html}
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


_TABLE_STYLE = (
    "width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;"
)
_TH_STYLE = (
    "background:#B07050;color:#fff;padding:6px 10px;text-align:left;"
    "font-size:11px;text-transform:uppercase;letter-spacing:0.5px;"
)
_TD_STYLE = "padding:6px 10px;border-bottom:1px solid #F5F0EE;color:#333;"
_TD_ALT   = "padding:6px 10px;border-bottom:1px solid #F5F0EE;color:#333;background:#FDFAF8;"


def _flights_summary_html(flights: list, trip_data: dict = None) -> str:
    if not flights:
        return ""
    rows = ""
    for i, f in enumerate(flights):
        td = _TD_ALT if i % 2 else _TD_STYLE
        airline  = getattr(f, "airline", "—")
        fn       = getattr(f, "flight_number", None) or "—"
        leg_from = getattr(f, "leg_from", None) or ""
        leg_to   = getattr(f, "leg_to",   None) or ""
        route    = f"{leg_from} → {leg_to}" if (leg_from and leg_to) else "—"
        leg_date = _flight_departure_date(f, trip_data) or "—"
        dep      = getattr(f, "departure_time", "—")
        arr      = getattr(f, "arrival_time",   "—")
        price    = getattr(f, "price_usd", 0)
        rows += (
            f'<tr>'
            f'<td style="{td}">{i + 1}</td>'
            f'<td style="{td}">{route}</td>'
            f'<td style="{td}">{airline}</td>'
            f'<td style="{td}">{fn}</td>'
            f'<td style="{td}">{leg_date}</td>'
            f'<td style="{td}">{dep}</td>'
            f'<td style="{td}">{arr}</td>'
            f'<td style="{td}">${price:,.2f}</td>'
            f'</tr>'
        )
    return (
        f'<p style="color:#666;font-size:12px;font-weight:bold;margin:0 0 4px;">Flights</p>'
        f'<table style="{_TABLE_STYLE}">'
        f'<tr>'
        f'<th style="{_TH_STYLE}">#</th>'
        f'<th style="{_TH_STYLE}">Route</th>'
        f'<th style="{_TH_STYLE}">Airline</th>'
        f'<th style="{_TH_STYLE}">Flight</th>'
        f'<th style="{_TH_STYLE}">Date</th>'
        f'<th style="{_TH_STYLE}">Departs</th>'
        f'<th style="{_TH_STYLE}">Arrives</th>'
        f'<th style="{_TH_STYLE}">Price</th>'
        f'</tr>'
        f'{rows}'
        f'</table>'
    )


def _hotels_summary_html(hotels: list) -> str:
    if not hotels:
        return ""
    rows = ""
    for i, h in enumerate(hotels):
        td    = _TD_ALT if i % 2 else _TD_STYLE
        name  = getattr(h, "name",     "—")
        loc   = getattr(h, "location", "—")
        stars = getattr(h, "stars",    None)
        stars_str = ("★" * stars) if stars else "—"
        total = getattr(h, "total_price_usd", 0)
        rows += (
            f'<tr>'
            f'<td style="{td}">{loc}</td>'
            f'<td style="{td}">{name}</td>'
            f'<td style="{td}">{stars_str}</td>'
            f'<td style="{td}">${total:,.2f}</td>'
            f'</tr>'
        )
    return (
        f'<p style="color:#666;font-size:12px;font-weight:bold;margin:0 0 4px;">Hotels</p>'
        f'<table style="{_TABLE_STYLE}">'
        f'<tr>'
        f'<th style="{_TH_STYLE}">City</th>'
        f'<th style="{_TH_STYLE}">Hotel</th>'
        f'<th style="{_TH_STYLE}">Stars</th>'
        f'<th style="{_TH_STYLE}">Total</th>'
        f'</tr>'
        f'{rows}'
        f'</table>'
    )


def _ground_transport_summary_html(ground_transport: list, trip_data: dict = None) -> str:
    if not ground_transport:
        return ""
    rows = ""
    for i, gt in enumerate(ground_transport):
        td = _TD_ALT if i % 2 else _TD_STYLE
        leg_from = getattr(gt, "leg_from", "—")
        leg_to   = getattr(gt, "leg_to",   "—")
        mode     = getattr(gt, "mode",      "—").title()
        operator = getattr(gt, "operator",  "—")
        leg_date = _city_departure_date(trip_data, getattr(gt, "leg_from", None)) or "—"
        dep      = getattr(gt, "departure_time", "—")
        arr      = getattr(gt, "arrival_time",   "—")
        price    = getattr(gt, "price_usd", 0)
        rows += (
            f"<tr>"
            f'<td style="{td}">{leg_from} → {leg_to}</td>'
            f'<td style="{td}">{mode}</td>'
            f'<td style="{td}">{operator}</td>'
            f'<td style="{td}">{leg_date}</td>'
            f'<td style="{td}">{dep}</td>'
            f'<td style="{td}">{arr}</td>'
            f'<td style="{td}">${price:,.2f}</td>'
            f"</tr>"
        )
    return (
        f'<p style="color:#666;font-size:12px;font-weight:bold;margin:0 0 4px;">Ground Transport</p>'
        f'<table style="{_TABLE_STYLE}">'
        f"<tr>"
        f'<th style="{_TH_STYLE}">Route</th>'
        f'<th style="{_TH_STYLE}">Mode</th>'
        f'<th style="{_TH_STYLE}">Operator</th>'
        f'<th style="{_TH_STYLE}">Date</th>'
        f'<th style="{_TH_STYLE}">Departs</th>'
        f'<th style="{_TH_STYLE}">Arrives</th>'
        f'<th style="{_TH_STYLE}">Price</th>'
        f"</tr>"
        f"{rows}"
        f"</table>"
    )


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
