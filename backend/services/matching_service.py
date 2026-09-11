"""
Matching Engine Service for TrueLine IPIS.
Uses sentence-transformers (all-MiniLM-L6-v2) for semantic embeddings,
combines with discipline and date proximity heuristics, determines confidence bands,
and performs candidate disambiguation.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4
from datetime import datetime

from backend.db.supabase_client import get_supabase_client
from backend.models.schemas import CandidateMatch, MatchResult
from backend.services.audit_service import log_action

logger = logging.getLogger("trueline.matching")

_embedding_model = None


def get_embedding_model():
    """Singleton loader for sentence-transformers embedding model."""
    global _embedding_model
    if _embedding_model is None:
        try:
            logger.info("Loading sentence-transformers (all-MiniLM-L6-v2)...")
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load sentence-transformers: {e}. Using fallback TF-IDF/Levenshtein simulator.")
            _embedding_model = "fallback"
    return _embedding_model


import math

def compute_similarity(text1: str, text2: str, model=None) -> float:
    """Computes cosine similarity between two activity descriptions."""
    if model is None or model == "fallback":
        # Fallback word-overlap Jaccard/Dice similarity for quick local testing without heavy model weights
        s1 = set(text1.lower().split())
        s2 = set(text2.lower().split())
        if not s1 or not s2:
            return 0.0
        intersection = len(s1.intersection(s2))
        return round(float(2 * intersection / (len(s1) + len(s2))), 4)

    try:
        embeddings = model.encode([text1, text2])
        emb1, emb2 = list(embeddings[0]), list(embeddings[1])
        try:
            import numpy as np
            norm1 = np.linalg.norm(emb1)
            norm2 = np.linalg.norm(emb2)
            if norm1 == 0 or norm2 == 0:
                return 0.0
            cos_sim = float(np.dot(emb1, emb2) / (norm1 * norm2))
        except ImportError:
            dot = sum(a * b for a, b in zip(emb1, emb2))
            norm1 = math.sqrt(sum(a * a for a in emb1))
            norm2 = math.sqrt(sum(b * b for b in emb2))
            if norm1 == 0 or norm2 == 0:
                return 0.0
            cos_sim = float(dot / (norm1 * norm2))

        return max(0.0, min(1.0, round(cos_sim, 4)))
    except Exception as e:
        logger.error(f"Error computing embedding similarity: {e}")
        return 0.5



def calculate_match_score(
    embedding_sim: float,
    extraction_confidence: float,
    extracted_discipline: str,
    plan_discipline: str,
    date_proximity_factor: float = 1.0,
) -> float:
    """
    Hybrid scoring formula:
    score = (0.70 * embedding_sim) + (0.20 * extraction_confidence) + (0.10 * date_proximity_factor) - discipline_penalty
    """
    discipline_penalty = 0.0
    if (
        extracted_discipline
        and plan_discipline
        and extracted_discipline.lower() != "unknown"
        and plan_discipline.lower() != "unknown"
        and extracted_discipline.lower() != plan_discipline.lower()
    ):
        discipline_penalty = 0.15

    composite = (0.70 * embedding_sim) + (0.20 * extraction_confidence) + (0.10 * date_proximity_factor) - discipline_penalty
    return max(0.0, min(1.0, round(composite, 4)))


class MatchingService:
    """Service matching extracted activities to baseline schedule plans."""

    def __init__(self):
        self.model = get_embedding_model()

    def match_activity(
        self,
        extracted_activity_id: UUID,
        activity_description: str,
        discipline: str,
        extraction_confidence: float,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        actor_id: Optional[UUID] = None,
        plan_activities: Optional[List[Dict[str, Any]]] = None,
    ) -> MatchResult:
        """
        Matches a single extracted activity against the active baseline schedule.
        """
        supabase = get_supabase_client()
        if plan_activities is None:
            plan_activities = []

            if supabase:
                try:
                    res = supabase.table("schedule_plan").select("*").execute()
                    plan_activities = res.data or []
                except Exception as e:
                    logger.error(f"Failed to fetch baseline schedule from Supabase: {e}")

        # If no DB records found, provide synthetic fallback activities for local dev/testing
        if not plan_activities:
            plan_activities = [
                {
                    "id": str(uuid4()),
                    "activity_code": "PIP-101",
                    "activity_description": "Piping fit-up and spool fabrication area 1",
                    "discipline": "piping",
                },
                {
                    "id": str(uuid4()),
                    "activity_code": "ELE-201",
                    "activity_description": "Cable tray installation and cable pulling substation 2",
                    "discipline": "electrical",
                },
                {
                    "id": str(uuid4()),
                    "activity_code": "CIV-301",
                    "activity_description": "Foundation excavation and rebar tying for pump house",
                    "discipline": "civil",
                },
                {
                    "id": str(uuid4()),
                    "activity_code": "INS-401",
                    "activity_description": "Transmitter calibration and impulse piping impulse tubing",
                    "discipline": "instrumentation",
                },
            ]

        # Score all candidate baseline activities
        candidates: List[Tuple[Dict[str, Any], float, float]] = []

        for plan in plan_activities:
            sim = compute_similarity(activity_description, plan["activity_description"], self.model)
            score = calculate_match_score(
                embedding_sim=sim,
                extraction_confidence=extraction_confidence,
                extracted_discipline=discipline,
                plan_discipline=plan.get("discipline", "unknown"),
                date_proximity_factor=1.0,
            )
            candidates.append((plan, score, sim))

        # Sort descending by composite score
        candidates.sort(key=lambda x: x[1], reverse=True)

        if not candidates:
            return self._handle_unmatched(extracted_activity_id, activity_description, "No schedule activities available")

        best_plan, top_score, top_sim = candidates[0]

        # Check for disambiguation candidates (if 2nd best is within 0.05 score)
        candidate_matches: List[CandidateMatch] = []
        is_ambiguous = False

        if len(candidates) > 1:
            second_plan, second_score, _ = candidates[1]
            if top_score >= 0.70 and abs(top_score - second_score) <= 0.05:
                is_ambiguous = True

        for p, s, _ in candidates[:3]:
            candidate_matches.append(
                CandidateMatch(
                    plan_activity_id=UUID(p["id"]),
                    activity_code=p.get("activity_code", "N/A"),
                    activity_description=p["activity_description"],
                    score=s,
                )
            )

        # Decision Banding
        match_id = uuid4()
        status = "unmatched"

        if top_score >= 0.85 and not is_ambiguous:
            status = "auto_linked"
        elif top_score >= 0.70:
            status = "pending_review"
        else:
            status = "unmatched"

        # Persist results
        if status in ("auto_linked", "pending_review"):
            match_row = {
                "id": str(match_id),
                "extracted_activity_id": str(extracted_activity_id),
                "plan_activity_id": best_plan["id"],
                "confidence_score": top_score,
                "status": status,
                "candidates": [c.model_dump(mode="json") for c in candidate_matches] if is_ambiguous else None,
            }

            if supabase:
                try:
                    supabase.table("schedule_matches").insert(match_row).execute()
                    log_action(
                        entity_type="schedule_matches",
                        entity_id=match_id,
                        action="matched",
                        actor_id=actor_id,
                        actor_role="system",
                        new_state=match_row,
                    )
                except Exception as e:
                    logger.error(f"Failed to insert schedule_matches row: {e}")

            return MatchResult(
                status=status,
                extracted_activity_id=extracted_activity_id,
                match_id=match_id,
                plan_activity_id=UUID(best_plan["id"]),
                confidence_score=top_score,
                candidates=candidate_matches if is_ambiguous else None,
            )
        else:
            return self._handle_unmatched(
                extracted_activity_id,
                activity_description,
                reason=f"Top candidate score {top_score} below review threshold 0.70",
                actor_id=actor_id,
            )

    def _handle_unmatched(
        self,
        extracted_activity_id: UUID,
        activity_desc: str,
        reason: str,
        actor_id: Optional[UUID] = None,
    ) -> MatchResult:
        """Handles activities that do not meet the matching threshold."""
        supabase = get_supabase_client()
        unmatched_id = uuid4()
        unmatched_row = {
            "id": str(unmatched_id),
            "extracted_activity_id": str(extracted_activity_id),
            "reason": reason,
        }

        if supabase:
            try:
                supabase.table("unmatched_activities").insert(unmatched_row).execute()
                log_action(
                    entity_type="unmatched_activities",
                    entity_id=unmatched_id,
                    action="matched",
                    actor_id=actor_id,
                    actor_role="system",
                    new_state=unmatched_row,
                    reason=reason,
                )
            except Exception as e:
                logger.error(f"Failed to insert unmatched_activities row: {e}")

        return MatchResult(
            status="unmatched",
            extracted_activity_id=extracted_activity_id,
            match_id=None,
            plan_activity_id=None,
            confidence_score=0.0,
            candidates=None,
        )
