import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db import get_db
from app.models import Base, Measurement
from app.services.forecast import (
    ALLOWED_POLLUTANTS,
    validate_pollutant,
    forecast_city,
)
from app.services.scraper import upsert_rows
from app.core.security import get_plan, create_access_token

TEST_SQLITE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 1. Strict Pollutant Allowlist & Parameter Bug Tests
# ---------------------------------------------------------------------------
def test_pollutant_allowlist_valid():
    """Valid pollutants in ALLOWED_POLLUTANTS must normalize to lowercase."""
    assert validate_pollutant("pm25") == "pm25"
    assert validate_pollutant("PM25") == "pm25"
    assert validate_pollutant("pm10") == "pm10"
    assert validate_pollutant("PM10") == "pm10"

def test_pollutant_allowlist_rejects_invalid_names():
    """Unapproved pollutants (e.g. ozone, co2, so2) must raise ValueError."""
    for invalid in ["ozone", "co2", "no2", "so2", "pm1", "voc", "temperature"]:
        with pytest.raises(ValueError, match="Allowed pollutants"):
            validate_pollutant(invalid)

def test_pollutant_allowlist_rejects_booleans():
    """
    Passing a boolean (e.g. use_cache passed as pollutant) must raise ValueError,
    and NOT silently interpret True as a pollutant name.
    """
    with pytest.raises(ValueError, match="Invalid pollutant type"):
        validate_pollutant(True)
    with pytest.raises(ValueError, match="Invalid pollutant type"):
        validate_pollutant(False)

def test_forecast_city_rejects_boolean_pollutant(test_db):
    """Calling forecast_city with boolean pollutant raises explicit ValueError."""
    with pytest.raises(ValueError, match="received boolean for 'pollutant'"):
        forecast_city(test_db, "London", pollutant=True)

def test_api_rejects_invalid_pollutant_in_forecast(client):
    """API endpoint /forecast rejects unapproved pollutants with HTTP 422 validation error."""
    pro_token = create_access_token({"sub": "1", "email": "pro@airscope.local", "plan": "pro"}, 60)
    res = client.post(
        "/forecast",
        json={"city": "London", "horizonDays": 3, "trainDays": 14, "pollutant": "unsupported_pol"},
        headers={"Authorization": f"Bearer {pro_token}"}
    )
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# 2. Dual-Dialect Upsert & SQLite Data Integrity
# ---------------------------------------------------------------------------
def test_dual_dialect_upsert_on_sqlite(test_db):
    """Verify upsert_rows functions on SQLite without MySQL ON DUPLICATE KEY errors."""
    now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    row = {
        "ts": now_ts,
        "city": "London",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "pm25": 14.5,
        "pm10": 22.0,
        "source": "aggregated"
    }

    # First insert
    count1 = upsert_rows(test_db, [row])
    assert count1 == 1

    # Verify record in DB
    rec = test_db.query(Measurement).filter(Measurement.city == "London").first()
    assert rec is not None
    assert rec.pm25 == 14.5

    # Upsert with updated concentration
    updated_row = dict(row)
    updated_row["pm25"] = 19.8
    count2 = upsert_rows(test_db, [updated_row])
    assert count2 == 1

    # Verify updated in DB without duplicate row creation
    all_recs = test_db.query(Measurement).filter(Measurement.city == "London").all()
    assert len(all_recs) == 1
    assert all_recs[0].pm25 == 19.8


# ---------------------------------------------------------------------------
# 3. Security: Anti-Spoofing & Unauthenticated Plan Default
# ---------------------------------------------------------------------------
def test_unauthenticated_client_x_plan_header_strictly_ignored(client):
    """
    An unauthenticated request with 'X-PLAN: enterprise' must be treated strictly as 'free',
    preventing arbitrary tier escalation.
    """
    # Attempt multi-city compare without signing in, but with X-PLAN header
    res = client.post(
        "/compare",
        json={"cities": ["London", "Paris", "Berlin"], "days": 3},
        headers={"X-PLAN": "enterprise"}
    )
    # Must be 403 Forbidden because unauthenticated users are evaluated as 'free'
    assert res.status_code == 403
    assert "Free plan" in res.json()["detail"]
