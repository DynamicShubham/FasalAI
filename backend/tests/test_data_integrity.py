import pytest
import asyncio
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime, timezone, timedelta
from app.main import app
from app.services.weather_service import weather_service
from app.services.market_ingestion import query_market_prices, load_agmarknet_records
from app.decision_engine.market_optimizer import optimize_market_sale
from app.decision_engine.scheme_matcher import match_schemes_for_farmer
from app.vision.detector import CropDiseaseDetector
import numpy as np
from PIL import Image
import io
import base64

client = TestClient(app)

# ---------------------------------------------------------------------------
# Test 1: Successful Weather Fetch (Returns LIVE, is_live=True, age_minutes=0)
# ---------------------------------------------------------------------------
def test_successful_weather_fetch():
    mock_ow_response = {
        "city": {"name": "Nashik", "timezone": 19800},
        "list": [
            {
                "dt": int(datetime.now(timezone.utc).timestamp()),
                "main": {"temp": 26.4, "temp_max": 28.0, "temp_min": 19.5, "humidity": 62},
                "weather": [{"main": "Clouds", "description": "scattered clouds"}],
                "wind": {"speed": 3.2},
                "pop": 0.15
            }
        ]
    }
    
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_ow_response
        mock_get.return_value = mock_resp
        
        # Clear cache for isolated test
        weather_service._cache.clear()
        res = asyncio.run(weather_service.get_forecast(district="Nashik", latitude=20.0, longitude=74.0))
        
        assert res["status"] == "LIVE"
        assert res["is_live"] is True
        assert res["is_stale"] is False
        assert res["age_minutes"] == 0
        assert res["currentTemp"] == 26
        assert res["source"] == "OpenWeather"
        assert "fetched_at" in res

# ---------------------------------------------------------------------------
# Test 2: Weather API Failure (No Cache -> UNAVAILABLE, zero fake data)
# ---------------------------------------------------------------------------
def test_weather_api_failure_no_cache():
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.side_effect = Exception("OpenWeather gateway timeout 504")
        
        # Clear cache to guarantee empty state
        weather_service._cache.clear()
        res = asyncio.run(weather_service.get_forecast(district="UnknownRemoteRegion", latitude=99.0, longitude=99.0))
        
        assert res["status"] == "UNAVAILABLE"
        assert res["is_live"] is False
        assert res["is_stale"] is False
        assert res["currentTemp"] is None
        assert res["forecast"] == []
        assert "error" in res
        assert "unavailable" in res["error"].lower()

# ---------------------------------------------------------------------------
# Test 3: Stale Weather Cache (Upstream failure with warm cache -> STALE)
# ---------------------------------------------------------------------------
def test_stale_weather_cache():
    cache_key = weather_service._get_cache_key("nashik", 20.0, 74.0)
    stale_time = datetime.now(timezone.utc) - timedelta(minutes=42)
    
    weather_service._cache[cache_key] = {
        "data": {
            "location": "Nashik, Maharashtra",
            "currentTemp": 25,
            "condition": "Clouds",
            "description": "Scattered Clouds",
            "source": "OpenWeather",
            "source_url": "https://openweathermap.org",
            "forecast": []
        },
        "fetched_at": stale_time
    }
    
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.side_effect = Exception("Connection refused")
        
        res = asyncio.run(weather_service.get_forecast(district="Nashik", latitude=20.0, longitude=74.0))
        
        assert res["status"] == "STALE"
        assert res["is_live"] is False
        assert res["is_stale"] is True
        assert res["age_minutes"] >= 40
        assert "warning" in res

# ---------------------------------------------------------------------------
# Test 4: Successful Market Ingestion (Official AGMARKNET bulletin)
# ---------------------------------------------------------------------------
def test_successful_market_ingestion():
    res = query_market_prices(commodity="Onion", district="Nashik")
    
    assert res["status"] == "CURRENT"
    assert res["source_record_date"] is not None
    assert len(res["markets"]) > 0
    
    first_market = res["markets"][0]
    assert "modalPrice" in first_market
    assert "minPrice" in first_market
    assert "maxPrice" in first_market
    assert "variety" in first_market
    assert "grade" in first_market
    assert first_market["modalPrice"] > 0
    assert "AGMARKNET" in res["source"]

