import json
from pathlib import Path
from typing import Dict, Any, Optional
from ..core.config import settings

def load_diseases() -> list[Dict[str, Any]]:
    diseases_file = settings.DATA_PATH / "diseases.json"
    if diseases_file.exists():
        with open(diseases_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def get_disease_by_id(disease_id: str) -> Optional[Dict[str, Any]]:
    diseases = load_diseases()
    for d in diseases:
        if d["id"] == disease_id:
            return d
    return None

def analyze_disease_risk(
    crop_name: str,
    temp_celsius: float,
    humidity_percent: float,
    rainfall_forecast_mm: float
) -> Dict[str, Any]:
    """Evaluates microclimate to calculate proactive fungal/viral disease outbreak risk."""
    risk_level = "Low"
    alerts = []
    
    if humidity_percent > 80 and temp_celsius > 22:
        risk_level = "High"
        alerts.append(f"High humidity ({humidity_percent}%) and warm weather creates ideal conditions for fungal blight and leaf spot.")
    elif humidity_percent > 70 or rainfall_forecast_mm > 15:
        risk_level = "Moderate"
        alerts.append("Elevated moisture levels observed. Keep foliar biopesticides ready.")
        
    return {
        "crop": crop_name,
        "riskLevel": risk_level,
        "temperature": temp_celsius,
        "humidity": humidity_percent,
        "rainfallForecastMm": rainfall_forecast_mm,
        "preventiveAlerts": alerts
    }
