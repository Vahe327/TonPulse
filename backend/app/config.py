from pydantic_settings import BaseSettings
from pydantic import field_validator
import json
from typing import List


class Settings(BaseSettings):
    telegram_bot_token: str
    telegram_bot_username: str = "TonPulseBot"

    postgres_db: str = "tonpulse"
    postgres_user: str = "tonpulse"
    postgres_password: str = "tonpulse"
    database_url: str = "postgresql+asyncpg://tonpulse:tonpulse@postgres:5432/tonpulse"

    redis_url: str = "redis://redis:6379/0"

    ton_api_key: str = ""
    ton_api_url: str = "https://toncenter.com/api/v2"

    stonfi_api_url: str = "https://api.ston.fi"
    stonfi_router_address: str = "EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt"

    coingecko_api_url: str = "https://api.coingecko.com/api/v3"

    app_url: str = "https://tonpulse.vaheweb.xyz"
    cors_origins: List[str] = ["https://tonpulse.vaheweb.xyz", "https://web.telegram.org"]

    init_data_max_age_seconds: int = 3600

    price_update_interval_seconds: int = 15
    alert_check_interval_seconds: int = 15
    balance_cache_ttl_seconds: int = 30
    metadata_cache_ttl_seconds: int = 3600

    max_alerts_per_user: int = 10

    groq_api_key: str = ""
    groq_model_fast: str = "llama-3.1-8b-instant"
    groq_model_smart: str = "llama-3.3-70b-versatile"
    groq_model_reasoning: str = "deepseek-r1-distill-llama-70b"

    ai_requests_per_hour: int = 10
    ai_cache_ttl_analysis: int = 3600
    ai_cache_ttl_risk: int = 1800
    ai_cache_ttl_insight: int = 300

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list) -> list:
        if isinstance(v, str):
            return json.loads(v)
        return v

    model_config = {
        "env_file": [".env", "../.env"],
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


settings = Settings()
