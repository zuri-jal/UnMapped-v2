import re
import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Run once to download: python -m spacy download en_core_web_sm
nlp = spacy.load("en_core_web_sm")
sentiment_analyzer = SentimentIntensityAnalyzer()


def extract_entities(text: str) -> dict:
    """
    Run spaCy NER on the input text to extract structured travel entities.

    - Process text with the loaded spaCy pipeline
    - Extract entity types: GPE (cities/countries), DATE, CARDINAL, MONEY, ORG
    - Group entities by label into a dict: { "GPE": [...], "DATE": [...], ... }
    - Return the grouped entity dict
    """
    doc = nlp(text)
    entities: dict[str, list[str]] = {}
    for ent in doc.ents:
        entities.setdefault(ent.label_, []).append(ent.text)
    # TODO: Post-process GPE to disambiguate cities vs countries
    return entities


def analyse_sentiment(text: str) -> dict:
    """
    Run VADER sentiment analysis on user message text.

    - Call sentiment_analyzer.polarity_scores(text)
    - Return the full scores dict: { neg, neu, pos, compound }
    - compound > 0.05 = positive (excited traveller), < -0.05 = negative (frustrated)
    """
    scores = sentiment_analyzer.polarity_scores(text)
    # TODO: Map compound score to tone label for use in openai_service prompts
    return scores


def parse_budget(text: str) -> dict:
    """
    Extract budget constraints from a natural-language string.

    - Use regex to detect currency symbols ($, £, €) and numeric values
    - Handle shorthand like "2k" → 2000, "1.5k" → 1500
    - Handle ranges like "between $1000 and $2000"
    - Handle upper bounds like "under $3000", "less than £2k"
    - Return: { currency: str, min_amount: float|None, max_amount: float|None }
    """
    # TODO: Implement budget extraction with currency detection and range parsing
    return {"currency": "USD", "min_amount": None, "max_amount": None}


def extract_dates(text: str) -> dict:
    """
    Resolve departure and return dates from natural-language text.

    - Use spaCy DATE entities as candidates
    - Pass candidates through dateparser.parse() for absolute/relative resolution
    - Handle: "next month", "this summer", "December 20th", "for 2 weeks from July 1st"
    - Return: { departure_date: "YYYY-MM-DD"|None, return_date: "YYYY-MM-DD"|None }
    """
    # TODO: Implement date extraction using spaCy + dateparser
    return {"departure_date": None, "return_date": None}


def detect_travel_intent(text: str) -> str:
    """
    Classify a user message into one of the core Unmapped intents.

    Intent labels: "plan" | "update" | "discover" | "confirm" | "unknown"
    - Use keyword pattern matching as primary signal
    - Use entity presence (GPE + DATE = likely plan, no destination = likely discover)
    - Return the matched intent label string
    """
    text_lower = text.lower()
    # TODO: Replace with a more robust classifier
    if any(kw in text_lower for kw in ["book", "confirm", "pay", "reserve"]):
        return "confirm"
    if any(kw in text_lower for kw in ["change", "update", "modify", "instead", "swap"]):
        return "update"
    if any(kw in text_lower for kw in ["inspire", "discover", "suggest", "recommend", "ideas", "where should"]):
        return "discover"
    if any(kw in text_lower for kw in ["plan", "trip", "go to", "travel", "visit", "fly"]):
        return "plan"
    return "unknown"
