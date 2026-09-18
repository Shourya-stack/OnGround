"""
OnGround — Infrastructure Progress Intelligence System (IPIS)
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
from backend.routes.schedule import router as schedule_router
from backend.routes.reports import router as reports_router
from backend.routes.audit import router as audit_router
from backend.routes.analytics import router as analytics_router

from backend.config import get_cors_origins, get_cors_regex, validate_environment, get_environment

# Load environment variables with override enabled
load_dotenv(override=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("onground")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    env = get_environment()
    logger.info(f"Starting OnGround Backend API in {env.upper()} mode...")
    
    # Run startup environment validation
    is_valid, validation_msgs = validate_environment()
    for msg in validation_msgs:
        logger.info(f"[Config Validation] {msg}")
    
    if not is_valid and env == "production":
        logger.error("FATAL: Environment validation failed in production mode.")
    
    yield
    logger.info("OnGround Backend API shutdown.")


app = FastAPI(
    title="OnGround API",
    description="Automated Progress Tracking & Schedule-Linking for EPC Megaprojects",
    version="1.0.0",
    lifespan=lifespan
)

# =============================================================================
# CORS Configuration (Production-Hardened)
# =============================================================================
cors_origins = get_cors_origins()
cors_regex = get_cors_regex()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_regex,
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
app.include_router(schedule_router)
app.include_router(reports_router)
app.include_router(audit_router)
app.include_router(analytics_router)



if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
