import json
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = "gpt-4o"

_SYSTEM_PROMPT = """\
You are Unmapped, an intelligent AI travel assistant. You create detailed, realistic travel itineraries.

Rules:
- NEVER invent or fabricate specific prices. Use realistic estimated ranges expressed as a single average number.
- The budget_breakdown total must equal the sum of flights + accommodation + food + transport + activities.
- Return ONLY a raw JSON object — no markdown, no backticks, no explanation, no preamble.

Required JSON schema (fill every field):
{
  "summary": "<2-3 sentence trip overview>",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "location": "<City, Country>",
      "morning": "<morning activity description>",
      "afternoon": "<afternoon activity description>",
      "evening": "<evening activity description>"
    }
  ],
  "budget_breakdown": {
    "flights": 0,
    "accommodation": 0,
    "food": 0,
    "transport": 0,
    "activities": 0,
    "total": 0
  },
  "discovery_insights": []
}
"""


async def generate_itinerary(request, locations: list[str]) -> dict:
    destination_line = request.destination or (", ".join(locations) if locations else "unspecified")
    user_prompt = (
        f"Plan a trip with these details:\n"
        f"- Destination: {destination_line}\n"
        f"- Detected locations: {', '.join(locations) if locations else 'none'}\n"
        f"- Departure date: {request.departure_date}\n"
        f"- Duration: {request.duration_days} days\n"
        f"- Budget: ${request.budget_usd:.0f} USD total for {request.travelers} traveler(s)\n"
        f"- Travel style: {request.travel_style}\n"
        f"- User message: {request.user_message}\n\n"
        f"Generate a complete {request.duration_days}-day itinerary starting on {request.departure_date}."
    )

    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    for attempt in range(2):
        response = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            if attempt == 1:
                raise RuntimeError(f"OpenAI returned non-JSON after 2 attempts: {raw[:200]}")


async def refine_itinerary(existing_itinerary: dict, user_message: str) -> dict:
    """
    Merge a user's change request into an existing itinerary.

    - Send the existing itinerary as an assistant message in context
    - Send the user's change message as the new user turn
    - Instruct GPT to return only the modified days in the same JSON schema
    - Preserve unchanged days and merge the response into the existing dict
    - Return the full updated itinerary dict
    """
    # TODO: Implement conversational itinerary refinement
    pass


async def rank_destinations(destinations: list, preferences: dict) -> list:
    """
    Rank and enrich a raw list of destination names using GPT.

    - Build a prompt listing all destinations with their source signals
    - Ask GPT to score each destination 0–100 based on preferences
    - Request a 2-sentence narrative description per destination
    - Return the list sorted by score descending, with descriptions added
    """
    # TODO: Implement GPT-powered destination ranking
    pass


async def extract_trip_intent(message: str) -> dict:
    """
    Extract structured trip parameters from a natural-language message.

    - Use GPT function calling with a schema defining: destination, origin,
      departure_date, return_date, budget, currency, travellers, preferences
    - Return the structured intent dict (fields may be None if not mentioned)
    """
    # TODO: Implement intent extraction with function calling
    pass
