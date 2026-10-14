import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173")
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def API_KEY(self) -> str:
        return os.getenv("API_KEY", "dev-key-123")

    @property
    def DEFAULT_PLAN(self) -> str:
        return os.getenv("DEFAULT_PLAN", "free")

    @property
    def JWT_SECRET(self) -> str:
        return os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

    @property
    def JWT_EXPIRES_MIN(self) -> int:
        return int(os.getenv("JWT_EXPIRES_MIN", "60"))

    @property
    def COOKIE_DOMAIN(self) -> str | None:
        val = os.getenv("COOKIE_DOMAIN", "").strip()
        # Modern browsers reject domain="localhost" for host-only cookies
        if not val or val.lower() == "localhost":
            return None
        return val

    @property
    def COOKIE_SECURE(self) -> bool:
        return os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1")

    @property
    def COOKIE_SAMESITE(self) -> str:
        return os.getenv("COOKIE_SAMESITE", "lax")

settings = Settings()
