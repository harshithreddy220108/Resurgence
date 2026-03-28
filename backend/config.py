"""
backend/config.py — Environment-driven configuration using pydantic-settings.
All values are read from the .env file or environment variables.
"""
import secrets
import logging
from functools import lru_cache
from pydantic_settings import BaseSettings

logger = logging.getLogger("qtrade.config")


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = "sqlite:////tmp/qtrade.db"


    # ── Auth ──────────────────────────────────────────────────────────────────
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins
    allowed_origins: str = "http://localhost:5173"

    # ── Environment ───────────────────────────────────────────────────────────
    environment: str = "development"

    # ── Admin Seed ────────────────────────────────────────────────────────────
    admin_email: str = "admin@qtrade.com"
    admin_password: str = "AdminQ-Trade2025!"
    admin_name: str = "Platform Admin"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def docs_url(self) -> str | None:
        """Hide API docs in production."""
        return None if self.is_production else "/docs"

    @property
    def redoc_url(self) -> str | None:
        return None if self.is_production else "/redoc"

    @property
    def parsed_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    s = Settings()
    if s.is_production and s.secret_key == "change-me-in-production":
        raise RuntimeError(
            "FATAL: SECRET_KEY is set to the default value. "
            "Generate a real key: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    return s


settings = get_settings()
