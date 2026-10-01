"""
Filesystem safety helpers.

Upload filenames arrive from untrusted clients. The original code built local
paths as `data/uploads/{extraction_id}_{filename}` with the raw filename, so a
name like `../../evil.txt` escaped the upload directory. Everything that touches
a user-supplied filename must go through `sanitize_filename` /
`safe_upload_filename`.
"""

import re
import unicodedata
from pathlib import Path
from typing import Optional
from uuid import UUID

# Windows reserved device names — rejected regardless of extension.
_RESERVED_NAMES = {
    "con", "prn", "aux", "nul",
    *(f"com{i}" for i in range(1, 10)),
    *(f"lpt{i}" for i in range(1, 10)),
}

_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")
_REPEATED_DOTS = re.compile(r"\.{2,}")

MAX_FILENAME_LENGTH = 120
DEFAULT_FILENAME = "report.txt"


def sanitize_filename(filename: Optional[str], default: str = DEFAULT_FILENAME) -> str:
    """
    Reduce an arbitrary client-supplied filename to a single safe path segment.

    Guarantees the result:
      - contains no directory separators and no parent references
      - contains only [A-Za-z0-9._-]
      - is non-empty and not a Windows reserved device name
      - is at most MAX_FILENAME_LENGTH characters
    """
    if not filename:
        return default

    # Normalise unicode look-alikes before stripping.
    candidate = unicodedata.normalize("NFKD", str(filename))

    # Take the last path segment for both POSIX and Windows separators. Using
    # PurePath alone is insufficient because a POSIX host does not treat "\" as
    # a separator, and vice versa.
    candidate = candidate.replace("\\", "/").split("/")[-1]

    # Drop NUL and control characters.
    candidate = "".join(ch for ch in candidate if ch.isprintable() and ch != "\x00")

    # Collapse anything outside the allow-list.
    candidate = _UNSAFE_CHARS.sub("_", candidate)

    # Collapse ".." sequences so no parent reference can survive.
    candidate = _REPEATED_DOTS.sub(".", candidate).strip("._-")

    if not candidate:
        return default

    stem, dot, suffix = candidate.rpartition(".")
    base = stem if dot else candidate
    if base.lower() in _RESERVED_NAMES:
        candidate = f"file_{candidate}"

    if len(candidate) > MAX_FILENAME_LENGTH:
        stem, dot, suffix = candidate.rpartition(".")
        if dot and len(suffix) <= 10:
            keep = MAX_FILENAME_LENGTH - len(suffix) - 1
            candidate = f"{stem[:keep]}.{suffix}"
        else:
            candidate = candidate[:MAX_FILENAME_LENGTH]

    return candidate or default


def safe_upload_filename(extraction_id: UUID, filename: Optional[str]) -> str:
    """Build the canonical `<extraction_id>_<safe name>` local cache filename."""
    return f"{extraction_id}_{sanitize_filename(filename)}"


def safe_storage_path(prefix: str, extraction_id: UUID, filename: Optional[str]) -> str:
    """Build a sanitized object-storage key, e.g. `raw_reports/<id>_<name>`."""
    clean_prefix = prefix.strip("/")
    return f"{clean_prefix}/{safe_upload_filename(extraction_id, filename)}"


def resolve_within(base_dir: Path, filename: str) -> Path:
    """
    Resolve `filename` inside `base_dir`, raising ValueError if it escapes.

    Defence in depth: even with a sanitized name, the final path is verified to
    stay within the intended directory before any I/O happens.
    """
    base_resolved = base_dir.resolve()
    target = (base_resolved / filename).resolve()

    if target != base_resolved and base_resolved not in target.parents:
        raise ValueError(
            f"Resolved path escapes the permitted directory: {filename!r}"
        )

    return target
