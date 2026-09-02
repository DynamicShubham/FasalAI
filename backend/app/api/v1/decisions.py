import logging
from fastapi import APIRouter
from typing import Optional
from ...decision_engine.daily_planner import generate_todays_farm_plan
from ...decision_engine.crop_suitability import calculate_crop_suitability
from ...decision_engine.market_optimizer import optimize_market_sale
from ...decision_engine.scheme_matcher import match_schemes_for_farmer

logger = logging.getLogger("fasalai.api.decisions")

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
    district: str = "Nashik",
    sowing_days_ago: int = 22,
    rain_prob: int = 15,
    temp: int = 28
):
    """
    Master synthesis endpoint that combines daily plan, market optimization,
    and scheme matching into a single comprehensive response.
    All values are computed dynamically from the decision engine.
    """
    plan = generate_todays_farm_plan(
        crop_name=crop,
        sowing_days_ago=sowing_days_ago,
        rainfall_probability_pct=rain_prob,
        temp_celsius=temp
    )
    market = optimize_market_sale(
        commodity=crop,
        quantity_quintals=20.0,
        farmer_district=district
    )
    schemes = match_schemes_for_farmer(
        landholding_acres=acres,
        has_land_records=True,
        has_water_source=True,
        current_crop=crop
    )
    
    # Build dynamic status and recommendation text
    high_priority_tasks = [t for t in plan.get("tasks", []) if t.get("priority") == "HIGH"]
    has_urgent = len(high_priority_tasks) > 0
    
    status = "Requires Attention" if has_urgent else "Optimal Field Health"
    
    # Build recommendation from actual decision engine output
    recommendation_parts = []
    if plan.get("tasks"):
        top_task = plan["tasks"][0]
        recommendation_parts.append(f"{top_task['title']}: {top_task['description']}")
    
    if rain_prob > 50:
        recommendation_parts.append(f"Rain probability is {rain_prob}% — plan field activities accordingly.")
    
    primary_recommendation = " ".join(recommendation_parts) if recommendation_parts else f"Maintain current management for {crop} at Day {sowing_days_ago}."
    
    # Build economic outlook from market data
    best_mandi = market.get("bestMandi")
    if best_mandi:
        economic_outlook = f"Best market price for {crop} at {best_mandi.get('mandiName', 'Local APMC')} — ₹{best_mandi.get('modalPrice', 0)}/q (net ₹{best_mandi.get('netPricePerQuintal', 0)}/q after transport)."
    else:
        economic_outlook = f"Market data for {crop} is being updated. Check mandi rates for latest prices."
    
    eligible_count = len([s for s in schemes if s.get("matchScore", 0) >= 70])
    
    return {
        "status": status,
        "primaryRecommendation": primary_recommendation,
        "economicOutlook": economic_outlook,
        "eligibleSchemesCount": eligible_count,
        "dailyPlan": plan,
        "marketSnapshot": market
    }
