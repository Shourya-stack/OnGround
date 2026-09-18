"""
Configuration and Environment Settings for OnGround Backend.
Handles environment variable loading, validation, and CORS origin resolution.
"""

import os
import logging
from typing import List, Optional, Tuple

logger = logging.getLogger("onground.config")


def get_environment() -> str:
    """Returns current environment ('development', 'production', 'test')."""
    return os.getenv("ENVIRONMENT", "development").lower().strip()


def get_cors_origins() -> List[str]:
    """
    Resolves allowed CORS origins securely.
    - In development/test: includes standard local dev origins + any configured FRONTEND_URL / ALLOWED_ORIGINS.
    - In production: strictly requires explicit ALLOWED_ORIGINS or FRONTEND_URL.
    """
    env = get_environment()
    origins = set()

    # Read from ALLOWED_ORIGINS (comma-separated list)
    allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "")
    if allowed_origins_raw:
        for origin in allowed_origins_raw.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned:
                origins.add(cleaned)

    # Read from FRONTEND_URL
    frontend_url = os.getenv("FRONTEND_URL", "")
    if frontend_url:
        cleaned = frontend_url.strip().rstrip("/")
        if cleaned:
            origins.add(cleaned)

    # In development/test mode, include standard local origins by default
    if env in ("development", "test"):
        origins.update([
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ])

    return sorted(list(origins))


def get_cors_regex() -> Optional[str]:
    """
    Returns regex for CORS origin matching if explicitly configured via ALLOWED_ORIGIN_REGEX.
    Avoids open wildcards by default in production.
    """
    regex = os.getenv("ALLOWED_ORIGIN_REGEX", "").strip()
    return regex if regex else None


def validate_environment() -> Tuple[bool, List[str]]:
    """
    Performs lightweight startup configuration validation.
    Returns (is_valid, list_of_warnings_or_errors).
    Never prints or leaks secret values.
    """
    env = get_environment()
    messages = []
    is_valid = True

    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY", "").strip()
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "").strip()

    # 1. Supabase URL
    if not supabase_url:
        msg = "SUPABASE_URL is not set."
        if env == "production":
            is_valid = False
            messages.append(f"CRITICAL: {msg}")
        else:
            messages.append(f"WARNING: {msg} (using mock/offline mode in {env})")
    elif "your-project.supabase.co" in supabase_url:
        msg = "SUPABASE_URL is set to default placeholder template."
        if env == "production":
            is_valid = False
            messages.append(f"CRITICAL: {msg}")
        else:
            messages.append(f"WARNING: {msg}")

    # 2. Supabase Service Key
    if not supabase_key:
        msg = "SUPABASE_SERVICE_KEY is not set."
        if env == "production":
            is_valid = False
            messages.append(f"CRITICAL: {msg}")
        else:
            messages.append(f"WARNING: {msg} (using mock/offline mode in {env})")
    elif "your-supabase-service-role-key" in supabase_key:
        msg = "SUPABASE_SERVICE_KEY is set to default placeholder."
        if env == "production":
            is_valid = False
            messages.append(f"CRITICAL: {msg}")
        else:
            messages.append(f"WARNING: {msg}")

    # 3. LLM Provider Key (Optional with graceful fallback)
    if not openrouter_key:
        messages.append("INFO: OPENROUTER_API_KEY not set. Extraction pipeline will operate in deterministic offline mode.")

    return is_valid, messages
