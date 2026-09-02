from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class FarmerProfile(BaseModel):
    id: str = "farmer_demo_1"
    name: str = "Ramesh Patil"
    phone: str = "+91 98765 43210"
    state: str = "Maharashtra"
    district: str = "Nashik"
    language: str = "English"
    experienceYears: int = 14
    acreage: float = 3.5
    soilType: str = "Black Clay Loam"
    soilPh: float = 6.8
    irrigationSource: str = "Drip + Borewell"
    waterAvailability: str = "Medium"
    currentCrop: str = "Wheat"
    sowingDaysAgo: int = 22

# In-memory session store for demo responsiveness
_current_profile = FarmerProfile()

@router.get("/profile")
def get_profile():
    return _current_profile

@router.post("/profile")
def update_profile(profile: FarmerProfile):
    global _current_profile
    _current_profile = profile
    return {"status": "success", "profile": _current_profile}

@router.post("/demo-login")
def demo_login():
    global _current_profile
    _current_profile = FarmerProfile()
    return {
        "status": "success",
        "token": "demo_jwt_token_fasalai_2026",
        "farmer": _current_profile
    }
