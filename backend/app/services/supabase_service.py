import httpx
from typing import Dict, Any, List, Optional
from ..core.config import settings

class SupabaseService:
    def __init__(self):
        self.url = settings.SUPABASE_URL.rstrip("/") if settings.SUPABASE_URL else ""
        self.key = settings.SUPABASE_KEY
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY or self.key

    def is_configured(self) -> bool:
        return bool(self.url and self.key and not self.url.startswith("https://your-project"))

    def get_headers(self, use_service_role: bool = False) -> Dict[str, str]:
        key = self.service_key if use_service_role else self.key
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def get_farmer_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        """Queries farmer record from Supabase Postgres database."""
        if not self.is_configured():
            return None
        try:
            url = f"{self.url}/rest/v1/farmers?phone_number=eq.{phone}&select=*"
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url, headers=self.get_headers(use_service_role=True))
                if res.status_code == 200:
                    data = res.json()
                    return data[0] if data else None
        except Exception:
            pass
        return None

    async def save_farmer_profile(self, profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Upserts farmer profile to Supabase."""
        if not self.is_configured():
            return None
        try:
            url = f"{self.url}/rest/v1/farmers"
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    url,
                    json=profile,
                    headers={**self.get_headers(use_service_role=True), "Prefer": "resolution=merge-duplicates"}
                )
                if res.status_code in (200, 201):
                    return res.json()
        except Exception:
            pass
        return None

supabase_service = SupabaseService()
