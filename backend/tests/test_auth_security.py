import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import jwt

from app.main import app
from app.db import get_db
from app.models import Base, User
from app.core.security import hash_password, create_access_token
from app.core.config import settings

# In-memory SQLite for deterministic, isolated security testing
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
# 1. Registration & Input Validation Tests
# ---------------------------------------------------------------------------
def test_signup_validation_weak_password(client):
    """Ensure weak passwords (<8 chars or missing numbers/letters) are rejected."""
    # Under 8 chars
    res = client.post("/auth/signup", json={"email": "analyst@epa.gov", "password": "short"})
    assert res.status_code == 422

    # Missing numbers/symbols
    res2 = client.post("/auth/signup", json={"email": "analyst@epa.gov", "password": "onlylettershere"})
    assert res2.status_code == 422

def test_signup_successful_and_cookie_issuance(client):
    """Ensure valid signup returns 201 and sets HttpOnly session cookie."""
    res = client.post("/auth/signup", json={"email": "newuser@agency.gov", "password": "SecurePassword123!"})
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "newuser@agency.gov"
    assert data["plan"] == "free"

    # Verify cookie configuration
    cookie = res.cookies.get("airsense_access")
    assert cookie is not None

def test_duplicate_signup_conflict(client):
    """Ensure duplicate email registration returns 409 Conflict."""
    payload = {"email": "duplicate@agency.gov", "password": "SecurePassword123!"}
    res1 = client.post("/auth/signup", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/auth/signup", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]

# ---------------------------------------------------------------------------
# 2. Login, Logout & Session Management Tests
# ---------------------------------------------------------------------------
def test_login_invalid_credentials(client, test_db):
    """Ensure invalid passwords and nonexistent users return 401."""
    # Nonexistent user
    res = client.post("/auth/login", json={"email": "nobody@nowhere.com", "password": "WrongPassword123!"})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

    # Pre-seed user
    hashed = hash_password("CorrectPassword123!")
    user = User(email="testuser@agency.gov", password_hash=hashed, plan="free")
    test_db.add(user)
    test_db.commit()

    # Wrong password for existing user
    res_wrong = client.post("/auth/login", json={"email": "testuser@agency.gov", "password": "IncorrectPassword123!"})
    assert res_wrong.status_code == 401

def test_login_success_and_me_profile(client, test_db):
    """Ensure valid login issues cookie and /auth/me returns authenticated identity."""
    hashed = hash_password("CorrectPassword123!")
    user = User(email="testuser@agency.gov", password_hash=hashed, plan="pro")
    test_db.add(user)
    test_db.commit()

    login_res = client.post("/auth/login", json={"email": "testuser@agency.gov", "password": "CorrectPassword123!"})
    assert login_res.status_code == 200
    assert login_res.json()["plan"] == "pro"
    assert "airsense_access" in login_res.cookies

    # Access /auth/me with session cookie
    me_res = client.get("/auth/me")
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == "testuser@agency.gov"
    assert profile["plan"] == "pro"
    # Never expose password hash
    assert "password_hash" not in profile

def test_logout_clears_session_cookie(client, test_db):
    """Ensure logout removes session cookie."""
    hashed = hash_password("CorrectPassword123!")
    user = User(email="logoutuser@agency.gov", password_hash=hashed, plan="free")
    test_db.add(user)
    test_db.commit()

    client.post("/auth/login", json={"email": "logoutuser@agency.gov", "password": "CorrectPassword123!"})
    logout_res = client.post("/auth/logout")
    assert logout_res.status_code == 200
    assert logout_res.json()["ok"] is True

# ---------------------------------------------------------------------------
# 3. Cryptographic Token & Authorization Tests
# ---------------------------------------------------------------------------
def test_unauthenticated_protected_route_rejection(client):
    """Direct request to /auth/me without token/cookie must return 401."""
    client.cookies.clear()
    res = client.get("/auth/me")
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]

def test_expired_token_rejection(client):
    """Expired JWT must be rejected with 401."""
    past = datetime.now(timezone.utc) - timedelta(minutes=10)
    expired_token = jwt.encode(
        {"sub": "1", "email": "expired@user.com", "plan": "free", "exp": past},
        settings.JWT_SECRET,
        algorithm="HS256"
    )
    client.cookies.set("airsense_access", expired_token)
    res = client.get("/auth/me")
    assert res.status_code == 401

