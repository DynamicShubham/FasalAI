from typing import List, Dict, Any

def generate_todays_farm_plan(
    crop_name: str = "Wheat",
    sowing_days_ago: int = 22,
    rainfall_probability_pct: int = 15,
    temp_celsius: int = 24,
    has_active_disease: bool = False,
    active_disease_name: str = ""
) -> Dict[str, Any]:
    tasks = []
    
    # Critical Alert Task if disease is detected
    if has_active_disease:
        tasks.append({
            "id": "task_disease_spray",
            "priority": "HIGH",
            "category": "Crop Protection",
            "title": f"Targeted Spray for {active_disease_name}",
            "description": f"Apply recommended organic/chemical foliar spray to arrest fungal spread in affected parcel.",
            "timing": "Best before 10:00 AM or after 4:30 PM",
            "completed": False,
            "badgeColor": "error"
        })
        
    # Agrometeorological Irrigation Logic
    if rainfall_probability_pct > 65:
        tasks.append({
            "id": "task_rain_hold",
            "priority": "MEDIUM",
            "category": "Irrigation Management",
            "title": "Hold Irrigation (High Rain Probability)",
            "description": f"{rainfall_probability_pct}% chance of rain forecast today. Avoid over-watering to save electricity and prevent root waterlogging.",
            "timing": "All Day",
            "completed": False,
            "badgeColor": "tertiary"
        })
    elif 20 <= sowing_days_ago <= 25:
        tasks.append({
            "id": "task_cri_irrigation",
            "priority": "HIGH",
            "category": "Critical Stage Irrigation",
            "title": "Crown Root Initiation (CRI) Light Irrigation",
            "description": "Day 22 critical growth node: Ensure uniform light irrigation to promote deep root development and tillering.",
            "timing": "Early Morning (6:00 AM - 9:00 AM)",
            "completed": True,
            "badgeColor": "primary"
        })
    else:
        tasks.append({
            "id": "task_moisture_check",
            "priority": "LOW",
            "category": "Field Scouting",
            "title": "Inspect Soil Moisture at 4-inch Depth",
            "description": "Perform hand-feel moisture test on western parcel before scheduling next drip cycle.",
            "timing": "Late Afternoon",
            "completed": False,
            "badgeColor": "secondary"
        })
        
    # Fertilizer & Nutrition Management
    if 25 <= sowing_days_ago <= 30:
        tasks.append({
            "id": "task_top_dressing",
            "priority": "MEDIUM",
            "category": "Nutrition",
            "title": "First Top-Dressing of Urea / Bio-NPK",
            "description": "Apply 25 kg/acre split dose after light irrigation for rapid vegetative shoot elongation.",
            "timing": "Afternoon",
            "completed": False,
            "badgeColor": "primary"
        })
        
    # Market Opportunity reminder
    tasks.append({
        "id": "task_market_check",
        "priority": "LOW",
        "category": "Market Intelligence",
        "title": f"Review {crop_name} Mandi Price Trends",
        "description": "Lasalgaon & Pimpalgaon rates updated today. Monitor price movements for harvest timing.",
        "timing": "Evening",
        "completed": False,
        "badgeColor": "secondary"
    })
    
    return {
        "crop": crop_name,
        "cropAgeDays": sowing_days_ago,
        "tasks": tasks,
        "completionRate": f"{len([t for t in tasks if t['completed']])} / {len(tasks)} Completed"
    }
