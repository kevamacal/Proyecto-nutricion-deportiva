"""Supabase DB Client Initialization for Backend Data Access Layer."""

from src.backend.settings import settings
from supabase import Client, create_client

_client: Client | None = None


def get_supabase_client() -> Client:
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
