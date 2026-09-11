"""
Supabase client singleton for TrueLine backend.
Uses the SUPABASE_SERVICE_KEY to perform privileged operations (bypassing RLS for system writes).
"""

import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger("trueline.db")

_supabase_client = None
_cached_url = None
_cached_key = None

def get_supabase_client():
    """
    Returns a cached Supabase client singleton instance.
    Automatically re-initializes if environment variables change.
    """
    global _supabase_client, _cached_url, _cached_key

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key or "your-project" in supabase_url:
        logger.warning(
            "SUPABASE_URL or SUPABASE_SERVICE_KEY is missing or placeholder. "
            "Database operations will fail until environment variables are configured."
        )
        return None

    if _supabase_client is not None and _cached_url == supabase_url and _cached_key == supabase_key:
        return _supabase_client

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(supabase_url, supabase_key)
        _cached_url = supabase_url
        _cached_key = supabase_key
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None
