import logging
from datetime import datetime
from fastapi import APIRouter
from typing import List, Dict, Any
from ...services.weather_service import weather_service
from ...decision_engine.disease_analyzer import analyze_disease_risk

logger = logging.getLogger("fasalai.api.alerts")

router = APIRouter()

@router.get("/")
async def get_alerts(
    district: str = "Nashik",
    crop: str = "Wheat",
    lat: float = 20.1472,
    lon: float = 74.2257
):
    """
    Generates real-time alerts by querying weather data and running
    disease risk analysis through the decision engine.
    """
    alerts = []
    
    try:
        # Get weather data to generate weather-based alerts
        weather = await weather_service.get_forecast(latitude=lat, longitude=lon, district=district)
        
        current_temp = weather.get("currentTemp", 28)
        humidity = weather.get("humidity", 58)
        rain_prob = weather.get("rainProbability", 15)
        wind_speed = weather.get("windSpeedKm", 9.0)
        is_live = weather.get("isLive", False)
        
        # Weather alerts based on forecast data
        forecast = weather.get("forecast", [])
        high_rain_days = [f for f in forecast if f.get("rainProb", 0) >= 65]
        
        if high_rain_days:
            rain_day = high_rain_days[0]
            alerts.append({
                "id": f"alert_weather_rain_{rain_day.get('day', 'upcoming')}",
                "type": "WEATHER",
                "severity": "WARNING",
                "title": f"Rain Forecast for {rain_day.get('day', 'upcoming')} ({rain_day.get('rainProb', 75)}% probability)",
                "message": f"Heavy showers expected across {district} district. Postpone foliar pesticide spraying until conditions improve.",
                "timestamp": "Weather forecast" + (" (Live)" if is_live else " (Estimated)"),
                "action": "Adjust Schedule"
            })
        
        # Spray condition alert
        spray_unsafe = wind_speed > 15.0 or rain_prob > 50
        if spray_unsafe:
            alerts.append({
                "id": "alert_spray_window",
                "type": "WEATHER",
                "severity": "INFO",
                "title": "Spray Window Closed — Unfavorable Conditions",
                "message": f"Wind speed {wind_speed} km/h or rain probability {rain_prob}% makes foliar spraying ineffective. Wait for calmer conditions.",
                "timestamp": "Current conditions" + (" (Live)" if is_live else " (Estimated)"),
                "action": "Check Weather"
            })
        elif wind_speed < 10.0 and rain_prob < 30:
            alerts.append({
                "id": "alert_spray_window_open",
                "type": "WEATHER",
                "severity": "SUCCESS",
                "title": "Spray Window Open — Favorable Conditions",
                "message": f"Calm wind ({wind_speed} km/h) and low rain probability ({rain_prob}%). Good time for foliar applications.",
                "timestamp": "Current conditions" + (" (Live)" if is_live else " (Estimated)"),
                "action": "Plan Spraying"
            })
        
        # Disease risk alert from decision engine
        disease_risk = analyze_disease_risk(
            crop_name=crop,
            temp_celsius=current_temp,
            humidity_percent=humidity,
            rainfall_forecast_mm=rain_prob * 0.5  # Rough estimate
        )
        
        if disease_risk.get("riskLevel") in ("High", "Moderate"):
            risk_alerts = disease_risk.get("preventiveAlerts", [])
            alerts.append({
                "id": "alert_disease_risk",
                "type": "DISEASE_RISK",
                "severity": "CRITICAL" if disease_risk["riskLevel"] == "High" else "WARNING",
                "title": f"{disease_risk['riskLevel']} Disease Risk for {crop}",
                "message": risk_alerts[0] if risk_alerts else f"Environmental conditions favor disease outbreak. Monitor crop closely.",
                "timestamp": "Based on current microclimate",
                "action": "Scan Leaf Now"
            })
        
        # Heat stress alert
        if current_temp > 38:
            alerts.append({
                "id": "alert_heat_stress",
                "type": "WEATHER",
                "severity": "CRITICAL",
                "title": f"Heat Stress Warning — {current_temp}°C",
                "message": "Extreme temperatures can damage crops. Ensure adequate irrigation and consider shade nets for sensitive crops.",
                "timestamp": "Current conditions",
                "action": "Adjust Irrigation"
            })
        
    except Exception as e:
        logger.warning(f"Failed to generate dynamic alerts: {e}")
        # Provide a minimal informational alert if generation fails
        alerts.append({
            "id": "alert_system_info",
            "type": "SYSTEM",
            "severity": "INFO",
            "title": "Alert System Updating",
            "message": "Weather and risk data is being refreshed. Check back shortly for personalized alerts.",
            "timestamp": "Just now",
            "action": "Refresh"
        })
    
    return {"alerts": alerts}
