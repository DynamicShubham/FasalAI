import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

# Resolve data directory flexibly for local, Render, and Docker
APP_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

if os.getenv("DATA_PATH"):
    DATA_DIR = Path(os.getenv("DATA_PATH"))
elif (BACKEND_DIR / "data").exists():
    DATA_DIR = BACKEND_DIR / "data"
elif (ROOT_DIR / "data").exists():
    DATA_DIR = ROOT_DIR / "data"
else:
    DATA_DIR = BACKEND_DIR / "data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "FasalAI"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
    
    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://fasalai.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    # AI & Grok
    GROK_API_KEY: str = os.getenv("GROK_API_KEY", "")
    GROK_API_URL: str = os.getenv("GROK_API_URL", "https://api.x.ai/v1/chat/completions")
    GROK_MODEL: str = os.getenv("GROK_MODEL", "grok-2-latest")
    
    # Supabase / DB
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_SECRET_KEY", ""))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Redis / Render Key Value
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # External APIs
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    
    # Port / Host for deployment
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Directories
    DATA_PATH: Path = DATA_DIR

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
