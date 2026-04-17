from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./freecall.db"
    request_timeout: int = 30
    max_history_items: int = 1000

    model_config = {"env_prefix": "FREECALL_"}


settings = Settings()
