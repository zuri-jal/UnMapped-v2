import os
import asyncio
import httpx
from dotenv import load_dotenv
from utils.cache import get_cache, set_cache, cache_key

load_dotenv()

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = "unmapped:v1.0"
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

REDDIT_SUBREDDITS = ["travel", "solotravel", "backpacking", "shoestring"]


async def fetch_reddit_recommendations(query: str, limit: int = 10) -> list:
    """
    Search Reddit travel subreddits for posts matching the query.

    - Authenticate with Reddit via OAuth2 client credentials flow
    - Search each subreddit in REDDIT_SUBREDDITS for the query string
    - For each post, extract: title, url, upvotes, comment_count, top 3 comments
    - Parse destination mentions using NLP entity extraction (call nlp_service)
    - Deduplicate by destination name across subreddits
    - Return list of dicts: { source, title, url, upvotes, destination, snippet }
    """
    # TODO: Implement async Reddit search using praw or direct OAuth + httpx
    pass


async def fetch_youtube_travel_content(destination: str, max_results: int = 5) -> list:
    """
    Search YouTube Data API v3 for travel videos about the destination.

    - GET https://www.googleapis.com/youtube/v3/search with the destination query
    - Filter for videos only, order by relevance, type=video
    - For each result, extract: title, channel_title, view_count, thumbnail_url, video_url
    - Prefer videos from known travel channels (check channel title heuristics)
    - Return list of video dicts tagged with source="youtube"
    """
    # TODO: Implement YouTube search using google-api-python-client or direct httpx
    pass


async def fetch_google_trends(keywords: list, timeframe: str = "today 3-m") -> dict:
    """
    Query Google Trends for relative interest scores across destination keywords.

    - pytrends is synchronous — run it in a thread pool via asyncio.to_thread()
    - Call TrendReq().build_payload(keywords, timeframe=timeframe)
    - Call .interest_over_time() to get a DataFrame of scores
    - Compute the mean score per keyword over the timeframe
    - Return dict mapping each keyword to its average interest score (0–100)
    """
    # TODO: Implement pytrends query wrapped in asyncio.to_thread for async safety
    pass


async def aggregate_discovery_data(destination: str) -> dict:
    """
    Concurrently fetch data from Reddit, YouTube, and Google Trends.

    - Use asyncio.gather() to run all three sources in parallel
    - Merge results into a unified dict keyed by source
    - Tag each item with its source for frontend attribution display
    - Return: { reddit: [...], youtube: [...], trends: { keyword: score } }
    """
    reddit, youtube, trends = await asyncio.gather(
        fetch_reddit_recommendations(destination),
        fetch_youtube_travel_content(destination),
        fetch_google_trends([destination]),
    )
    # TODO: Implement deduplication and enrichment of aggregated results
    return {"reddit": reddit, "youtube": youtube, "trends": trends}
