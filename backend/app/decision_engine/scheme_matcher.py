import json
from pathlib import Path
from typing import List, Dict, Any
from ..core.config import settings

def load_schemes() -> List[Dict[str, Any]]:
    schemes_file = settings.DATA_PATH / "schemes.json"
    if schemes_file.exists():
        with open(schemes_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def match_schemes_for_farmer(
    landholding_acres: float = 3.0,
    has_land_records: bool = True,
    has_water_source: bool = True,
    current_crop: str = "Wheat",
    state: str = "Maharashtra"
) -> List[Dict[str, Any]]:
    schemes = load_schemes()
    matched = []
    
    for s in schemes:
        rules = s.get("eligibilityRules", {})
        is_eligible = True
        match_score = 90
        reasons = []
        
        if rules.get("maxLandholdingAcres") and landholding_acres > rules["maxLandholdingAcres"]:
            is_eligible = False
            match_score = 20
        else:
            reasons.append(f"Landholding of {landholding_acres} acres qualifies under criteria.")
            
        if rules.get("requiresLandOwnership") and not has_land_records:
            match_score -= 30
            reasons.append("Requires valid 7/12 land records document.")
            
        if rules.get("requiresAssuredWaterSource") and not has_water_source:
            match_score -= 25
            reasons.append("Requires functional water connection or pump setup.")
            
        if rules.get("coveredCrops"):
            matched_crops = [c.lower() for c in rules["coveredCrops"]]
            if current_crop.lower() in matched_crops or any(c in current_crop.lower() for c in matched_crops):
                match_score += 10
                reasons.append(f"Your crop ({current_crop}) is explicitly notified for subsidy/insurance coverage.")
                
        status_label = "Likely Eligible" if match_score >= 70 else ("Requires Additional Verification" if match_score >= 50 else "Not Eligible")
        
        matched.append({
            **s,
            "matchScore": match_score,
            "eligibilityStatus": status_label,
            "reasons": reasons
        })
        
    matched.sort(key=lambda x: x["matchScore"], reverse=True)
    return matched
