from fastapi import APIRouter, HTTPException

from models.request_models import DiscoverRequest
from models.response_models import DiscoverResponse

router = APIRouter()


@router.post("/", response_model=DiscoverResponse)
async def discover_destinations(request: DiscoverRequest):
    """
    Discovery endpoint — surfaces trending and community-recommended destinations.

    Steps:
    1. Build a search query from request.query, region, vibe, and season
    2. Call discovery_service.fetch_reddit_recommendations() for community posts
    3. Call discovery_service.fetch_youtube_travel_content() for video recommendations
    4. Call discovery_service.fetch_google_trends() for destination interest scores
    5. Aggregate all sources — deduplicate by destination name
    6. Call openai_service.rank_destinations() to score and add narrative summaries
    7. Return DiscoverResponse with sorted DestinationCard list
    """
    # TODO: Implement discovery aggregation pipeline
    raise HTTPException(status_code=501, detail="Not implemented yet")
