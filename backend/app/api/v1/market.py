from fastapi import APIRouter
from ...services.market_service import market_service

router = APIRouter()

@router.get("/compare")
def compare_mandi_prices(crop: str = "Onion", quantity: float = 20.0, district: str = "Nashik"):
    return market_service.get_prices_for_crop(crop=crop, quantity=quantity, district=district)

@router.get("/overview")
def get_all_mandis():
    return {"mandis": market_service.get_market_overview()}
