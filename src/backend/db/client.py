"""Supabase DB Client Initialization for Backend Data Access Layer."""

import os
import sys
from typing import Any

from src.backend.settings import settings

# Temporarily isolate sys.path from local working directory '.' to prevent
# root ./supabase/ directory (database migrations) from shadowing the installed
# third-party 'supabase' Python package in site-packages.
_orig_path = list(sys.path)
try:
    _cwd = os.getcwd()
    sys.path = [p for p in sys.path if p != _cwd and p != "." and p != ""]
    from supabase import create_client  # type: ignore[attr-defined]
finally:
    sys.path = _orig_path

_client: Any = None


def get_supabase_client() -> Any:
    """Return singleton Supabase client instance using backend settings credentials."""
    global _client
    if _client is None:
        url = settings.supabase_url or "https://placeholder.supabase.co"
        key = (
            settings.supabase_service_role_key
            or settings.supabase_anon_key
            or "placeholder_key"
        )
        _client = create_client(url, key)
    return _client
