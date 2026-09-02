import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_render_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_crop_recommendations():
    response = client.get("/api/v1/crops/recommendations?soil_type=Black+Clay+Loam&ph=6.8&acreage=3.5")
    assert response.status_code == 200
    data = response.json()
    assert "crops" in data
    assert len(data["crops"]) > 0
    assert "suitabilityScore" in data["crops"][0]

def test_market_optimizer():
    response = client.get("/api/v1/market/compare?crop=Onion&quantity=25")
    assert response.status_code == 200
    data = response.json()
    assert "bestMandi" in data
    assert data["bestMandi"] is not None

def test_scheme_matcher():
    response = client.get("/api/v1/schemes/matched?acres=3.5&crop=Wheat")
    assert response.status_code == 200
    data = response.json()
    assert "schemes" in data
    assert len(data["schemes"]) > 0

def test_daily_plan():
    response = client.get("/api/v1/decisions/daily-plan?crop=Wheat&sowing_days_ago=22")
    assert response.status_code == 200
    data = response.json()
    assert "tasks" in data
    assert len(data["tasks"]) > 0

def test_vision_scan_empty_image():
    """Empty image should return success=false (not fake a disease detection)"""
    response = client.post("/api/v1/vision/scan-frame", json={"imageBase64": "", "cropHint": "Tomato"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False

def test_vision_scan_valid_image():
    """A valid image should return a trained OpenCV model detection result"""
    import base64
    from PIL import Image
    import io
    # Create a small test image (green leaf-like)
    img = Image.new("RGB", (100, 100), (80, 140, 60))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    
    response = client.post("/api/v1/vision/scan-frame", json={"imageBase64": b64, "cropHint": "Tomato"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["isTrainedModel"] is True
    assert "diseaseName" in data
    assert "confidencePercentage" in data
    assert "organicRemedy" in data