# ---------------------------------------------------------------------------
# Test 5: Market API Failure / Fallback Integrity
# ---------------------------------------------------------------------------
def test_market_api_failure_fallback():
    # If state is non-existent, should return clean empty structure without crash
    res = query_market_prices(commodity="Onion", state="NonExistentState99")
    assert res["status"] == "COMMODITY_NOT_FOUND"
    assert res["markets"] == []

# ---------------------------------------------------------------------------
# Test 6: Stale Market Data Handling
# ---------------------------------------------------------------------------
def test_stale_market_data():
    records = load_agmarknet_records()
    assert len(records) > 0
    for r in records:
        assert "sourceRecordDate" in r
        assert "fetchedAt" in r
        assert r["status"] in ("CURRENT", "STALE")

# ---------------------------------------------------------------------------
# Test 7: Missing Market Commodity (Zero Fabricated Prices)
# ---------------------------------------------------------------------------
def test_missing_market_commodity():
    opt_res = optimize_market_sale(commodity="DragonFruitExotic2026", quantity_quintals=15)
    
    assert opt_res["status"] == "COMMODITY_NOT_FOUND"
    assert opt_res["bestMandi"] is None
    assert opt_res["allMandis"] == []
    assert "no official agmarknet price bulletin" in opt_res["recommendationText"].lower()

# ---------------------------------------------------------------------------
# Test 8: Scheme Matching (Outputs 'Likely eligible' with official URLs)
# ---------------------------------------------------------------------------
def test_scheme_matching():
    matched = match_schemes_for_farmer(
        landholding_acres=2.5,
        has_land_records=True,
        has_water_source=True,
        current_crop="Wheat"
    )
    
    assert len(matched) > 0
    for s in matched:
        assert s["eligibilityStatus"] in ("Likely eligible", "Requires Additional Verification", "Likely ineligible")
        assert "officialSourceUrl" in s
        assert "verificationDisclaimer" in s
        assert s["officialSourceUrl"].startswith("http")

# ---------------------------------------------------------------------------
# Test 9: Missing Scheme Data / Large Ineligible Landholding
# ---------------------------------------------------------------------------
def test_missing_scheme_data():
    # Test extreme criteria (e.g. 500 acres with no land records)
    matched = match_schemes_for_farmer(
        landholding_acres=500.0,
        has_land_records=False,
        has_water_source=False,
        current_crop="UnknownCrop"
    )
    
    # Should flag PM-KISAN or PMKSY as ineligible/low score
    pm_kisan = next((s for s in matched if s["id"] == "pm_kisan"), None)
    if pm_kisan:
        assert pm_kisan["matchScore"] < 50
        assert pm_kisan["eligibilityStatus"] == "Likely ineligible"

