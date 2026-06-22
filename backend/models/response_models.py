from pydantic import BaseModel
from typing import Any, Optional, List


class HiddenGem(BaseModel):
    name: str
    type: str
    description: str
    source: str
    source_quote: Optional[str] = None


class TrendingDestination(BaseModel):
    destination: str
    country: str
    score: int


class DayItinerary(BaseModel):
    day: int
    date: str
    location: str
    morning: str
    afternoon: str
    evening: str


class BudgetBreakdown(BaseModel):
    flights: float
    accommodation: float
    food: float
    transport: float
    activities: float
    total: float


class CityItinerary(BaseModel):
    name: str
    country: str
    day_count: int
    order_index: int
    days: List[DayItinerary]
    hotel: Optional[Any] = None


class TripResponse(BaseModel):
    summary: str
    budget_breakdown: BudgetBreakdown
    discovery_insights: List[Any] = []
    hidden_gems: List[HiddenGem] = []
    cities: List[CityItinerary]
    flights: List[Any] = []
    suggested_route_order: Optional[List[str]] = None


class CityItem(BaseModel):
    name: str
    country: str
    day_count: int


class ResolveCitiesResponse(BaseModel):
    cities: List[CityItem]


class ActivityModel(BaseModel):
    time: Optional[str] = None
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    estimated_cost: Optional[float] = None


class DayModel(BaseModel):
    day_number: int
    date: Optional[str] = None
    activities: List[ActivityModel] = []
    accommodation: Optional[str] = None


class FlightOffer(BaseModel):
    offer_id: str
    airline: str
    airline_code: Optional[str] = None
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    duration: str
    stops: int
    price: float
    currency: str


class HotelOffer(BaseModel):
    offer_id: str
    name: str
    city: str
    stars: Optional[int] = None
    price_per_night: float
    currency: str
    amenities: Optional[List[str]] = []
    coordinates: Optional[dict] = None
    image_url: Optional[str] = None


class PlanResponse(BaseModel):
    trip_id: str
    destination: str
    departure_date: Optional[str] = None
    return_date: Optional[str] = None
    days: List[DayModel] = []
    flights: List[FlightOffer] = []
    hotels: List[HotelOffer] = []
    total_estimated_cost: Optional[float] = None
    currency: Optional[str] = "USD"
    message: Optional[str] = None


class UpdateResponse(BaseModel):
    trip_id: str
    updated_days: List[DayModel] = []
    flights: Optional[List[FlightOffer]] = []
    hotels: Optional[List[HotelOffer]] = []
    message: Optional[str] = None


class ConfirmResponse(BaseModel):
    trip_id: str
    flight_booking_ref: Optional[str] = None
    hotel_booking_ref: Optional[str] = None
    pdf_url: Optional[str] = None
    email_sent: bool = False
    message: Optional[str] = None


class DestinationCard(BaseModel):
    name: str
    country: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    trending_score: Optional[float] = None
    sources: Optional[List[str]] = []


class DiscoverResponse(BaseModel):
    trending: List[TrendingDestination] = []
    youtube_insights: Optional[dict] = None
    trend_score: Optional[dict] = None
    message: Optional[str] = None
