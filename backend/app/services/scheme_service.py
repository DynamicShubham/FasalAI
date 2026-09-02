from typing import List, Dict, Any
from ..decision_engine.scheme_matcher import match_schemes_for_farmer, load_schemes

class SchemeService:
    def get_schemes_for_farmer(
        self,
        landholding_acres: float = 3.0,
        has_land_records: bool = True,
        has_water_source: bool = True,
        current_crop: str = "Wheat",
        state: str = "Maharashtra"
    ) -> List[Dict[str, Any]]:
        return match_schemes_for_farmer(
            landholding_acres=landholding_acres,
            has_land_records=has_land_records,
            has_water_source=has_water_source,
            current_crop=current_crop,
            state=state
        )

scheme_service = SchemeService()
