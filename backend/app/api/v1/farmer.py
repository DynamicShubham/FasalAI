import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ...core.dependencies import get_current_user_optional, get_current_user_required
from ...services.supabase_service import supabase_service

logger = logging.getLogger("fasalai.api.farmer")
router = APIRouter()

class FarmerProfilePayload(BaseModel):
    name: str
    phone: Optional[str] = ""
    state: Optional[str] = ""
    district: Optional[str] = ""
    language: Optional[str] = "English"
    experienceYears: Optional[int] = 0
    acreage: Optional[float] = 0.0
    soilType: Optional[str] = ""
    soilPh: Optional[float] = 6.8
    irrigationSource: Optional[str] = ""
    waterAvailability: Optional[str] = ""
    currentCrop: Optional[str] = ""
    sowingDaysAgo: Optional[int] = 0

@router.get("/profile")
async def get_profile(current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """
    Returns farmer profile for the authenticated Supabase user from PostgreSQL.
    Returns hasProfile: false if unauthenticated or no profile exists yet.
    """
    if current_user and current_user.get("id"):
        auth_id = current_user["id"]
        farmer = await supabase_service.get_farmer_by_auth_id(auth_id)
        if farmer:
            farm = await supabase_service.get_farm_parcel(farmer["id"])
            return {
                "hasProfile": True,
                "profile": {
                    "id": farmer.get("id"),
                    "authUserId": farmer.get("auth_user_id"),
                    "name": farmer.get("full_name"),
                    "email": farmer.get("email"),
                    "phone": farmer.get("phone_number"),
                    "state": farmer.get("state"),
                    "district": farmer.get("district"),
                    "language": farmer.get("language"),
                    "experienceYears": farmer.get("experience_years"),
                    "acreage": float(farm.get("acreage", 0)) if farm else 0,
                    "soilType": farm.get("soil_type", "") if farm else "",
                    "soilPh": float(farm.get("soil_ph", 6.8)) if farm else 6.8,
                    "irrigationSource": farm.get("irrigation_source", "") if farm else "",
                    "waterAvailability": farm.get("water_availability", "") if farm else "",
                    "currentCrop": farm.get("current_crop", "") if farm else "",
                }
            }

    return {"hasProfile": False, "profile": None}

@router.post("/profile")
async def update_profile(
    profile: FarmerProfilePayload,
    current_user: Dict[str, Any] = Depends(get_current_user_required)
):
    """
    Saves farmer profile and farm parcel to Supabase Postgres,
    strictly scoped to the authenticated user's ID.
    """
    auth_id = current_user["id"]
    farmer_payload = {
        "auth_user_id": auth_id,
        "full_name": profile.name,
        "phone_number": profile.phone,
        "state": profile.state,
        "district": profile.district,
        "language": profile.language,
        "experience_years": profile.experienceYears,
    }
    saved_farmer = await supabase_service.save_farmer_profile(farmer_payload)
    
    if saved_farmer and saved_farmer.get("id") and profile.acreage and profile.acreage > 0:
        parcel_payload = {
            "farmer_id": saved_farmer["id"],
            "parcel_name": "Primary Farm",
            "acreage": profile.acreage,
            "soil_type": profile.soilType,
            "soil_ph": profile.soilPh,
            "irrigation_source": profile.irrigationSource,
            "water_availability": profile.waterAvailability,
            "current_crop": profile.currentCrop,
        }
        await supabase_service.save_farm_parcel(parcel_payload)

    return {"status": "success", "profile": profile, "persisted": True}
