"""
TrueLine — Infrastructure Progress Intelligence System (IPIS)
FastAPI Backend Application Entry Point.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.models.schemas import HealthResponse
from backend.routes.upload import router as upload_router
from backend.routes.extract import router as extract_router
from backend.routes.match import router as match_router
from backend.routes.review import router as review_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("trueline")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("Starting TrueLine Backend API...")
    # In Phase 2: sentence-transformers model preload will be initialized here
    yield
    logger.info("TrueLine Backend API shutdown.")


app = FastAPI(
    title="TrueLine — IPIS API",
    description="Automated Progress Tracking & Schedule-Linking for EPC Megaprojects",
    version="1.0.0",
    lifespan=lifespan
)

# =============================================================================
# CORS Configuration
# =============================================================================
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_env = os.getenv("FRONTEND_URL")
if frontend_env:
    allowed_origins.append(frontend_env)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Health Check Endpoint (Public, no auth)
# =============================================================================
@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    """Liveness check for deployment platforms and local verification."""
    return HealthResponse(status="ok", version="1.0.0")


# =============================================================================
# Route Registrations
# =============================================================================
app.include_router(upload_router)
app.include_router(extract_router)
app.include_router(match_router)
app.include_router(review_router)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
