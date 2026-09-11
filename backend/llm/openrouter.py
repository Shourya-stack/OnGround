"""
OpenRouter LLM Provider Implementation for OnGround.
Calls OpenRouter API using free-tier models (default: meta-llama/llama-3.3-70b-instruct:free)
with structured system prompt, error handling, timeout, and retry logic.
"""

import os
import json
import re
import logging
import httpx
from typing import Optional
from backend.llm.provider import LLMProvider

logger = logging.getLogger("onground.llm")

DEFAULT_MODEL = "liquid/lfm-2.5-2.6b:free"
FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning:free"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """You are an expert EPC (Engineering, Procurement, Construction) infrastructure project analyst for OnGround IPIS.
Your task is to parse raw daily progress reports, shift logs, or spreadsheet text and extract individual construction activities.

For each distinct activity mentioned in the text, extract:
- "activity_description": A clear, concise summary of the specific physical work performed.
- "discipline": One of ["civil", "piping", "electrical", "instrumentation", "static_rotating_equipment", "hse", "unknown"].
- "start_time": ISO format timestamp or date string if mentioned, or null.
- "end_time": ISO format timestamp or date string if mentioned, or null.
- "location_reference": Specific unit, zone, grid, chainage, elevation, or area if mentioned, or null.

STRICT INSTRUCTIONS:
1. Return ONLY a valid JSON array of activity objects.
2. Do NOT wrap the JSON in conversational text.
3. Do NOT invent confidence scores or include confidence keys; confidence is calculated deterministically by OnGround backend.
4. If no activities are found, return an empty array `[]`.

Example output format:
[
  {
    "activity_description": "Fit-up and root pass welding of 12-inch CS cooling water line",
    "discipline": "piping",
    "start_time": "2026-09-10T08:00:00",
    "end_time": "2026-09-10T14:30:00",
    "location_reference": "Unit 200 - Area B"
  }
]
"""


class OpenRouterProvider(LLMProvider):
    """LLM Provider that queries OpenRouter chat completions endpoint."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = 35.0,
        max_retries: int = 2,
    ):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.model = model or os.getenv("LLM_MODEL") or DEFAULT_MODEL
        self.timeout = timeout
        self.max_retries = max_retries

    def extract_activities(self, raw_text: str) -> str:
        """
        Extracts activities from raw text via OpenRouter.
        Returns the raw JSON string.
        """
        if not self.api_key or self.api_key.startswith("your-") or "placeholder" in self.api_key or self.api_key in ("test", "mock"):
            logger.info("OPENROUTER_API_KEY is not configured with a live key. Using fallback extractor.")
            return self._local_mock_fallback(raw_text)


        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/Shourya-stack/OnGround",
            "X-Title": "OnGround IPIS",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract activities from the following daily construction report:\n\n{raw_text}"},
            ],
            "temperature": 0.1,
            "max_tokens": 2048,
        }

        last_error = None
        for attempt in range(1, self.max_retries + 2):
            try:
                logger.info(f"Sending extraction request to OpenRouter (model: {self.model}, attempt: {attempt})")
                with httpx.Client(timeout=self.timeout) as client:
                    response = client.post(OPENROUTER_URL, headers=headers, json=payload)
                    
                    if response.status_code == 200:
                        data = response.json()
                        content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                        return self._clean_json_response(content)
                    else:
                        logger.error(f"OpenRouter returned status {response.status_code}: {response.text}")
                        last_error = f"OpenRouter status {response.status_code}: {response.text}"
            except Exception as e:
                logger.error(f"OpenRouter request error on attempt {attempt}: {e}")
                last_error = str(e)

        raise RuntimeError(f"OpenRouter extraction failed after {self.max_retries + 1} attempts: {last_error}")

    def _clean_json_response(self, content: str) -> str:
        """Removes markdown code fences (```json ... ```) or pre/post conversational text."""
        cleaned = content.strip()
        # Remove markdown code block fences if present
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # If LLM still included conversational wrapper, regex search for the outermost array
        match = re.search(r"\[\s*\{.*\}\s*\]", cleaned, re.DOTALL)
        if match:
            return match.group(0)
        return cleaned

    def _local_mock_fallback(self, raw_text: str) -> str:
        """
        Deterministic offline fallback for local tests when no API key is provided.
        Parses common lines to ensure development continuity.
        """
        lines = [l.strip() for l in raw_text.splitlines() if l.strip() and not l.startswith("#")]
        activities = []
        for line in lines[:5]:
            disc = "unknown"
            lower = line.lower()
            if any(w in lower for w in ["pipe", "welding", "flange", "spool", "hydrotest"]):
                disc = "piping"
            elif any(w in lower for w in ["cable", "conduit", "tray", "transformer", "panel"]):
                disc = "electrical"
            elif any(w in lower for w in ["concrete", "excavation", "rebar", "foundation", "shuttering"]):
                disc = "civil"
            elif any(w in lower for w in ["sensor", "transmitter", "scada", "plc", "loop"]):
                disc = "instrumentation"

            activities.append({
                "activity_description": line,
                "discipline": disc,
                "start_time": None,
                "end_time": None,
                "location_reference": "Site Zone 1"
            })

        return json.dumps(activities)
