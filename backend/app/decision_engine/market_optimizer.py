import json
from pathlib import Path
from typing import List, Dict, Any
from ..core.config import settings

def load_mandis() -> List[Dict[str, Any]]:
    mandis_file = settings.DATA_PATH / "mandis.json"
    if mandis_file.exists():
        with open(mandis_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def optimize_market_sale(
    commodity: str,
    quantity_quintals: float = 20.0,
    farmer_district: str = "Nashik"
) -> Dict[str, Any]:
    mandis = load_mandis()
    commodity_key = commodity.lower().replace(" ", "_").split("/")[0].strip()
    
    comparisons = []
    
    for mandi in mandis:
        comm_data = None
        for key, val in mandi.get("commodities", {}).items():
            if key in commodity_key or commodity_key in key:
                comm_data = val
                break
                
        if not comm_data:
            continue
            
        modal_price = comm_data["modalPrice"]
        min_price = comm_data["minPrice"]
        max_price = comm_data["maxPrice"]
        transport_cost = mandi["transportCostPerQuintal"]
        gross_value = modal_price * quantity_quintals
        total_transport = transport_cost * quantity_quintals
        net_payout = gross_value - total_transport
        net_price_per_quintal = modal_price - transport_cost
        
        comparisons.append({
            "mandiId": mandi["id"],
            "mandiName": mandi["name"],
            "district": mandi["district"],
            "distanceKm": mandi["distanceKm"],
            "modalPrice": modal_price,
            "minPrice": min_price,
            "maxPrice": max_price,
            "trend": comm_data["trend"],
            "arrivalQuintals": comm_data["arrivalQuintals"],
            "transportCostPerQuintal": transport_cost,
            "totalTransportCost": total_transport,
            "grossPayout": gross_value,
            "netPayout": net_payout,
            "netPricePerQuintal": net_price_per_quintal
        })
        
    comparisons.sort(key=lambda x: x["netPayout"], reverse=True)
    
    best_option = comparisons[0] if comparisons else None
    
    decision_summary = ""
    if best_option:
        diff_gain = 0
        if len(comparisons) > 1:
            diff_gain = best_option["netPayout"] - comparisons[-1]["netPayout"]
        decision_summary = (
            f"Sell at {best_option['mandiName']} ({best_option['distanceKm']} km away). "
            f"Even after paying ₹{best_option['transportCostPerQuintal']}/quintal transport, "
            f"your net realization is ₹{best_option['netPricePerQuintal']:,.0f}/quintal, earning ₹{best_option['netPayout']:,.0f} net."
        )
        
    return {
        "commodity": commodity,
        "quantityQuintals": quantity_quintals,
        "bestMandi": best_option,
        "allMandis": comparisons,
        "recommendationText": decision_summary
    }
