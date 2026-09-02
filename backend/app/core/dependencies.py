import logging
from fastapi import Header, HTTPException, status
from typing import Optional, Dict, Any
from ..services.supabase_service import supabase_service

logger = logging.getLogger("fasalai.auth")

async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """
    Extracts and validates Supabase JWT token from Authorization header if present.
    Returns authenticated user dict or None if no token provided.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ")[1].strip()
    if not token:
        return None

    user = await supabase_service.validate_user_token(token)
    return user

async def get_current_user_required(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Strict authentication dependency requiring a valid Supabase JWT token.
    Raises 401 Unauthorized if invalid or expired.
    """
    user = await get_current_user_optional(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid Supabase authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
