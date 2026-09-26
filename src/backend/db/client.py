"""Supabase DB Client Initialization for Backend Data Access Layer."""

from typing import Any

from src.backend.settings import settings

try:
    from supabase import create_client  # type: ignore[attr-defined]
except ImportError:
    try:
        from supabase._sync.client import (  # type: ignore[attr-defined,no-redef]
            create_client,
        )
    except ImportError:
        from supabase.client import (  # type: ignore[attr-defined,no-redef]
            create_client,
        )

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
