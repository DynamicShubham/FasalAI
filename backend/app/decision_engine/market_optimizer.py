import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..services.market_ingestion import query_market_prices, load_agmarknet_records

logger = logging.getLogger("fasalai.market.optimizer")

def load_mandis() -> List[Dict[str, Any]]:
    """Backward-compatible loader using official AGMARKNET dataset."""
    return load_agmarknet_records()

def optimize_market_sale(
    commodity: str,
    quantity_quintals: float = 20.0,
    farmer_district: str = "Nashik"
) -> Dict[str, Any]:
    """
    Computes estimated net in-hand realization across nearby APMC markets
    from official AGMARKNET benchmark data and distance-based freight costs.
    Zero fabricated data: Returns empty if commodity has no recorded bulletin.
    """
    now_utc = datetime.now(timezone.utc)
    query_res = query_market_prices(commodity=commodity, district=farmer_district)
    markets = query_res.get("markets", [])

    if not markets:
        return {
            "commodity": commodity,
            "quantityQuintals": quantity_quintals,
            "bestMandi": None,
            "allMandis": [],
            "recommendationText": f"No official AGMARKNET price bulletin currently recorded for '{commodity}'.",
            "source": query_res.get("source"),
            "source_url": query_res.get("source_url"),
            "source_record_date": None,
            "fetched_at": now_utc.isoformat(),
            "status": "COMMODITY_NOT_FOUND",
            "calculationType": "ESTIMATE",
            "provenanceNote": "No price bulletin found. FasalAI never fabricates unverified market prices."
        }

    comparisons = []
    for mandi in markets:
        modal_price = mandi["modalPrice"]
        min_price = mandi["minPrice"]
        max_price = mandi["maxPrice"]
        transport_cost = mandi["transportCostPerQuintal"]
        gross_value = modal_price * quantity_quintals
        total_transport = transport_cost * quantity_quintals
        net_payout = gross_value - total_transport
        net_price_per_quintal = modal_price - transport_cost

        comparisons.append({
            "mandiId": mandi["marketId"],
            "mandiName": mandi["marketName"],
            "district": mandi["district"],
            "distanceKm": mandi["distanceKm"],
            "variety": mandi.get("variety", "FAQ"),
            "grade": mandi.get("grade", "FAQ"),
            "modalPrice": modal_price,
            "minPrice": min_price,
            "maxPrice": max_price,
            "trend": mandi.get("trend", "STABLE"),
            "arrivalQuintals": mandi.get("arrivalQuintals", 0),
            "transportCostPerQuintal": transport_cost,
            "totalTransportCost": total_transport,
            "grossPayout": gross_value,
            "netPayout": net_payout,
            "netPricePerQuintal": net_price_per_quintal,
            "sourceRecordDate": mandi.get("sourceRecordDate")
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
            f"After estimated freight deduction of ₹{best_option['transportCostPerQuintal']}/q, "
            f"your estimated net realization is ₹{best_option['netPricePerQuintal']:,.0f}/quintal (₹{best_option['netPayout']:,.0f} net in-hand)."
        )

    return {
        "commodity": commodity,
        "quantityQuintals": quantity_quintals,
        "bestMandi": best_option,
        "allMandis": comparisons,
        "recommendationText": decision_summary,
        "source": query_res.get("source"),
        "source_url": query_res.get("source_url"),
        "source_record_date": query_res.get("source_record_date"),
        "fetched_at": now_utc.isoformat(),
        "status": "CURRENT",
        "calculationType": "ESTIMATE",
        "provenanceNote": "Net in-hand figures are estimates calculated from official AGMARKNET modal reference prices minus distance-weighted freight deductions."
    }
