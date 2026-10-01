import pytest
from fastapi import HTTPException, Request

from backend.auth.rate_limiter import InMemoryRateLimiter


def make_request(host: str = "127.0.0.1") -> Request:
    return Request({
        "type": "http",
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/",
        "raw_path": b"/",
        "query_string": b"",
        "headers": [],
        "client": (host, 12345),
        "server": ("test", 80),
    })


def test_authenticated_requests_are_limited_per_user(monkeypatch):
    limiter = InMemoryRateLimiter()
    monkeypatch.setenv("TEST_RATE_LIMIT", "1/minute")

    limiter.check(make_request(), "upload", "TEST_RATE_LIMIT", user_id="user-a")
    with pytest.raises(HTTPException) as exc_info:
        limiter.check(make_request(), "upload", "TEST_RATE_LIMIT", user_id="user-a")

    assert exc_info.value.status_code == 429
    limiter.check(make_request(), "upload", "TEST_RATE_LIMIT", user_id="user-b")


def test_old_buckets_are_evicted_during_cleanup(monkeypatch):
    import backend.auth.rate_limiter as rate_limiter_module

    limiter = InMemoryRateLimiter()
    limiter._records["upload:user:user-old"] = [0.0]
    limiter._next_cleanup = 0.0
    monkeypatch.setattr(rate_limiter_module.time, "monotonic", lambda: 100000.0)
    monkeypatch.setenv("TEST_RATE_LIMIT", "10/minute")

    limiter.check(make_request(), "upload", "TEST_RATE_LIMIT", user_id="user-new")

    assert "upload:user:user-old" not in limiter._records
    assert "upload:user:user-new" in limiter._records
