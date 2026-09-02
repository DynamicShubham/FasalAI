from fastapi import APIRouter
from ...services.weather_service import weather_service

router = APIRouter()

@router.get("/forecast")
async def get_weather_forecast(district: str = "Nashik", lat: float = 20.1472, lon: float = 74.2257):
    return await weather_service.get_forecast(latitude=lat, longitude=lon, district=district)
