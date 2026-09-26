"""Application settings and environment configuration management."""

import os


class BaseSettings:
    """Base application settings model reading from environment variables."""

    def __init__(self) -> None:
        self.environment: str = os.getenv("ENVIRONMENT", "development")
        self.log_level: str = os.getenv("LOG_LEVEL", "INFO")
        self.supabase_url: str = os.getenv(
            "SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "")
        )
        self.supabase_anon_key: str = os.getenv(
            "SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", "")
        )
        self.supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


settings = BaseSettings()
