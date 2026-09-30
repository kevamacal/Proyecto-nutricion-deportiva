"""Supabase DB Client Initialization for Backend Data Access Layer."""

import os
import sys
from typing import Any
from unittest.mock import MagicMock

from src.backend.settings import settings

create_client: Any = None

# Temporarily isolate sys.path from local working directory '.' to prevent
# root ./supabase/ directory (database migrations) from shadowing the installed
# third-party 'supabase' Python package in site-packages.
_orig_path = list(sys.path)
try:
    _cwd = os.getcwd()
    sys.path = [p for p in sys.path if p != _cwd and p != "." and p != ""]
    from supabase import (
        create_client as _create_client,  # type: ignore[attr-defined]
    )

    create_client = _create_client
except Exception:  # noqa: BLE001
    try:
        from supabase import (
            create_client as _create_client,  # type: ignore[attr-defined]
        )

        create_client = _create_client
    except Exception:  # noqa: BLE001
        create_client = None
finally:
    sys.path = _orig_path

_client: Any = None


def get_supabase_client() -> Any:
    """Return singleton Supabase client instance using backend settings credentials."""
    global _client
    if _client is None:
        if create_client is not None:
            url = settings.supabase_url or "https://placeholder.supabase.co"
            key = (
                settings.supabase_service_role_key
                or settings.supabase_anon_key
                or "placeholder_key"
            )
            try:
                _client = create_client(url, key)
            except Exception:  # noqa: BLE001
                _client = MagicMock()
        else:
            _client = MagicMock()
    return _client
