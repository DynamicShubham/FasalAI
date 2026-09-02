import json
from pathlib import Path
from typing import List, Dict, Any
from ..core.config import settings

_crops_cache = None

def load_crops() -> List[Dict[str, Any]]:
    global _crops_cache
    if _crops_cache is not None:
        return _crops_cache
    crops_file = settings.DATA_PATH / "crops.json"
    if crops_file.exists():
        with open(crops_file, "r", encoding="utf-8") as f:
            _crops_cache = json.load(f)
            return _crops_cache
    return []

def calculate_crop_suitability(
    soil_type: str,
    ph_level: float = 6.8,
    irrigation_source: str = "Canal/Borewell",
    water_availability: str = "Medium",  # Low, Medium, High
    season: str = "Rabi",                # Kharif, Rabi, Zaid, Multi-season
    budget_per_acre: float = 25000.0,
    acreage: float = 3.0,
    state: str = "Maharashtra"
) -> List[Dict[str, Any]]:
    crops = load_crops()
    scored_crops = []
    
    # Normalizing inputs
    soil_clean = soil_type.lower()
    
    for crop in crops:
        score = 60.0 # Base score
        reasons = []
        warnings = []
        
        # 1. Soil Match
        soil_matches = [s.lower() for s in crop.get("optimalSoil", [])]
        if any(s in soil_clean or soil_clean in s for s in soil_matches):
            score += 20.0
            reasons.append(f"Highly compatible with your {soil_type} soil.")
        else:
            score += 5.0
            reasons.append(f"Tolerant to {soil_type} soil with proper organic mulching.")
            
        # 2. pH Match
        min_ph = crop.get("minPh", 5.5)
        max_ph = crop.get("maxPh", 8.0)
        if min_ph <= ph_level <= max_ph:
            score += 10.0
            reasons.append(f"Optimal soil pH ({ph_level}) matches ideal range ({min_ph}-{max_ph}).")
        else:
            score -= 8.0
            warnings.append(f"Soil pH {ph_level} is slightly outside ideal range ({min_ph}-{max_ph}). Gypsum or lime treatment recommended.")
            
        # 3. Water / Irrigation match
        water_req = crop.get("waterRequirementMm", 500)
        if water_availability.lower() in ["high", "assured"] or "drip" in irrigation_source.lower() or "canal" in irrigation_source.lower():
            score += 10.0
            reasons.append(f"Adequate irrigation available for {water_req}mm seasonal requirement.")
        elif water_availability.lower() == "low" and water_req > 600:
            score -= 15.0
            warnings.append(f"Requires {water_req}mm water; may face stress under limited irrigation.")
        else:
            score += 5.0
            
        # 4. Budget match
        cost_per_acre = crop.get("costOfCultivationPerAcre", 15000)
        if budget_per_acre >= cost_per_acre:
            score += 5.0
            reasons.append(f"Estimated cultivation cost (₹{cost_per_acre:,.0f}/acre) fits comfortably within your budget.")
        else:
            score -= 10.0
            warnings.append(f"Cost of ₹{cost_per_acre:,.0f}/acre exceeds budget of ₹{budget_per_acre:,.0f}/acre; credit or KCC loan suggested.")
            
        # 5. Economics & Profitability
        yield_per_acre = crop.get("avgYieldQuintalPerAcre", 10)
        mandi_price = crop.get("currentAvgMandiPrice", 2500)
        gross_revenue_per_acre = yield_per_acre * mandi_price
        net_profit_per_acre = gross_revenue_per_acre - cost_per_acre
        total_estimated_profit = net_profit_per_acre * acreage
        
        # Clamp score between 0 and 100
        final_score = max(35.0, min(98.0, score))
        
        scored_crops.append({
            "cropId": crop["id"],
            "name": crop["name"],
            "category": crop.get("category", "General"),
            "season": crop.get("season", "Rabi"),
            "suitabilityScore": int(round(final_score)),
            "sustainabilityScore": crop.get("sustainabilityScore", 80),
            "carbonFootprint": crop.get("carbonFootprint", "Low"),
            "waterEfficiency": crop.get("waterEfficiency", "Medium"),
            "growthDurationDays": crop.get("growthDurationDays", 120),
            "estimatedYieldQuintals": round(yield_per_acre * acreage, 1),
            "estimatedCost": int(cost_per_acre * acreage),
            "estimatedRevenue": int(gross_revenue_per_acre * acreage),
            "estimatedNetProfit": int(total_estimated_profit),
            "roiPercentage": round((net_profit_per_acre / max(cost_per_acre, 1)) * 100, 1),
            "mspPerQuintal": crop.get("mspPerQuintal", 0),
            "currentMandiPrice": mandi_price,
            "reasons": reasons,
            "warnings": warnings,
            "tips": crop.get("tips", "Follow integrated nutrient management for optimal harvest."),
            "description": crop.get("description", "")
        })
        
    scored_crops.sort(key=lambda x: x["suitabilityScore"], reverse=True)
    return scored_crops
