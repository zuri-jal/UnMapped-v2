import os
import asyncio
import html
import json
import re
from dotenv import load_dotenv
from openai import AsyncOpenAI

from utils.cache import get_cached, set_cached

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
_openai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

POPULAR_DESTINATIONS = [
    ("Tokyo", "Japan"),
    ("Bali", "Indonesia"),
    ("Paris", "France"),
    ("Barcelona", "Spain"),
    ("New York", "USA"),
    ("Rome", "Italy"),
    ("Bangkok", "Thailand"),
    ("Dubai", "UAE"),
    ("Lisbon", "Portugal"),
    ("Amsterdam", "Netherlands"),
    ("Kyoto", "Japan"),
    ("Istanbul", "Turkey"),
    ("Marrakech", "Morocco"),
    ("Sydney", "Australia"),
    ("Reykjavik", "Iceland"),
]


async def get_trending_score(destination: str) -> dict:
    cached = await get_cached(destination, "trends")
    if cached:
        return {**cached, "cached": True}

    def _fetch_trends():
        try:
            from pytrends.request import TrendReq
            pt = TrendReq(hl="en-US", tz=360, timeout=(10, 25))
            pt.build_payload([destination], cat=0, timeframe="today 1-m")
            df = pt.interest_over_time()
            if df is None or df.empty:
                print(f"[DEBUG pytrends] {destination!r}: df is None or empty")
                return None
            print(f"[DEBUG pytrends] {destination!r}: columns={list(df.columns)}  shape={df.shape}")
            if destination not in df.columns:
                print(f"[DEBUG pytrends] {destination!r}: column not found — no match")
                return None
            score = int(df[destination].mean())
            print(f"[DEBUG pytrends] {destination!r}: score={score}")
            return score
        except Exception as exc:
            print(f"[DEBUG pytrends] {destination!r}: exception {type(exc).__name__}: {exc}")
            return None

    score = await asyncio.to_thread(_fetch_trends)
    result = {"destination": destination, "score": score if score is not None else 0}
    if score is not None:
        await set_cached(destination, "trends", result, 24)
    return {**result, "cached": False}


async def get_youtube_insights(destination: str) -> dict:
    cached = await get_cached(destination, "youtube")
    if cached:
        return {**cached, "cached": True}

    def _fetch_youtube():
        try:
            from googleapiclient.discovery import build
            yt = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

            seen_ids: set = set()
            all_videos = []

            for query in [f"{destination} travel guide", f"{destination} hidden gems"]:
                search_resp = (
                    yt.search()
                    .list(q=query, part="snippet", type="video", maxResults=5, order="relevance")
                    .execute()
                )
                video_ids = [
                    item["id"]["videoId"]
                    for item in search_resp.get("items", [])
                    if item["id"]["videoId"] not in seen_ids
                ]
                seen_ids.update(video_ids)
                if not video_ids:
                    continue

                stats_resp = (
                    yt.videos()
                    .list(part="statistics,snippet", id=",".join(video_ids))
                    .execute()
                )
                for item in stats_resp.get("items", []):
                    stats = item.get("statistics", {})
                    all_videos.append({
                        "video_id": item["id"],
                        "title": item["snippet"]["title"],
                        "channel_title": item["snippet"]["channelTitle"],
                        "view_count": int(stats.get("viewCount", 0)),
                        "like_count": int(stats.get("likeCount", 0)),
                    })

            # Sort by view count, cap at 5
            all_videos.sort(key=lambda v: v["view_count"], reverse=True)
            top_videos = all_videos[:5]

            # Fetch top 10 comments for the top 2 videos
            top_comments: list = []
            for video in top_videos[:2]:
                try:
                    comments_resp = (
                        yt.commentThreads()
                        .list(
                            part="snippet",
                            videoId=video["video_id"],
                            maxResults=10,
                            order="relevance",
                        )
                        .execute()
                    )
                    for item in comments_resp.get("items", []):
                        text = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
                        text = html.unescape(text)
                        text = re.sub(r"<[^>]+>", "", text).strip()
                        top_comments.append(text[:280])
                except Exception:
                    pass

            return {"videos": top_videos, "top_comments": top_comments}
        except Exception:
            return {"videos": [], "top_comments": []}

    data = await asyncio.to_thread(_fetch_youtube)
    result = {"destination": destination, **data}
    await set_cached(destination, "youtube", result, 48)
    return {**result, "cached": False}


async def get_hidden_gems(destination: str) -> list:
    if not destination:
        return []
    try:
        youtube_data = await get_youtube_insights(destination)
        videos = youtube_data.get("videos", [])
        comments = youtube_data.get("top_comments", [])

        if videos or comments:
            content_lines = [f"Video: {v['title']}" for v in videos]
            content_lines += [f"Comment: {c}" for c in comments[:20]]
            content_text = "\n".join(content_lines)
            prompt = (
                f"Based on the following YouTube content about {destination}, "
                "extract 4-6 specific named hidden gems (restaurants, viewpoints, activities, local spots) "
                "that travelers mention.\n\n"
                f"YouTube Content:\n{content_text}\n\n"
                "Return a JSON object with a single key \"gems\" containing an array of objects, each with:\n"
                "- name: specific name of the place or activity\n"
                "- type: one of \"restaurant\", \"viewpoint\", \"activity\", \"food\"\n"
                "- description: 1-2 sentence description\n"
                "- source: \"YouTube\"\n"
                "- source_quote: a brief relevant quote or paraphrase from the content above"
            )
        else:
            prompt = (
                f"Suggest 4-6 specific named hidden gems in {destination} that most tourists miss. "
                "These should be real, named places or activities.\n\n"
                "Return a JSON object with a single key \"gems\" containing an array of objects, each with:\n"
                "- name: specific name of the place or activity\n"
                "- type: one of \"restaurant\", \"viewpoint\", \"activity\", \"food\"\n"
                "- description: 1-2 sentence description\n"
                "- source: \"AI recommendation\"\n"
                "- source_quote: why this is a hidden gem worth visiting"
            )

        response = await _openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        parsed = json.loads(response.choices[0].message.content)
        gems = parsed.get("gems", [])
        if not isinstance(gems, list):
            return []
        return gems[:6]
    except Exception:
        return []


async def get_trending_destinations() -> list:
    # Throttle to 3 concurrent pytrends calls — 15 simultaneous requests triggers rate limiting
    semaphore = asyncio.Semaphore(3)

    async def _limited_score(dest: str) -> dict:
        async with semaphore:
            return await get_trending_score(dest)

    score_tasks = [_limited_score(dest) for dest, _ in POPULAR_DESTINATIONS]
    scores = await asyncio.gather(*score_tasks, return_exceptions=True)

    print(f"[DEBUG get_trending_destinations] raw scores from gather: {scores}")

    results = []
    for (dest, country), score_data in zip(POPULAR_DESTINATIONS, scores):
        if isinstance(score_data, Exception):
            score = 0
        elif isinstance(score_data, dict):
            raw = score_data.get("score")
            score = int(raw) if raw is not None else 0
        else:
            score = 0
        results.append({"destination": dest, "country": country, "score": score})

    print(f"[DEBUG get_trending_destinations] results before sort: {results}")

    results.sort(key=lambda x: x["score"] or 0, reverse=True)
    top6 = results[:6]
    print(f"[DEBUG get_trending_destinations] top 6: {top6}")
    return top6
