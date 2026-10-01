"""
Persistence error handling for OnGround backend.

WHY THIS EXISTS
---------------
The original code base swallowed every database failure:

    try:
        supabase.table("x").insert(payload).execute()
    except Exception as e:
        logger.error(...)
    # ...and then returned HTTP 200 anyway

That turned real failures (constraint violations, missing columns, FK errors)
into silent no-ops while the API reported success. Three separate production
bugs were invisible because of it. Every write path now routes through the
helpers below so a failed write becomes a real error response.
"""

import logging
from typing import Any, Dict, List, Optional, Sequence

logger = logging.getLogger("onground.db.errors")


class PersistenceError(RuntimeError):
    """
    Raised when a database write does not verifiably succeed.

    Carries enough structured context to build an HTTP response without leaking
    connection strings, keys, or raw driver internals to the client.
    """

    def __init__(
        self,
        message: str,
        *,
        table: Optional[str] = None,
        operation: Optional[str] = None,
        cause: Optional[BaseException] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.table = table
        self.operation = operation
        self.cause = cause

    def __str__(self) -> str:  # pragma: no cover - trivial
        parts = [self.message]
        if self.table:
            parts.append(f"table={self.table}")
        if self.operation:
            parts.append(f"operation={self.operation}")
        return " | ".join(parts)

    @property
    def public_detail(self) -> str:
        """Client-safe description."""
        target = f" while writing to '{self.table}'" if self.table else ""
        return f"Database operation failed{target}: {self.message}"


class DatabaseUnavailableError(PersistenceError):
    """Raised when the Supabase client is not configured at all."""

    def __init__(self, operation: Optional[str] = None) -> None:
        super().__init__(
            "Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.",
            operation=operation,
        )


class DuplicateRecordError(PersistenceError):
    """Raised when a write violates a UNIQUE constraint."""


class ForeignKeyViolationError(PersistenceError):
    """Raised when a write references a row that does not exist."""


# Postgres error-code fragments that surface through PostgREST/supabase-py as
# substrings of the exception message.
_UNIQUE_MARKERS = ("23505", "duplicate key", "already exists")
_FK_MARKERS = ("23503", "violates foreign key", "is not present in table")
_UNDEFINED_COLUMN_MARKERS = ("42703", "could not find", "column", "schema cache")
_CHECK_MARKERS = ("23514", "violates check constraint")


def classify_db_exception(
    exc: BaseException,
    *,
    table: Optional[str] = None,
    operation: Optional[str] = None,
) -> PersistenceError:
    """
    Convert a driver exception into a typed PersistenceError.

    Keeps the original exception as `cause` so logs retain full detail while the
    HTTP layer only exposes `public_detail`.
    """
    raw = str(exc).lower()

    if any(marker in raw for marker in _UNIQUE_MARKERS):
        return DuplicateRecordError(
            "A record with these identifying values already exists.",
            table=table,
            operation=operation,
            cause=exc,
        )

    if any(marker in raw for marker in _FK_MARKERS):
        return ForeignKeyViolationError(
            "A referenced record does not exist.",
            table=table,
            operation=operation,
            cause=exc,
        )

    if any(marker in raw for marker in _CHECK_MARKERS):
        return PersistenceError(
            "A value violates a database check constraint.",
            table=table,
            operation=operation,
            cause=exc,
        )

    # Schema drift (e.g. writing a column that does not exist) must be loud —
    # this class of bug previously passed as HTTP 200.
    if all(marker in raw for marker in ("column", "does not exist")) or (
        "schema cache" in raw and "could not find" in raw
    ):
        return PersistenceError(
            "Schema mismatch: the write referenced a column that does not exist. "
            "A database migration is likely pending.",
            table=table,
            operation=operation,
            cause=exc,
        )

    return PersistenceError(
        "Unexpected database error.",
        table=table,
        operation=operation,
        cause=exc,
    )


def require_client(client: Any, operation: str) -> Any:
    """Return the client or raise DatabaseUnavailableError."""
    if client is None:
        raise DatabaseUnavailableError(operation=operation)
    return client


def execute_write(
    query: Any,
    *,
    table: str,
    operation: str,
    expect_rows: bool = True,
) -> List[Dict[str, Any]]:
    """
    Execute a Supabase write and verify it actually persisted.

    Args:
        query: A built supabase-py query (insert/update/upsert/delete).
        table: Table name, for error context.
        operation: Human-readable operation label, for error context.
        expect_rows: When True, an empty `data` payload is treated as a failure.
                     PostgREST returns the affected rows for writes, so an empty
                     result means nothing matched or RLS blocked the write.

    Returns:
        The list of affected rows.

    Raises:
        PersistenceError: on driver exception or unverifiable write.
    """
    try:
        response = query.execute()
    except Exception as exc:  # noqa: BLE001 - re-raised as typed error below
        error = classify_db_exception(exc, table=table, operation=operation)
        logger.error(
            "DB write failed: operation=%s table=%s error=%s cause=%s",
            operation,
            table,
            error.message,
            exc,
        )
        raise error from exc

    data = getattr(response, "data", None)

    # NOTE: supabase-py v2 (postgrest APIResponse) exposes only `data` and
    # `count`; failures are raised as APIError and handled above. We deliberately
    # do NOT probe a `response.error` attribute here — it does not exist on v2
    # and duck-typing it produces false failures on mock objects.

    if expect_rows and not data:
        error = PersistenceError(
            "Write did not affect any rows. The target record may not exist, "
            "or a row-level security policy rejected the operation.",
            table=table,
            operation=operation,
        )
        logger.error("DB write affected 0 rows: operation=%s table=%s", operation, table)
        raise error

    return list(data or [])


def execute_read(
    query: Any,
    *,
    table: str,
    operation: str,
) -> List[Dict[str, Any]]:
    """
    Execute a Supabase read. Raises PersistenceError on driver failure.

    An empty result set is valid for reads and returns [].
    """
    try:
        response = query.execute()
    except Exception as exc:  # noqa: BLE001
        error = classify_db_exception(exc, table=table, operation=operation)
        logger.error(
            "DB read failed: operation=%s table=%s error=%s cause=%s",
            operation,
            table,
            error.message,
            exc,
        )
        raise error from exc

    return list(getattr(response, "data", None) or [])


def execute_count(
    query: Any,
    *,
    table: str,
    operation: str,
) -> int:
    """
    Execute a `select(..., count="exact")` query and return the total count.

    Using the server-side count avoids the silent 1000-row PostgREST cap that
    made analytics totals under-report.
    """
    try:
        response = query.execute()
    except Exception as exc:  # noqa: BLE001
        error = classify_db_exception(exc, table=table, operation=operation)
        logger.error(
            "DB count failed: operation=%s table=%s error=%s cause=%s",
            operation,
            table,
            error.message,
            exc,
        )
        raise error from exc

    count = getattr(response, "count", None)
    if count is None:
        # Fall back to the length of the returned payload.
        return len(getattr(response, "data", None) or [])
    return int(count)


def first_row(rows: Sequence[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Return the first row or None."""
    return rows[0] if rows else None
