"""
Matching Engine Service for OnGround IPIS.
Uses sentence-transformers (all-MiniLM-L6-v2) for semantic embeddings,
combines with discipline and date proximity heuristics, determines confidence bands,
and performs candidate disambiguation.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4
from datetime import datetime

from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read, execute_write
from backend.models.schemas import CandidateMatch, MatchResult
from backend.services.audit_service import log_action
from backend.services.notification_service import notify_pending_review, notify_unmatched

logger = logging.getLogger("onground.matching")

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
import hashlib
import threading
from collections import OrderedDict
from datetime import date, datetime

MAX_EMBEDDING_CACHE_SIZE = 5000


class EmbeddingCache:
    """Thread-safe bounded LRU cache for dense text embeddings."""

    def __init__(self, max_size: int = MAX_EMBEDDING_CACHE_SIZE):
        self.max_size = max_size
        self._cache: OrderedDict[str, List[float]] = OrderedDict()
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    @staticmethod
    def create_key(activity_id: Optional[str], text: str) -> str:
        """
        Build a deterministic cache key from the *text only*.

        An embedding is a pure function of its input text, so including
        activity_id in the key meant the same description encoded under two
        different ids produced two entries and the cache effectively never hit
        across records. `activity_id` is retained in the signature for call-site
        compatibility but deliberately does not participate in the key.
        """
        norm_text = " ".join((text or "").strip().lower().split())
        text_hash = hashlib.sha256(norm_text.encode("utf-8")).hexdigest()
        return f"emb:{text_hash}"

    def get(self, key: str) -> Optional[List[float]]:
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
                self._hits += 1
                return self._cache[key]
            self._misses += 1
            return None

    def put(self, key: str, embedding: List[float]) -> None:
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
                self._cache[key] = embedding
            else:
                self._cache[key] = embedding
                if len(self._cache) > self.max_size:
                    self._cache.popitem(last=False)  # Evict oldest LRU entry

    def size(self) -> int:
        with self._lock:
            return len(self._cache)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0

    def stats(self) -> Dict[str, int]:
        with self._lock:
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "hits": self._hits,
                "misses": self._misses,
            }


_embedding_cache = EmbeddingCache()


def get_embedding_cache() -> EmbeddingCache:
    """Returns the global embedding cache instance."""
    return _embedding_cache


def clear_embedding_cache() -> None:
    """Clears the global embedding cache (useful for test isolation)."""
    _embedding_cache.clear()


def compute_vector_similarity(emb1: List[float], emb2: List[float]) -> float:
    """Computes cosine similarity directly between two precomputed dense vector embeddings."""
    if not emb1 or not emb2:
        return 0.0
    try:
        import numpy as np
        a = np.array(emb1, dtype=np.float32)
        b = np.array(emb2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        cos_sim = float(np.dot(a, b) / (norm_a * norm_b))
    except ImportError:
        dot = sum(x * y for x, y in zip(emb1, emb2))
        norm_a = math.sqrt(sum(x * x for x in emb1))
        norm_b = math.sqrt(sum(y * y for y in emb2))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        cos_sim = float(dot / (norm_a * norm_b))
    return max(0.0, min(1.0, round(cos_sim, 4)))


def get_or_encode_embedding(
    text: str,
    activity_id: Optional[str] = None,
    model: Any = None,
    cache: Optional[EmbeddingCache] = None,
) -> Optional[List[float]]:
    """
    Retrieves embedding from cache or computes it with SentenceTransformer.
    Returns None if model is unavailable or in fallback mode.
    """
    if model is None or model == "fallback":
        return None

    c = cache or _embedding_cache
    cache_key = c.create_key(activity_id, text)
    cached_emb = c.get(cache_key)
    if cached_emb is not None:
        return cached_emb

    # Compute embedding outside the cache lock to allow concurrent readers
    try:
        raw_emb = model.encode(text)
        emb_list = [float(x) for x in list(raw_emb)]
        c.put(cache_key, emb_list)
        return emb_list
    except Exception as e:
        logger.error(f"Error encoding embedding for text '{text[:40]}...': {e}")
        return None


def _normalize_to_date(val: Any) -> Optional[date]:
    """Safely normalizes date, datetime, or date-like strings to a datetime.date object."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        val_str = val.strip()
        if not val_str:
            return None
        # Fast path for ISO date prefixes (YYYY-MM-DD)
        if len(val_str) >= 10 and val_str[4] == '-' and val_str[7] == '-':
            try:
                return datetime.strptime(val_str[:10], "%Y-%m-%d").date()
            except ValueError:
                pass
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%m/%d/%Y"):
            try:
                return datetime.strptime(val_str, fmt).date()
            except ValueError:
                continue
        try:
            import dateparser
            parsed = dateparser.parse(val_str)
            if parsed:
                return parsed.date()
        except Exception:
            pass
    return None


