import os
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")


async def generate_itinerary(
    destination: str,
    origin: str,
    days: int,
    preferences: dict,
) -> dict:
    """
    Generate a structured day-by-day itinerary using GPT.

    - Build a system prompt defining the Unmapped travel planner persona
    - Pass destination, origin, duration, budget, and preferences as user context
    - Use response_format={"type": "json_object"} to get a structured JSON response
    - Expected response shape: { days: [{ day_number, date, activities: [...] }] }
    - Return the parsed JSON dict
    """
    # TODO: Implement GPT itinerary generation with function calling
    pass


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
