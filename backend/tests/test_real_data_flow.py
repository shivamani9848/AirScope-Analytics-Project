import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_health_endpoint(client):
    res = client.get("/healthz")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "upstream" in data

def test_historical_measurements_single_city(client):
    # Test London PM2.5 3-day window
    res = client.get("/measurements?city=London&days=3&pollutant=pm25&aggregation=hourly")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["city"] == "London"
    assert data["pollutant"] == "PM25"
    assert data["unit"] == "µg/m³"
    assert "stats" in data
    stats = data["stats"]
    assert stats["mean"] is not None
    assert stats["min"] is not None
    assert stats["max"] is not None
    assert stats["min"] <= stats["mean"] <= stats["max"]

    # Verify returned series matches stats
    series = data["series"]
    assert len(series) > 0
    assert len(series) == stats["data_points"]
    vals = [pt["value"] for pt in series]
    assert min(vals) == stats["min"]
    assert max(vals) == stats["max"]

def test_pollutant_filter_pm10(client):
    # Test PM10 pollutant filter
    res = client.get("/measurements?city=London&days=3&pollutant=pm10&aggregation=hourly")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["pollutant"] == "PM10"
    assert len(data["series"]) > 0

def test_aggregation_daily(client):
    # Test Daily aggregation
    res = client.get("/measurements?city=London&days=7&pollutant=pm25&aggregation=daily")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["aggregation"] == "daily"
    # 7-day lookback aggregated daily produces <= 8 daily points
    assert 0 < len(data["series"]) <= 8
    first_pt = data["series"][0]
    assert "min" in first_pt
    assert "max" in first_pt
    assert "points" in first_pt

def test_multi_city_comparison_and_rankings(client):
    from app.core.security import create_access_token
    token = create_access_token({"sub": "99", "email": "pro@airscope.local", "plan": "pro"}, 60)
    # Test comparison between London and Delhi with Pro plan authentication
    res = client.post(
        "/compare",
        json={"cities": ["London", "Delhi"], "days": 3},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "rankings" in data
    assert len(data["rankings"]) == 2
    
    # Check rankings order (Rank 1 should have lower mean PM2.5 than Rank 2)
    rank1 = data["rankings"][0]
    rank2 = data["rankings"][1]
    assert rank1["rank"] == 1
    assert rank2["rank"] == 2
    assert rank1["mean_pm25"] <= rank2["mean_pm25"]
    assert data["best"] == rank1["city"]
    assert data["worst"] == rank2["city"]

    # Check series and stats for each city in byCity
    by_city = data["byCity"]
    assert "London" in by_city
    assert "Delhi" in by_city
    assert len(by_city["London"]["series"]) > 0
    assert len(by_city["Delhi"]["series"]) > 0
    assert by_city["London"]["unit"] == "µg/m³"

def test_invalid_city_graceful_handling(client):
    # Test nonexistent city handled gracefully without 500 crash
    res = client.get("/measurements?city=NonExistentCityXYZ999&days=3&pollutant=pm25")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    # Should report 0 data points gracefully
    assert data["stats"]["data_points"] == 0
    assert data["series"] == []
