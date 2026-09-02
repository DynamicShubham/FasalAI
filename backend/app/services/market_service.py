from typing import Dict, Any, List
from ..decision_engine.market_optimizer import load_mandis, optimize_market_sale

class MarketService:
    def get_prices_for_crop(self, crop: str, quantity: float = 20.0, district: str = "Nashik") -> Dict[str, Any]:
        return optimize_market_sale(commodity=crop, quantity_quintals=quantity, farmer_district=district)
        
    def get_market_overview(self) -> List[Dict[str, Any]]:
        mandis = load_mandis()
        return mandis

market_service = MarketService()
