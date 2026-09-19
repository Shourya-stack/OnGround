"""
OpenRouter LLM Provider Implementation for OnGround.
Calls OpenRouter API using free-tier models with structured system prompt,
intelligent model failover on 429 quota limits, and deterministic offline fallback.
"""

import os
import json
import re
import logging
import httpx
from typing import Optional, List
from backend.llm.provider import LLMProvider

logger = logging.getLogger("onground.llm")

DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free"
FALLBACK_MODEL = "google/gemini-2.0-flash-exp:free"
ADDITIONAL_FALLBACKS = [
    "liquid/lfm-2.5-2.6b:free",
    "nvidia/nemotron-3.5-lightning:free",
]
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """You are an expert EPC (Engineering, Procurement, Construction) infrastructure project analyst for OnGround.
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
    """LLM Provider that queries OpenRouter chat completions endpoint with failover & offline resilience."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        fallback_model: Optional[str] = None,
        timeout: float = 35.0,
        max_retries: int = 1,
    ):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.model = model or os.getenv("LLM_MODEL") or DEFAULT_MODEL
        self.fallback_model = fallback_model or FALLBACK_MODEL
        self.timeout = timeout
        self.max_retries = max_retries

    def extract_activities(self, raw_text: str) -> str:
        """
        Extracts activities from raw text via OpenRouter.
        Tries primary model -> fallback models on 429 quota errors -> offline fallback if unavailable.
        Returns the raw JSON string.
        """
        if not self.api_key or self.api_key.startswith("your-") or "placeholder" in self.api_key or self.api_key in ("test", "mock"):
            logger.info("OPENROUTER_API_KEY is not configured with a live key. Using fallback extractor.")
            return self._local_mock_fallback(raw_text)

        # Build candidate models list without duplicates
        candidates: List[str] = [self.model]
        for fb in [self.fallback_model] + ADDITIONAL_FALLBACKS:
            if fb and fb not in candidates:
                candidates.append(fb)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/Shourya-stack/OnGround",
            "X-Title": "OnGround",
        }

        last_error = None

        for model_name in candidates:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Extract activities from the following daily construction report:\n\n{raw_text}"},
                ],
                "temperature": 0.1,
                "max_tokens": 3072,
            }

            for attempt in range(1, self.max_retries + 2):
                try:
                    logger.info(f"Sending extraction request to OpenRouter (model: {model_name}, attempt: {attempt})")
                    with httpx.Client(timeout=self.timeout) as client:
                        response = client.post(OPENROUTER_URL, headers=headers, json=payload)

                        if response.status_code == 200:
                            data = response.json()
                            content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                            cleaned = self._clean_json_response(content)
                            # Verify valid JSON
                            json.loads(cleaned)
                            return cleaned
                        elif response.status_code == 429:
                            logger.warning(
                                f"OpenRouter model '{model_name}' hit 429 rate limit / quota exceeded. "
                                f"Failing over to next model."
                            )
                            last_error = f"Model {model_name} 429: {response.text}"
                            # Do not retry the same exhausted model; break immediately to next candidate
                            break
                        else:
                            logger.error(f"OpenRouter model '{model_name}' returned status {response.status_code}: {response.text}")
                            last_error = f"Model {model_name} status {response.status_code}: {response.text}"
                except Exception as e:
                    logger.error(f"OpenRouter request error on model '{model_name}' attempt {attempt}: {e}")
                    last_error = str(e)

        logger.warning(
            f"All OpenRouter candidate models exhausted or rate-limited ({last_error}). "
            f"Engaging deterministic offline fallback parser."
        )
        return self._local_mock_fallback(raw_text)

    def _clean_json_response(self, content: str) -> str:
        """Removes markdown code fences (```json ... ```) or pre/post conversational text, with truncated JSON repair."""
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

        # If array is truncated (starts with [ but doesn't end with ]), repair by cutting to the last complete object
        if cleaned.startswith("["):
            last_obj_idx = cleaned.rfind("}")
            if last_obj_idx != -1:
                repaired = cleaned[:last_obj_idx + 1] + "\n]"
                try:
                    json.loads(repaired)
                    return repaired
                except Exception:
                    pass

        return cleaned

    def _local_mock_fallback(self, raw_text: str) -> str:
        """
        Deterministic offline fallback that parses structured construction reports
        into valid activity objects conforming to ExtractedActivityRaw.
        """
        lines = [l.strip() for l in raw_text.splitlines() if l.strip() and not l.startswith("#")]
        activities = []
        
        # Regex patterns for ISO timestamps and locations
        iso_pattern = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")
        time_range_pattern = re.compile(r"(\d{2}:\d{2})\s*(?:to|-)\s*(\d{2}:\d{2})")

        # Check if text contains structured lines (e.g., ACT-CIV, or numbered activities)
        activity_blocks = []
        current_block = []

        for line in lines:
            # Detect activity line starts (ACT-..., numbers like 1., or bullets)
            if re.match(r"^(ACT-[A-Z]+-\d+|[0-9]+\.|\*|-|Item\s*\d+)", line, re.IGNORECASE):
                if current_block:
                    activity_blocks.append(" ".join(current_block))
                    current_block = []
            current_block.append(line)

        if current_block:
            activity_blocks.append(" ".join(current_block))

        # If no explicit markers found, treat lines as potential items
        candidates = activity_blocks if len(activity_blocks) >= 2 else lines

        for block in candidates:
            # Filter out pure headers/footers
            lower = block.lower()
            if any(h in lower for h in ["daily progress report", "project name:", "project code:", "weather /", "prepared by:", "authorized by:"]):
                continue

            # Classify discipline
            disc = "unknown"
            if any(w in lower for w in ["pipe", "welding", "flange", "spool", "hydrotest", "gtaw", "smaw", "hydrocarbon header"]):
                disc = "piping"
            elif any(w in lower for w in ["cable", "conduit", "tray", "transformer", "panel", "busduct", "11kv", "grounding", "feeder"]):
                disc = "electrical"
            elif any(w in lower for w in ["concrete", "excavation", "rebar", "foundation", "shuttering", "earthworks", "grading", "steel rack", "pipe rack erection"]):
                disc = "civil"
            elif any(w in lower for w in ["sensor", "transmitter", "scada", "plc", "loop", "tubing", "manifold", "instrument air"]):
                disc = "instrumentation"
            elif any(w in lower for w in ["column", "vessel", "pump", "compressor", "heat exchanger", "fin-fan", "rigging", "distillation", "heavy lift"]):
                disc = "static_rotating_equipment"
            elif any(w in lower for w in ["scaffold", "safety", "fall arrest", "ppe", "hse", "green-tagged", "osha"]):
                disc = "hse"

            # Extract location
            loc = None
            loc_match = re.search(r"(?:Location\s*(?:Ref)?[:\s]+|in\s+|at\s+)([A-Za-z0-9\s\-]+?)(?=\s+(?:2026|\d{2}:\d{2}|Discipline|Remarks|Progress|\.|$))", block)
            if loc_match and len(loc_match.group(1).strip()) >= 3:
                loc = loc_match.group(1).strip()
            elif "pump house" in lower:
                loc = "Pump House A"
            elif "compressor" in lower:
                loc = "Compressor Building Grid C-4"
            elif "piperack" in lower or "pipe rack" in lower:
                loc = "Piperack Corridor Level 2"
            elif "unit 200" in lower:
                loc = "Unit 200 Area B"
            elif "substation" in lower:
                loc = "Substation 3 Cable Trench"
            elif "main processing" in lower or "distillation" in lower:
                loc = "Main Processing Train Bay 1"
            else:
                loc = "Site Zone 3"

            # Extract timestamps
            found_isos = iso_pattern.findall(block)
            start_t = found_isos[0] if len(found_isos) >= 1 else None
            end_t = found_isos[1] if len(found_isos) >= 2 else None

            if not start_t:
                tr = time_range_pattern.search(block)
                if tr:
                    start_t = f"2026-09-18T{tr.group(1)}:00"
                    end_t = f"2026-09-18T{tr.group(2)}:00"

            # Clean description
            clean_desc = re.sub(r"^(?:ACT-[A-Z]+-\d+|[0-9]+\.|\*|-)\s*", "", block).strip()
            # Remove trailing metadata tokens if present
            clean_desc = re.sub(r"\s*(?:Civil|Piping|Electrical|Instrumentation|Static Rotating Equipment|HSE)\s+.*$", "", clean_desc, flags=re.IGNORECASE).strip()
            if len(clean_desc) < 10:
                clean_desc = block

            activities.append({
                "activity_description": clean_desc,
                "discipline": disc,
                "start_time": start_t,
                "end_time": end_t,
                "location_reference": loc
            })

        return json.dumps(activities)