def calculate_date_proximity(
    extracted_start: Any = None,
    extracted_end: Any = None,
    plan_start: Any = None,
    plan_end: Any = None,
) -> float:
    """
    Computes normalized temporal proximity [0.0, 1.0] between extracted activity dates
    and baseline schedule planned date window.

    Semantics:
    - Neutral baseline (1.0) when either range is completely missing (non-punitive).
    - 1.0 if windows overlap or occur on the exact same date.
    - Smooth exponential decay exp(-gap_days / 30.0) for disjoint dates.
    - Clamped strictly within [0.0, 1.0].
    """
    e_start = _normalize_to_date(extracted_start)
    e_end = _normalize_to_date(extracted_end)
    p_start = _normalize_to_date(plan_start)
    p_end = _normalize_to_date(plan_end)

    # If extracted dates or planned dates are missing entirely, return neutral 1.0
    if (e_start is None and e_end is None) or (p_start is None and p_end is None):
        return 1.0

    # Fill single-sided bounds
    if e_start is None:
        e_start = e_end
    if e_end is None:
        e_end = e_start
    if p_start is None:
        p_start = p_end
    if p_end is None:
        p_end = p_start

    # Handle reversed / inverted ranges safely
    if e_start > e_end:
        e_start, e_end = e_end, e_start
    if p_start > p_end:
        p_start, p_end = p_end, p_start

    # Overlap check
    if max(e_start, p_start) <= min(e_end, p_end):
        return 1.0

    # Calculate gap in days
    if e_end < p_start:
        gap_days = (p_start - e_end).days
    else:
        gap_days = (e_start - p_end).days

    if gap_days <= 0:
        return 1.0

    # Exponential decay over 30-day half-decay scale
    proximity = math.exp(-float(gap_days) / 30.0)
    return max(0.0, min(1.0, round(proximity, 4)))


