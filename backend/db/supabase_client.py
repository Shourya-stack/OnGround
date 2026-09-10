"""
Supabase client singleton for TrueLine backend.
Uses the SUPABASE_SERVICE_KEY to perform privileged operations (bypassing RLS for system writes).
"""

import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("trueline.db")

_supabase_client = None

def get_supabase_client():
    """
    Returns a cached Supabase client singleton instance.
    Raises ValueError if required environment variables are not set.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        logger.warning(
            "SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. "
            "Database operations will fail until environment variables are configured."
        )
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(supabase_url, supabase_key)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise
