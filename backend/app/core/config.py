import os
from dataclasses import dataclass, field
from pathlib import Path


def cors_origins_from_env() -> list[str]:
    origins = os.getenv("CORS_ORIGINS", "").strip()
    if not origins:
        origins = "http://localhost:5173,http://127.0.0.1:5173"
    result = [origin.strip().rstrip("/") for origin in origins.split(",") if origin.strip()]
    if "*" in result:
        raise ValueError("CORS_ORIGINS must contain explicit origins, not '*'")
    return result


@dataclass
class Settings:
    cors_origins: list[str] = field(default_factory=cors_origins_from_env)
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./runtime/bridge.db")
    erp_database_url: str = os.getenv("ERP_DATABASE_URL", "sqlite:///./runtime/erp.db")
    upload_dir: Path = Path(os.getenv("UPLOAD_DIR", "./runtime/uploads"))
    demo_mode: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
    auto_seed_demo: bool = os.getenv("AUTO_SEED_DEMO", "false").lower() == "true"
    auth_required: bool = os.getenv("AUTH_REQUIRED", "false").lower() == "true"
    supabase_url: str = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_publishable_key: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    ai_provider: str = os.getenv("AI_PROVIDER", "demo")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    erp_base_url: str = os.getenv("ERP_BASE_URL", "http://127.0.0.1:8001")
    erp_timeout: float = float(os.getenv("ERP_TIMEOUT_SECONDS", "5"))
    max_upload_bytes: int = 10 * 1024 * 1024
    sample_dir: Path = Path(__file__).resolve().parents[3] / "sample-data" / "invoices"


settings = Settings()
