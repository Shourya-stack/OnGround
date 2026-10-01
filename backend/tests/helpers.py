"""
Shared test helpers.

`fake_db` returns a chainable stub that stands in for a Supabase client without
touching a real database. Several route tests previously patched only
`backend.auth.security.get_supabase_client` and left the route module's own
client unpatched, so they silently issued live queries against the configured
Supabase project and passed only because the real tables happened to be empty.
"""

from types import SimpleNamespace
from typing import Any, Dict, List, Optional


class _QueryStub:
    """
    Chainable no-op query builder.

    Any attribute access or call returns the same stub, so arbitrary PostgREST
    chains (`.table(...).select(...).eq(...).order(...).range(...)`) work without
    per-test configuration. `execute()` yields the configured rows.
    """

    def __init__(self, rows: List[Dict[str, Any]], table_rows: Optional[Dict[str, List[Dict[str, Any]]]] = None):
        self._rows = rows
        self._table_rows = table_rows or {}
        self._current = rows

    # --- chain plumbing -----------------------------------------------------
    def table(self, name: str) -> "_QueryStub":
        stub = _QueryStub(self._rows, self._table_rows)
        stub._current = self._table_rows.get(name, self._rows)
        return stub

    def __getattr__(self, _name: str) -> "_QueryStub":
        return self

    def __call__(self, *_args: Any, **_kwargs: Any) -> "_QueryStub":
        return self

    # --- terminal -----------------------------------------------------------
    def execute(self) -> SimpleNamespace:
        return SimpleNamespace(data=list(self._current), count=len(self._current))


class FakeSupabase:
    """Minimal stand-in exposing the attributes the routes actually use."""

    def __init__(
        self,
        rows: Optional[List[Dict[str, Any]]] = None,
        table_rows: Optional[Dict[str, List[Dict[str, Any]]]] = None,
    ):
        self._rows = rows if rows is not None else []
        self._table_rows = table_rows or {}
        self.storage = _QueryStub([], {})
        self.auth = _QueryStub([], {})

    def table(self, name: str) -> _QueryStub:
        stub = _QueryStub(self._rows, self._table_rows)
        stub._current = self._table_rows.get(name, self._rows)
        return stub


def fake_db(
    rows: Optional[List[Dict[str, Any]]] = None,
    table_rows: Optional[Dict[str, List[Dict[str, Any]]]] = None,
) -> FakeSupabase:
    """
    Build a fake Supabase client.

    Args:
        rows: default rows returned by any table not named in `table_rows`.
        table_rows: per-table row overrides, e.g. {"schedule_matches": [...]}.
    """
    return FakeSupabase(rows=rows, table_rows=table_rows)
