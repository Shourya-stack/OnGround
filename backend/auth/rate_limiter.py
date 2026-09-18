"""
In-Memory Sliding-Window Rate Limiter for FastAPI.
Provides per-process endpoint rate limiting for expensive operations (upload, extraction, matching)
configurable via environment variables.
"""

import os
import time
import threading
from typing import Dict, List, Tuple, Optional
from fastapi import Request, HTTPException, status

logger = logging_import = None
try:
    import logging
    logger = logging.getLogger("onground.ratelimit")
except ImportError:
    pass


def parse_rate_limit(limit_str: str, default_count: int = 10, default_window: int = 60) -> Tuple[int, int]:
    """
    Parses rate limit strings like '10/minute', '5/second', '100/hour', '30/min', or '20'.
    Returns (max_requests, window_seconds).
    Falls back gracefully to (default_count, default_window) if string is invalid or count <= 0.
    """
    if not limit_str or not isinstance(limit_str, str):
        return default_count, default_window

    parts = limit_str.strip().lower().split("/")
    try:
        count = int(parts[0])
        if count <= 0:
            count = default_count
    except ValueError:
        return default_count, default_window

    if len(parts) == 1:
        return count, default_window

    unit = parts[1]
    if unit in ("second", "sec", "s"):
        window = 1
    elif unit in ("minute", "min", "m"):
        window = 60
    elif unit in ("hour", "hr", "h"):
        window = 3600
    elif unit in ("day", "d"):
        window = 86400
    else:
        window = default_window

    return count, window


class InMemoryRateLimiter:
    """
    Thread-safe in-memory sliding-window rate limiter.
    Stores timestamps of recent requests per (endpoint, client_id).

    PRODUCTION NOTE:
    This limiter operates per process/instance (in-memory). For horizontally scaled
    deployments with multiple Uvicorn worker processes or cluster replicas, rate
    limiting is process-local. A shared caching tier (e.g. Redis) would be required
    for distributed cross-node rate coordination.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._records: Dict[str, List[float]] = {}

    def check(
        self,
        request: Request,
        endpoint_key: str,
        env_var: str,
        default_limit: str = "10/minute",
        user_id: Optional[str] = None,
    ) -> None:
        """
        Validates whether the current request is within the rate limit.
        Raises HTTPException(429) if the limit is exceeded.
        Identifies client primarily by authenticated user ID (un-spoofable),
        or by client host IP. X-Forwarded-For is only trusted if TRUST_PROXY_HEADERS=true.
        """
        limit_str = os.getenv(env_var, default_limit)
        max_requests, window_seconds = parse_rate_limit(limit_str)

        # 1. Primary identification: authenticated user ID
        client_id = f"user:{user_id}" if user_id else "unknown"

        # 2. Secondary identification: client IP with safe proxy handling
        if client_id == "unknown":
            trust_proxy = os.getenv("TRUST_PROXY_HEADERS", "false").lower() in ("true", "1", "yes")
            if trust_proxy:
                forwarded = request.headers.get("x-forwarded-for")
                if forwarded:
                    client_id = forwarded.split(",")[0].strip()
            
            if client_id == "unknown" and request.client and request.client.host:
                client_id = request.client.host

        storage_key = f"{endpoint_key}:{client_id}"
        now = time.monotonic()

        with self._lock:
            history = self._records.get(storage_key, [])
            cutoff = now - window_seconds
            # Remove timestamps outside the sliding window
            history = [t for t in history if t > cutoff]

            if len(history) >= max_requests:
                if logger:
                    logger.warning(f"Rate limit exceeded for {storage_key} ({len(history)}/{max_requests} in {window_seconds}s)")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please retry later.",
                    headers={"Retry-After": str(window_seconds)},
                )

            history.append(now)
            self._records[storage_key] = history

    def reset(self) -> None:
        """Clears all stored rate limit history (useful for tests)."""
        with self._lock:
            self._records.clear()


# Global limiter singleton
limiter = InMemoryRateLimiter()


# Dependency factories for FastAPI routes
async def rate_limit_upload(request: Request) -> None:
    limiter.check(request, "upload", "RATE_LIMIT_UPLOAD", "10/minute")


async def rate_limit_extraction(request: Request) -> None:
    limiter.check(request, "extraction", "RATE_LIMIT_EXTRACTION", "10/minute")


async def rate_limit_match(request: Request) -> None:
    limiter.check(request, "match", "RATE_LIMIT_MATCH", "30/minute")
