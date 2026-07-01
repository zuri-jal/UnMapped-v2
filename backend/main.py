import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes import plan, update, confirm, discover, resolve_cities, profile, trips

load_dotenv()

app = FastAPI(
    title="Unmapped API",
    description="AI-powered travel discovery, planning and booking platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plan.router,           prefix="/plan",           tags=["plan"])
app.include_router(resolve_cities.router, prefix="/resolve-cities", tags=["plan"])
app.include_router(update.router,         prefix="/update",         tags=["update"])
app.include_router(confirm.router,        prefix="/confirm",        tags=["confirm"])
app.include_router(discover.router,       prefix="/discover",       tags=["discover"])
app.include_router(profile.router,        prefix="/profile",        tags=["profile"])
app.include_router(trips.router,          prefix="/trips",           tags=["trips"])


@app.get("/")
async def root():
    return {"message": "Unmapped API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    # TODO: Add Supabase connectivity check
    # TODO: Add Redis connectivity check
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
