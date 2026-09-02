from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

@router.get("/")
def get_alerts():
    return {
        "alerts": [
            {
                "id": "alert_weather_rain",
                "type": "WEATHER",
                "severity": "WARNING",
                "title": "Rain Forecast for Saturday (75% probability)",
                "message": "Heavy showers expected across Nashik district. Postpone foliar pesticide spraying until Sunday.",
                "timestamp": "10 mins ago",
                "action": "Adjust Schedule"
            },
            {
                "id": "alert_pest_watch",
                "type": "DISEASE_RISK",
                "severity": "CRITICAL",
                "title": "Yellow Rust Advisory in Neighboring Blocks",
                "message": "High humidity has triggered stripe rust reports in adjacent wheat fields. Inspect lower foliage today.",
                "timestamp": "2 hours ago",
                "action": "Scan Leaf Now"
            },
            {
                "id": "alert_market_surge",
                "type": "MARKET",
                "severity": "INFO",
                "title": "Onion Modal Price Reached ₹2,280/q at Pimpalgaon",
                "message": "Prices surged by +6.2% due to robust out-of-state demand.",
                "timestamp": "5 hours ago",
                "action": "View Mandi Rates"
            },
            {
                "id": "alert_pm_kisan",
                "type": "SCHEME",
                "severity": "SUCCESS",
                "title": "PM-KISAN 17th Installment Release Announced",
                "message": "Verify your bank account e-KYC status to receive the ₹2,000 credit smoothly.",
                "timestamp": "1 day ago",
                "action": "Check Status"
            }
        ]
    }