def test_tampered_token_signature_rejection(client):
    """Token signed with wrong key must be rejected with 401."""
    tampered_token = jwt.encode(
        {"sub": "1", "email": "hacker@evil.com", "plan": "enterprise", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        "completely-wrong-signing-secret-32b",
        algorithm="HS256"
    )
    client.cookies.set("airsense_access", tampered_token)
    res = client.get("/auth/me")
    assert res.status_code == 401

# ---------------------------------------------------------------------------
# 4. Plan-Based Authorization & Anti-Spoofing Tests
# ---------------------------------------------------------------------------
def test_plan_restriction_free_user_on_pro_features(client):
    """Free user token must be denied access to Pro features (e.g. reports, forecast, multi-city)."""
    free_token = create_access_token({"sub": "10", "email": "free@user.com", "plan": "free"}, 60)
    client.cookies.set("airsense_access", free_token)

    # 1. Report generation blocked for Free
    res_report = client.post(
        "/report/generate",
        json={"report_type": "comparison", "cities": ["London"], "charts": {}}
    )
    assert res_report.status_code == 403
    assert "Pro" in res_report.json()["detail"]

    # 2. Multi-city comparison blocked for Free (>1 city)
    res_compare = client.post(
        "/compare",
        json={"cities": ["London", "Paris"], "days": 3}
    )
    assert res_compare.status_code == 403
    assert "Free plan supports 1 city only" in res_compare.json()["detail"]

    # 3. Forecasting blocked for Free
    res_forecast = client.post(
        "/forecast",
        json={"city": "London", "horizonDays": 3, "trainDays": 14}
    )
    assert res_forecast.status_code == 403
    assert "Forecasting is a Pro feature" in res_forecast.json()["detail"]

def test_plan_restriction_free_and_pro_on_enterprise_agent(client):
    """Free and Pro users must be denied access to Enterprise AI Agent endpoints."""
    # Test Free user
    free_token = create_access_token({"sub": "10", "email": "free@user.com", "plan": "free"}, 60)
    client.cookies.set("airsense_access", free_token)

    res_agent_free = client.post("/agent/plan", json={"prompt": "Analyze particulate matter in Berlin"})
    assert res_agent_free.status_code == 403
    assert "Enterprise" in res_agent_free.json()["detail"]

    # Test Pro user
    pro_token = create_access_token({"sub": "20", "email": "pro@user.com", "plan": "pro"}, 60)
    client.cookies.set("airsense_access", pro_token)

    res_agent_pro = client.post("/agent/plan", json={"prompt": "Analyze particulate matter in Berlin"})
    assert res_agent_pro.status_code == 403
    assert "Enterprise" in res_agent_pro.json()["detail"]

def test_anti_spoofing_authenticated_plan_overrides_client_header(client):
    """An authenticated Free user sending 'X-PLAN: enterprise' header must STILL be evaluated as 'free'."""
    free_token = create_access_token({"sub": "10", "email": "free@user.com", "plan": "free"}, 60)
    client.cookies.set("airsense_access", free_token)

    # Free user attempts to spoof enterprise tier via header
    res_spoof = client.post(
        "/agent/plan",
        json={"prompt": "Bypass security check"},
        headers={"X-PLAN": "enterprise"}
    )
    # Must STILL reject with 403 because token claim is 'free'
    assert res_spoof.status_code == 403
    assert "Enterprise" in res_spoof.json()["detail"]

def test_password_change_requires_valid_current_password(client, test_db):
    """Ensure authenticated user can only change password with correct current password."""
    hashed = hash_password("OriginalPassword123!")
    user = User(email="pwchange@agency.gov", password_hash=hashed, plan="free")
    test_db.add(user)
    test_db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email, "plan": user.plan}, 60)
    client.cookies.set("airsense_access", token)

    # Bad current password
    bad_res = client.post(
        "/auth/change-password",
        json={"current_password": "WrongPassword123!", "new_password": "BrandNewPassword123!"}
    )
    assert bad_res.status_code == 400
    assert "Current password incorrect" in bad_res.json()["detail"]

    # Valid change
    good_res = client.post(
        "/auth/change-password",
        json={"current_password": "OriginalPassword123!", "new_password": "BrandNewPassword123!"}
    )
    assert good_res.status_code == 200
    assert good_res.json()["ok"] is True
