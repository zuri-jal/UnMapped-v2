import asyncio
from fastapi import APIRouter, Request as StarletteRequest

from models.request_models import DiscoverRequest
from models.response_models import DiscoverResponse, TrendingDestination
from services.discovery_service import (
    get_trending_destinations,
    get_youtube_insights,
    get_trending_score,
)

router = APIRouter()


@router.post("/", response_model=DiscoverResponse)
async def discover_destinations(raw: StarletteRequest, request: DiscoverRequest):
    try:
        body = await raw.json()
    except Exception:
        body = {}
    print(f"[DEBUG /discover] raw body: {body}")
    print(f"[DEBUG /discover] parsed request.query={request.query!r}  request.destination={request.destination!r}")

    destination = request.destination

    if not destination:
        trending_raw = await get_trending_destinations()
        return DiscoverResponse(
            trending=[TrendingDestination(**t) for t in trending_raw]
        )

    youtube_data, trend_data = await asyncio.gather(
        get_youtube_insights(destination),
        get_trending_score(destination),
    )
    return DiscoverResponse(
        youtube_insights=youtube_data,
        trend_score=trend_data,
    )
