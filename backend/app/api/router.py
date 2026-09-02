from fastapi import APIRouter
from .v1 import farmer, crops, vision, weather, market, schemes, assistant, decisions, alerts

api_router = APIRouter()

api_router.include_router(farmer.router, prefix="/farmer", tags=["Farmer Profile"])
api_router.include_router(crops.router, prefix="/crops", tags=["Crop Recommendations"])
api_router.include_router(vision.router, prefix="/vision", tags=["Computer Vision Diagnostics"])
api_router.include_router(weather.router, prefix="/weather", tags=["Weather Intelligence"])
api_router.include_router(market.router, prefix="/market", tags=["Market & Mandi Intelligence"])
api_router.include_router(schemes.router, prefix="/schemes", tags=["Government Schemes"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["Grok AI Assistant"])
api_router.include_router(decisions.router, prefix="/decisions", tags=["Personalized Decisions"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Smart Alerts"])
