"""Application settings and environment configuration management."""

import os


class BaseSettings:
    """Base application settings model reading from environment variables."""

    def __init__(self) -> None:
        self.environment: str = os.getenv("ENVIRONMENT", "development")
        self.log_level: str = os.getenv("LOG_LEVEL", "INFO")