# ---------------------------------------------------------------------------
# Test 10: CV Low Confidence (Warning instead of fake Early Blight)
# ---------------------------------------------------------------------------
def test_cv_low_confidence():
    detector = CropDiseaseDetector()
    # Create an artificial flat gray noise image that has no plant features
    img = Image.new("RGB", (128, 128), (128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()
    
    # Mock probabilities to be uniformly distributed / low confidence (< 0.45)
    if detector.model is not None and hasattr(detector.model, "predict_proba"):
        uniform_probs = np.full((1, len(detector.encoder.classes_)), 1.0 / len(detector.encoder.classes_))
        with patch.object(detector.model, "predict_proba", return_value=uniform_probs):
            res = detector.detect_from_image_bytes(img_bytes)
            assert res["success"] is False
            assert res["status"] == "LOW_CONFIDENCE"
            assert res["diseaseName"] is None
            assert "unable to make a reliable diagnosis" in res["message"].lower()

# ---------------------------------------------------------------------------
# Test 11: CV Successful Classification with Field Accuracy Disclaimer
# ---------------------------------------------------------------------------
def test_cv_successful_classification():
    detector = CropDiseaseDetector()
    # Create green leaf-like test pattern
    img = Image.new("RGB", (128, 128), (45, 140, 35))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()
    
    res = detector.detect_from_image_bytes(img_bytes)
    # The detector produces a diagnosis or honest low confidence, with disclaimer
    assert "disclaimer" in res
    if res["success"]:
        assert res["diseaseName"] is not None
        assert "confidenceScore" in res
        assert "validationAccuracy" in res

# ---------------------------------------------------------------------------
# Test 12: Fresh Farmer Profile (Never returns fake demo farmer)
# ---------------------------------------------------------------------------
def test_fresh_farmer_profile():
    # Calling /api/v1/farmer/profile without auth should return hasProfile=False
    response = client.get("/api/v1/farmer/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["hasProfile"] is False
    assert data["profile"] is None

# ---------------------------------------------------------------------------
# Test 13: Second-User Data Isolation (Tenant Isolation)
# ---------------------------------------------------------------------------
def test_second_user_data_isolation():
    from app.core.dependencies import get_current_user_optional
    
    user_a = {"id": "user_a_123", "email": "farmer_a@example.com"}
    user_b = {"id": "user_b_456", "email": "farmer_b@example.com"}
    
    # Dependency override for User A
    app.dependency_overrides[get_current_user_optional] = lambda: user_a
    with patch("app.services.supabase_service.supabase_service.get_farmer_by_auth_id") as mock_get_farmer:
        mock_get_farmer.return_value = {"id": "farmer_uuid_a", "full_name": "Ramesh Kumar"}
        with patch("app.services.supabase_service.supabase_service.get_farm_parcel") as mock_get_farm:
            mock_get_farm.return_value = {"acreage": 4.5, "current_crop": "Soybean"}
            
            res_a = client.get("/api/v1/farmer/profile")
            assert res_a.status_code == 200
            assert res_a.json()["profile"]["name"] == "Ramesh Kumar"
            assert res_a.json()["profile"]["acreage"] == 4.5
    
    # Dependency override for User B (Isolated Tenant)
    app.dependency_overrides[get_current_user_optional] = lambda: user_b
    with patch("app.services.supabase_service.supabase_service.get_farmer_by_auth_id") as mock_get_farmer:
        mock_get_farmer.return_value = {"id": "farmer_uuid_b", "full_name": "Suresh Patil"}
        with patch("app.services.supabase_service.supabase_service.get_farm_parcel") as mock_get_farm:
            mock_get_farm.return_value = {"acreage": 2.0, "current_crop": "Cotton"}
            
            res_b = client.get("/api/v1/farmer/profile")
            assert res_b.status_code == 200
            assert res_b.json()["profile"]["name"] == "Suresh Patil"
            assert res_b.json()["profile"]["acreage"] == 2.0
            assert res_b.json()["profile"]["name"] != res_a.json()["profile"]["name"]
            
    # Clean up overrides
    app.dependency_overrides.clear()

# ---------------------------------------------------------------------------
# Test 14: API Timeout Handling (Graceful degradation without hanging)
# ---------------------------------------------------------------------------
def test_api_timeout_handling():
    weather_service._cache.clear()
    with patch("httpx.AsyncClient.get") as mock_get:
        import httpx
        mock_get.side_effect = httpx.TimeoutException("Read timeout after 4500ms")
        
        res = asyncio.run(weather_service.get_forecast(district="Nashik", latitude=20.0, longitude=74.0))
        assert res["status"] == "UNAVAILABLE"
        assert res["currentTemp"] is None

# ---------------------------------------------------------------------------
# Test 15: Malformed Upstream Response Handling (Catches JSON error)
# ---------------------------------------------------------------------------
def test_malformed_upstream_response():
    weather_service._cache.clear()
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        # Corrupt JSON response lacking "list"
        mock_resp.json.return_value = {"unexpected_error": "corrupt payload"}
        mock_get.return_value = mock_resp
        
        res = asyncio.run(weather_service.get_forecast(district="Nashik", latitude=20.0, longitude=74.0))
        # Should catch parsing error and return explicit UNAVAILABLE, never fake 28°C
        assert res["status"] == "UNAVAILABLE"
        assert res["currentTemp"] is None