def compute_similarity(text1: str, text2: str, model=None) -> float:
    """Computes cosine similarity between two activity descriptions (backward compatible)."""
    if model is None or model == "fallback":
        # Fallback word-overlap Jaccard/Dice similarity for quick local testing without heavy model weights
        s1 = set(text1.lower().split())
        s2 = set(text2.lower().split())
        if not s1 or not s2:
            return 0.0
        intersection = len(s1.intersection(s2))
        return round(float(2 * intersection / (len(s1) + len(s2))), 4)

    emb1 = get_or_encode_embedding(text1, model=model)
    emb2 = get_or_encode_embedding(text2, model=model)
    if emb1 is not None and emb2 is not None:
        return compute_vector_similarity(emb1, emb2)

    s1 = set(text1.lower().split())
    s2 = set(text2.lower().split())
    if not s1 or not s2:
        return 0.0
    intersection = len(s1.intersection(s2))
    return round(float(2 * intersection / (len(s1) + len(s2))), 4)


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

    Disciplines may legitimately be NULL in the database, so both sides are
    coerced to a string before comparison.
    """
    extracted_norm = (extracted_discipline or "unknown").strip().lower()
    plan_norm = (plan_discipline or "unknown").strip().lower()

    discipline_penalty = 0.0
    if (
        extracted_norm
        and plan_norm
        and extracted_norm != "unknown"
        and plan_norm != "unknown"
        and extracted_norm != plan_norm
    ):
        discipline_penalty = 0.15

    composite = (0.70 * embedding_sim) + (0.20 * extraction_confidence) + (0.10 * date_proximity_factor) - discipline_penalty
    return max(0.0, min(1.0, round(composite, 4)))


class MatchingService:
    """Service matching extracted activities to baseline schedule plans."""

    def __init__(self):
        self.model = get_embedding_model()

    @staticmethod
    def _load_reviewed_match(supabase, extracted_activity_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Return a schedule_match row if it has already been reviewed (confirmed or
        rejected). These statuses must not be overwritten by a subsequent matcher run.
        """
        if not supabase:
            return None
        try:
            rows = execute_read(
                supabase.table("schedule_matches")
                .select("id, status, plan_activity_id, confidence_score")
                .eq("extracted_activity_id", str(extracted_activity_id))
                .in_("status", ["confirmed", "rejected"]),
                table="schedule_matches",
                operation="match.load_reviewed",
            )
        except PersistenceError as exc:
            logger.warning("Could not load reviewed match status: %s", exc)
            return None
        return rows[0] if rows else None

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
        project_id: Optional[UUID] = None,
    ) -> MatchResult:
        """
        Match a single extracted activity against the project's baseline schedule.

        The candidate set comes only from real `schedule_plan` rows belonging to
        `project_id`. An earlier revision fabricated four synthetic plan
        activities with fresh uuid4() ids whenever the schedule was empty; those
        ids existed nowhere in the database, so every resulting
        `schedule_matches` insert violated the plan_activity_id foreign key and
        was then silently swallowed.
        """
        supabase = get_supabase_client()

        # A planner decision is final. `schedule_matches.extracted_activity_id` is
        # UNIQUE, so the upsert below would otherwise quietly reset a confirmed or
        # rejected row back to auto_linked/pending_review on every re-run.
        reviewed = self._load_reviewed_match(supabase, extracted_activity_id)
        if reviewed:
            logger.info(
                "Skipping re-match for activity %s: already %s by review.",
                extracted_activity_id,
                reviewed.get("status"),
            )
            plan_act_id = reviewed.get("plan_activity_id")
            return MatchResult(
                status=reviewed["status"],
                extracted_activity_id=extracted_activity_id,
                match_id=UUID(str(reviewed["id"])),
                plan_activity_id=UUID(str(plan_act_id)) if plan_act_id else None,
                confidence_score=reviewed.get("confidence_score"),
            )

        if plan_activities is None:
            plan_activities = []

            if supabase:
                query = supabase.table("schedule_plan").select("*")
                if project_id:
                    query = query.eq("project_id", str(project_id))
                try:
                    plan_activities = execute_read(
                        query,
                        table="schedule_plan",
                        operation="match.load_plan",
                    )
                except PersistenceError as exc:
                    logger.error("Failed to fetch baseline schedule: %s", exc)
                    raise

        # An empty baseline is a real, reportable condition — not a cue to invent data.
        if not plan_activities:
            return self._handle_unmatched(
                extracted_activity_id,
                activity_description,
                reason="No planned activities exist for this project. Import a schedule first.",
                best_score=0.0,
                actor_id=actor_id,
                project_id=project_id,
            )

        # 1. Pre-encode extracted activity description ONCE before candidate loop
        extracted_emb = None
        if self.model is not None and self.model != "fallback":
            extracted_emb = get_or_encode_embedding(
                text=activity_description,
                activity_id=str(extracted_activity_id),
                model=self.model,
            )

        # 2. Score all candidate baseline activities
        candidates: List[Tuple[Dict[str, Any], float, float]] = []

        for plan in plan_activities:
            plan_desc = plan.get("activity_description")
            plan_id_raw = plan.get("id")

            # Skip malformed rows rather than raising KeyError/ValueError mid-loop.
            if not plan_desc or not plan_id_raw:
                logger.warning(
                    "Skipping malformed schedule_plan row (missing id or description): %s",
                    {k: plan.get(k) for k in ("id", "activity_code")},
                )
                continue
            try:
                UUID(str(plan_id_raw))
            except (ValueError, TypeError):
                logger.warning("Skipping schedule_plan row with non-UUID id: %r", plan_id_raw)
                continue

            plan_id = str(plan_id_raw)

            if extracted_emb is not None:
                plan_emb = get_or_encode_embedding(
                    text=plan_desc,
                    activity_id=plan_id,
                    model=self.model,
                )
                if plan_emb is not None:
                    sim = compute_vector_similarity(extracted_emb, plan_emb)
                else:
                    sim = compute_similarity(activity_description, plan_desc, model="fallback")
            else:
                sim = compute_similarity(activity_description, plan_desc, model=self.model)

            date_prox = calculate_date_proximity(
                extracted_start=start_time,
                extracted_end=end_time,
                plan_start=plan.get("planned_start"),
                plan_end=plan.get("planned_end"),
            )
            score = calculate_match_score(
                embedding_sim=sim,
                extraction_confidence=extraction_confidence,
                extracted_discipline=discipline,
                plan_discipline=plan.get("discipline"),
                date_proximity_factor=date_prox,
            )
            candidates.append((plan, score, sim))

        # Sort descending by composite score
        candidates.sort(key=lambda x: x[1], reverse=True)

        if not candidates:
            return self._handle_unmatched(
                extracted_activity_id,
                activity_description,
                reason="No usable schedule activities available",
                best_score=0.0,
                actor_id=actor_id,
                project_id=project_id,
            )

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
                    plan_activity_id=UUID(str(p["id"])),
                    activity_code=p.get("activity_code") or "N/A",
                    activity_description=p["activity_description"],
                    score=s,
                )
            )

        # Decision Banding
        match_id = uuid4()

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
                "plan_activity_id": str(best_plan["id"]),
                "confidence_score": top_score,
                "status": status,
                "candidates": [c.model_dump(mode="json") for c in candidate_matches] if is_ambiguous else None,
            }

            if supabase:
                # extracted_activity_id is UNIQUE: re-running the matcher for the
                # same activity must update the existing row, not raise a
                # duplicate-key error that then gets swallowed.
                rows = execute_write(
                    supabase.table("schedule_matches").upsert(
                        match_row, on_conflict="extracted_activity_id"
                    ),
                    table="schedule_matches",
                    operation=f"match.persist_{status}",
                )
                if rows and rows[0].get("id"):
                    match_id = UUID(str(rows[0]["id"]))

                log_action(
                    entity_type="schedule_matches",
                    entity_id=match_id,
                    action="auto_linked" if status == "auto_linked" else "flagged",
                    project_id=project_id,
                    actor_id=actor_id,
                    actor_role="system",
                    new_state=match_row,
                    confidence_score=top_score,
                )

                if status == "pending_review" and project_id:
                    notify_pending_review(
                        project_id=project_id,
                        match_id=match_id,
                        activity_description=activity_description,
                        confidence=top_score,
                    )

            return MatchResult(
                status=status,
                extracted_activity_id=extracted_activity_id,
                match_id=match_id,
                plan_activity_id=UUID(str(best_plan["id"])),
                confidence_score=top_score,
                candidates=candidate_matches if is_ambiguous else None,
            )
        else:
            return self._handle_unmatched(
                extracted_activity_id,
                activity_description,
                reason=f"Top candidate score {top_score} below review threshold 0.70",
                best_score=top_score,
                actor_id=actor_id,
                project_id=project_id,
            )

    def _handle_unmatched(
        self,
        extracted_activity_id: UUID,
        activity_desc: str,
        reason: str,
        best_score: float = 0.0,
        actor_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
    ) -> MatchResult:
        """
        Record an activity that does not meet the matching threshold.

        Writes both `best_score` and `reason`. The previous implementation wrote
        only `reason`, which did not exist as a column, so every insert failed and
        the error was logged and discarded.
        """
        supabase = get_supabase_client()
        unmatched_id = uuid4()
        unmatched_row = {
            "id": str(unmatched_id),
            "extracted_activity_id": str(extracted_activity_id),
            "best_score": best_score,
            "reason": reason,
            "resolution": "unresolved",
        }

        if supabase:
            # extracted_activity_id is UNIQUE here too.
            rows = execute_write(
                supabase.table("unmatched_activities").upsert(
                    unmatched_row, on_conflict="extracted_activity_id"
                ),
                table="unmatched_activities",
                operation="match.persist_unmatched",
            )
            if rows and rows[0].get("id"):
                unmatched_id = UUID(str(rows[0]["id"]))

            log_action(
                entity_type="unmatched_activities",
                entity_id=unmatched_id,
                action="flagged",
                project_id=project_id,
                actor_id=actor_id,
                actor_role="system",
                new_state=unmatched_row,
                reason=reason,
                confidence_score=best_score,
            )

            if project_id:
                notify_unmatched(
                    project_id=project_id,
                    extracted_activity_id=extracted_activity_id,
                    activity_description=activity_desc,
                    reason=reason,
                )

        return MatchResult(
            status="unmatched",
            extracted_activity_id=extracted_activity_id,
            match_id=None,
            plan_activity_id=None,
            confidence_score=best_score,
            candidates=None,
        )
