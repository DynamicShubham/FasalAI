from fastapi import APIRouter
from ...services.scheme_service import scheme_service

router = APIRouter()

@router.get("/matched")
def get_matched_schemes(
    acres: float = 3.5,
    has_land_records: bool = True,
    has_water_source: bool = True,
    crop: str = "Wheat",
    state: str = "Maharashtra"
):
    return {
        "schemes": scheme_service.get_schemes_for_farmer(
            landholding_acres=acres,
            has_land_records=has_land_records,
            has_water_source=has_water_source,
            current_crop=crop,
            state=state
        )
    }
