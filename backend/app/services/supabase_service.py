import logging
import httpx
from typing import Dict, Any, List, Optional
from ..core.config import settings

logger = logging.getLogger("fasalai.supabase")

class SupabaseService:
    def __init__(self):
        self.url = settings.SUPABASE_URL.rstrip("/") if settings.SUPABASE_URL else ""
        self.key = settings.SUPABASE_KEY
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY or self.key

    def is_configured(self) -> bool:
        return bool(
            self.url
            and self.key
            and not self.url.startswith("https://your-project")
            and not self.key.startswith("your-")
        )

    def get_headers(self, use_service_role: bool = False, user_token: Optional[str] = None) -> Dict[str, str]:
        auth_header = f"Bearer {user_token}" if user_token else f"Bearer {self.service_key if use_service_role else self.key}"
        return {
            "apikey": self.key or self.service_key,
            "Authorization": auth_header,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def validate_user_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validates a Supabase JWT token against Supabase Auth API."""
        if not self.is_configured() or not token:
            return None
        try:
            url = f"{self.url}/auth/v1/user"
            headers = {
                "apikey": self.key or self.service_key,
                "Authorization": f"Bearer {token}"
            }
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    return res.json()
                else:
                    logger.warning(f"Token validation failed with status {res.status_code}")
        except Exception as e:
            logger.warning(f"Error validating Supabase token: {e}")
        return None

    async def get_farmer_by_auth_id(self, auth_user_id: str) -> Optional[Dict[str, Any]]:
        """Queries farmer record from Supabase Postgres database by auth_user_id."""
        if not self.is_configured() or not auth_user_id:
            return None
        try:
            url = f"{self.url}/rest/v1/farmers?auth_user_id=eq.{auth_user_id}&select=*"
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url, headers=self.get_headers(use_service_role=True))
                if res.status_code == 200:
                    data = res.json()
                    return data[0] if data else None
        except Exception as e:
            logger.warning(f"Error querying farmer by auth_user_id: {e}")
        return None

    async def get_farm_parcel(self, farmer_id: str) -> Optional[Dict[str, Any]]:
        """Queries active farm parcel for a farmer."""
        if not self.is_configured() or not farmer_id:
            return None
        try:
            url = f"{self.url}/rest/v1/farm_parcels?farmer_id=eq.{farmer_id}&select=*&order=created_at.desc&limit=1"
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url, headers=self.get_headers(use_service_role=True))
                if res.status_code == 200:
                    data = res.json()
                    return data[0] if data else None
        except Exception as e:
            logger.warning(f"Error querying farm parcel: {e}")
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
                    headers={
                        **self.get_headers(use_service_role=True),
                        "Prefer": "resolution=merge-duplicates,return=representation"
                    }
                )
                if res.status_code in (200, 201):
                    data = res.json()
                    return data[0] if isinstance(data, list) and data else data
        except Exception as e:
            logger.warning(f"Error saving farmer profile to Supabase: {e}")
        return None

    async def save_farm_parcel(self, parcel: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Upserts farm parcel to Supabase."""
        if not self.is_configured():
            return None
        try:
            url = f"{self.url}/rest/v1/farm_parcels"
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    url,
                    json=parcel,
                    headers={
                        **self.get_headers(use_service_role=True),
                        "Prefer": "return=representation"
                    }
                )
                if res.status_code in (200, 201):
                    data = res.json()
                    return data[0] if isinstance(data, list) and data else data
        except Exception as e:
            logger.warning(f"Error saving farm parcel to Supabase: {e}")
        return None

supabase_service = SupabaseService()
