from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class TripRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="Supabase user UUID — used for profile-based origin lookup")
    origin: Optional[str] = Field(None, description="Departure city or IATA code — overrides profile and NLP fallbacks")
    destination: Optional[str] = Field(None, description="Explicit destination — overrides message if set")
    departure_date: date
    duration_days: int = Field(..., ge=1)
    budget_usd: float = Field(..., ge=0)
    travelers: int = Field(1, ge=1)
    travel_style: str
    user_message: str


class PlanRequest(BaseModel):
    user_id: str = Field(..., description="Supabase user UUID")
    message: str = Field(..., description="Natural-language trip planning message")
    origin: Optional[str] = Field(None, description="IATA airport or city code for origin")
    destination: Optional[str] = Field(None, description="IATA code or city name — overrides message if set")
    departure_date: Optional[str] = Field(None, description="ISO-8601 date, e.g. 2025-08-15")
    return_date: Optional[str] = Field(None, description="ISO-8601 date for return flight")
    budget: Optional[float] = Field(None, ge=0, description="Total trip budget in the given currency")
    currency: Optional[str] = Field("USD", description="ISO-4217 currency code")
    travellers: Optional[int] = Field(1, ge=1, le=20)
    preferences: Optional[List[str]] = Field(default_factory=list, description="e.g. ['vegetarian', 'adventure', 'budget']")


class UpdateRequest(BaseModel):
    trip_id: str = Field(..., description="UUID of the trip to update")
    user_id: str
    message: str = Field(..., description="Natural-language change instruction")


class SelectedFlight(BaseModel):
    airline: str
    flight_number: Optional[str] = None
    departure_time: str
    arrival_time: str
    duration: Optional[str] = None
    price_usd: float
    stops: int = 0


class SelectedHotel(BaseModel):
    name: str
    stars: Optional[int] = None
    price_per_night_usd: float
    total_price_usd: float
    location: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    distance_from_airport: Optional[str] = None
    why_recommended: Optional[str] = None


class ConfirmRequest(BaseModel):
    user_id: Optional[str] = None
    trip_data: dict
    selected_flight: SelectedFlight
    selected_hotel: SelectedHotel
    total_cost: float
    passenger_name: str
    passenger_email: str


class DiscoverRequest(BaseModel):
    user_id: Optional[str] = None
    query: Optional[str] = Field(None, description="Free-text query, e.g. 'beach destination in Asia'")
    budget: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = "USD"
    season: Optional[str] = Field(None, description="e.g. 'summer', 'winter', 'spring'")
    region: Optional[str] = Field(None, description="e.g. 'Southeast Asia', 'Europe', 'South America'")
    vibe: Optional[List[str]] = Field(
        default_factory=list,
        description="e.g. ['adventure', 'culture', 'relaxation', 'foodie', 'budget']",
    )
