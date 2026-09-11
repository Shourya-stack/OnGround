"""
Extraction Service for OnGround IPIS.
Handles multi-format file parsing (PDF, CSV/XLSX, TXT), text normalization,
LLM orchestration, and deterministic confidence scoring.
"""

import io
import json
import logging
import unicodedata
from typing import List, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime

from backend.llm.provider import LLMProvider
from backend.llm.openrouter import OpenRouterProvider
from backend.models.schemas import ExtractedActivityRaw, ExtractedActivityCreate

logger = logging.getLogger("onground.extraction")


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extracts raw text from various file formats:
    - .pdf via pdfplumber
    - .csv via pandas / text decoding
    - .xlsx / .xls via pandas
    - .txt / .log via UTF-8 text decoding
    """
    lower_name = filename.lower()

    if lower_name.endswith(".pdf"):
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        return "\n".join(text_parts)

    elif lower_name.endswith(".csv"):
        import pandas as pd
        df = pd.read_csv(io.BytesIO(file_bytes))
        return df.to_string(index=False)

    elif lower_name.endswith((".xlsx", ".xls")):
        import pandas as pd
        df = pd.read_excel(io.BytesIO(file_bytes))
        return df.to_string(index=False)

    else:
        # Default plain text decoding
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("latin-1", errors="replace")


def normalize_text(raw_text: str, max_chars: int = 8000) -> str:
    """
    Normalizes unicode characters (NFKC) and truncates excessive length.
    """
    normalized = unicodedata.normalize("NFKC", raw_text)
    if len(normalized) > max_chars:
        logger.warning(f"Report text truncated from {len(normalized)} to {max_chars} characters.")
        return normalized[:max_chars]
    return normalized


def calculate_extraction_confidence(
    activity_desc: str,
    discipline: str,
    start_dt: Any,
    end_dt: Any,
    location_ref: str,
) -> float:
    """
    Computes deterministic extraction confidence score (0.50 to 1.00):
    - Base score: 0.50 (for a valid, non-empty description)
    - +0.15 if discipline is recognized (!= 'unknown')
    - +0.15 if start_time is present and valid
    - +0.10 if end_time is present and valid
    - +0.10 if location_reference is present and informative (len >= 3)
    """
    score = 0.50

    if discipline and discipline.lower() != "unknown":
        score += 0.15

    if start_dt is not None:
        score += 0.15

    if end_dt is not None:
        score += 0.10

    if location_ref and len(str(location_ref).strip()) >= 3:
        score += 0.10

    return min(1.0, round(score, 2))


def parse_datetime_safe(date_str: Any) -> Tuple[Any, bool]:
    """Safely parses a datetime string using dateparser or standard ISO format."""
    if not date_str or not isinstance(date_str, str):
        return None, False
    try:
        import dateparser
        parsed = dateparser.parse(date_str)
        if parsed:
            return parsed, True
    except ImportError:
        pass
    except Exception:
        pass

    # Fallback to standard ISO or common date formats
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt), True
        except ValueError:
            continue
    return None, False



class ExtractionService:
    """Service orchestrating text extraction, LLM invocation, and activity creation."""

    def __init__(self, provider: LLMProvider = None):
        self.provider = provider or OpenRouterProvider()

    def process_file_content(
        self,
        file_bytes: bytes,
        filename: str,
        extraction_id: UUID,
    ) -> List[ExtractedActivityCreate]:
        """
        Processes file bytes into verified ExtractedActivityCreate models with deterministic confidence.
        """
        raw_text = extract_text_from_file(file_bytes, filename)
        normalized_text = normalize_text(raw_text)

        if not normalized_text.strip():
            logger.warning(f"No text extracted from file {filename}.")
            return []

        # Call LLM provider
        raw_json_str = self.provider.extract_activities(normalized_text)

        # Parse LLM JSON
        try:
            activities_data = json.loads(raw_json_str)
            if not isinstance(activities_data, list):
                if isinstance(activities_data, dict) and "activities" in activities_data:
                    activities_data = activities_data["activities"]
                else:
                    activities_data = [activities_data]
        except Exception as e:
            logger.error(f"Failed to parse LLM JSON response: {e}\nRaw output: {raw_json_str}")
            raise ValueError(f"LLM output could not be parsed as JSON: {e}")

        extracted_models: List[ExtractedActivityCreate] = []

        for item in activities_data:
            if not isinstance(item, dict) or not item.get("activity_description"):
                continue

            raw_activity = ExtractedActivityRaw(**item)

            start_dt, start_valid = parse_datetime_safe(raw_activity.start_time)
            end_dt, end_valid = parse_datetime_safe(raw_activity.end_time)

            confidence = calculate_extraction_confidence(
                activity_desc=raw_activity.activity_description,
                discipline=raw_activity.discipline,
                start_dt=start_dt if start_valid else None,
                end_dt=end_dt if end_valid else None,
                location_ref=raw_activity.location_reference,
            )

            create_model = ExtractedActivityCreate(
                extraction_id=extraction_id,
                activity_description=raw_activity.activity_description.strip(),
                discipline=raw_activity.discipline,
                start_time=start_dt if start_valid else None,
                end_time=end_dt if end_valid else None,
                location_reference=raw_activity.location_reference.strip() if raw_activity.location_reference else None,
                extraction_confidence=confidence,
            )
            extracted_models.append(create_model)

        return extracted_models
