from datetime import datetime, date
from typing import Any, Optional


def format_date(date_str: str, fmt: str = "%B %d, %Y") -> str:
    """
    Parse an ISO-8601 date string and reformat it.

    - Parse date_str with datetime.fromisoformat()
    - Return the date formatted with the given strftime format
    - Return the original date_str unchanged if parsing fails
    """
    try:
        return datetime.fromisoformat(date_str).strftime(fmt)
    except (ValueError, TypeError):
        return date_str


def calculate_trip_duration(departure: str, return_date: str) -> int:
    """
    Calculate the number of nights between two ISO date strings.

    - Parse both dates with datetime.fromisoformat()
    - Return (return_date - departure).days
    - Return 0 if either date is invalid or return_date <= departure
    """
    # TODO: Implement duration calculation with error handling
    return 0


def sanitise_string(value: str, max_length: int = 255) -> str:
    """
    Strip and normalise a string for safe storage or display.

    - Strip leading/trailing whitespace
    - Collapse multiple internal whitespace characters to a single space
    - Truncate to max_length characters
    - Return the sanitised string
    """
    import re
    cleaned = re.sub(r"\s+", " ", value.strip())
    return cleaned[:max_length]


def safe_get(data: dict, *keys: str, default: Any = None) -> Any:
    """
    Safely traverse a nested dict with multiple keys.

    - Walk through each key in turn
    - Return default if any key is missing or the value is None
    - Example: safe_get(resp, "data", "offers", "0", "price") → value or None
    """
    current = data
    for key in keys:
        if not isinstance(current, dict):
            return default
        current = current.get(key)
        if current is None:
            return default
    return current


def paginate(items: list, page: int = 1, page_size: int = 20) -> dict:
    """
    Slice a list for the requested page and return pagination metadata.

    - Clamp page to a minimum of 1
    - Calculate start and end slice indices
    - Return: { items, total, page, page_size, has_next, has_prev }
    """
    page = max(1, page)
    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": items[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": end < total,
        "has_prev": page > 1,
    }


def iso_now() -> str:
    """Return the current UTC timestamp as an ISO-8601 string."""
    return datetime.utcnow().isoformat() + "Z"
