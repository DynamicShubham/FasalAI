from fastapi import APIRouter
from typing import Optional
from ...decision_engine.daily_planner import generate_todays_farm_plan
from ...decision_engine.crop_suitability import calculate_crop_suitability
from ...decision_engine.market_optimizer import optimize_market_sale
from ...decision_engine.scheme_matcher import match_schemes_for_farmer

router = APIRouter()

@router.get("/daily-plan")
def get_daily_farm_plan(
    crop: str = "Wheat",
    sowing_days_ago: int = 22,
    rain_prob: int = 15,
    temp: int = 28,
    has_disease: bool = False,
    disease_name: str = ""
):
    return generate_todays_farm_plan(
        crop_name=crop,
        sowing_days_ago=sowing_days_ago,
        rainfall_probability_pct=rain_prob,
        temp_celsius=temp,
        has_active_disease=has_disease,
        active_disease_name=disease_name
    )

@router.get("/master-synthesis")
def get_master_synthesis(
    crop: str = "Wheat",
    acres: float = 3.5,
    soil: str = "Black Clay Loam",
    district: str = "Nashik"
):
    plan = generate_todays_farm_plan(crop_name=crop, sowing_days_ago=22, rainfall_probability_pct=15, temp_celsius=28)
    market = optimize_market_sale(commodity=crop, quantity_quintals=20.0, farmer_district=district)
    schemes = match_schemes_for_farmer(landholding_acres=acres, has_land_records=True, has_water_source=True, current_crop=crop)
    
    return {
        "status": "Optimal Field Health",
        "primaryRecommendation": f"Maintain current irrigation schedule. Wheat crop is at Day 22 (CRI root stage). Next top-dressing due in 4 days.",
        "economicOutlook": f"Strong price support for {crop} at {market.get('bestMandi', {}).get('mandiName', 'Local APMC')}.",
        "eligibleSchemesCount": len([s for s in schemes if s["matchScore"] >= 70]),
        "dailyPlan": plan,
        "marketSnapshot": market
    }
