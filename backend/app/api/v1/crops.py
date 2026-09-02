from fastapi import APIRouter, Query
from typing import Optional, List
from ...decision_engine.crop_suitability import calculate_crop_suitability, load_crops

router = APIRouter()

@router.get("/recommendations")
def get_recommendations(
    soil_type: str = "Black Clay Loam",
    ph: float = 6.8,
    irrigation: str = "Drip + Borewell",
    water: str = "Medium",
    season: str = "Rabi",
    budget: float = 25000.0,
    acreage: float = 3.5,
    state: str = "Maharashtra"
):
    results = calculate_crop_suitability(
        soil_type=soil_type,
        ph_level=ph,
        irrigation_source=irrigation,
        water_availability=water,
        season=season,
        budget_per_acre=budget,
        acreage=acreage,
        state=state
    )
    return {"crops": results}

@router.get("/all")
def get_all_crops():
    return {"crops": load_crops()}

@router.get("/compare")
def compare_crops(crop_ids: str = Query("wheat,soybean,mustard")):
    id_list = [c.strip().lower() for c in crop_ids.split(",")]
    all_crops = load_crops()
    filtered = [c for c in all_crops if c["id"] in id_list]
    return {"crops": filtered}

@router.get("/{crop_id}")
def get_crop_details(crop_id: str):
    all_crops = load_crops()
    for c in all_crops:
        if c["id"] == crop_id:
            return {"crop": c}
    return {"error": "Crop not found", "crop": all_crops[0] if all_crops else None}
