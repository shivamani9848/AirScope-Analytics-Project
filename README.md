# 🌍 AirScope Analytics – Environmental Intelligence & 3D Pollution Monitoring Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev)
[![Three.js](https://img.shields.io/badge/Three.js-3D_WebGL-000000.svg)](https://threejs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-19%2F19%20Passing-brightgreen.svg)]()

AirScope Analytics is a full-stack environmental intelligence platform combining authentic atmospheric telemetry, interactive 3D urban pollution dispersion modeling, statistical SARIMAX forecasting, multi-city comparative analytics, automated regulatory audit reports, and a local LLM-powered planning agent.

---

## 📑 Feature Status Matrix

| Feature | Route | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Landing Page** | `/home` | ✅ **Implemented & Verified** | Public responsive showcase with interactive telemetry profiles |
| **Authentication & Session** | `/signin`, `/signup` | ✅ **Implemented & Verified** | Secure `HttpOnly` cookies, bcrypt password hashing, 8+ char policy |
| **Account & Security Settings** | `/account` | ✅ **Implemented & Verified** | Password change endpoint, masked API key, plan matrix |
| **3D Urban Pollution Map** | `/dashboard`, `/map` | ✅ **Implemented & Verified** | Interactive Three.js isometric city, AQI building coloring, 2D fallback |
| **Historical Trends Analysis** | `/trends` | ✅ **Implemented & Verified** | Diurnal cycle charts, hourly/daily aggregations, EPA AQI calculations |
| **Multi-City Comparison** | `/compare` | ✅ **Implemented & Verified** | Delta benchmarks, pollutant rank comparisons (Pro plan tier) |
| **SARIMAX Predictive Horizon**| `/forecast` | ✅ **Implemented & Verified** | 95% Confidence intervals, backtest metrics (MAE/RMSE), Open-Meteo fallback |
| **Compliance Reports Engine** | `/reports` | ✅ **Implemented & Verified** | On-demand parameter configuration (city, days, pollutant), PDF / print view |
| **Regulatory Print Views** | `/print-*` | ✅ **Implemented & Verified** | Headless print CSS, vector SVG charts preserved, ISO/EPA format |
| **AI Environmental Agent** | `/ai-insights` | ⚠️ **Conditional (Enterprise)** | Requires local Ollama instance (`gemma3:4b`); graceful error banner when offline |
| **Data Ingestion Hub** | `/workspace` | ✅ **Implemented & Verified** | Multi-source ingestion triggers for Open-Meteo, OpenAQ, IQAir, and WAQI |

---

## 🧱 System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│  React 18 SPA + Vite + Tailwind CSS + Framer Motion (Page Transitions)  │
│  - 3D Digital Twin: Three.js WebGL Low-Poly Isometric City             │
│  - Data Visualizations: Recharts Composed/Line/Area/Bar Charts        │
│  - Tier Gating: Client-side route guards + server-side token claims    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / Secure Cookies
┌───────────────────────────────────▼────────────────────────────────────┐
│                        APPLICATION LAYER                               │
│  FastAPI (Python 3.12) with Modular Async Routers                      │
│  - /auth: HttpOnly cookie issuance, bcrypt hashing, tier anti-spoofing │
│  - /measurements: Open-Meteo & OpenAQ telemetry with cached fallback   │
│  - /compare: Multi-city delta calculations & statistical ranking       │
│  - /forecast: SARIMAX forecasting, backtesting, physical [0, ∞) bounds │
│  - /report: Headless regulatory PDF generation & print-ready endpoints │
│  - /agent: Local LLM planner with MCP-style tool execution traces      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQLAlchemy ORM (MySQL + SQLite)
┌───────────────────────────────────▼────────────────────────────────────┐
│                          DATA LAYER                                    │
│  - Production: MySQL 8.0 with pooled connections & utf8mb4 charset     │
│  - Testing / Local Dev: In-memory SQLite with BigInteger compatibility │
│  - Outlier Filtering: Z-Score & IQR anomaly removal algorithms         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

- **Frontend:**
  - React 18, Vite 5, Tailwind CSS
  - Three.js (r128) for 3D urban pollution rendering
  - Recharts for time-series charts, confidence intervals, and delta distributions
  - Framer Motion for page route transitions, modal reveals, and staggered card entrances
- **Backend:**
  - FastAPI (Python 3.12), Uvicorn ASGI server
  - SQLAlchemy ORM with MySQL and SQLite dual-dialect compatibility
  - Statsmodels (SARIMAX) & Pandas / NumPy for statistical time-series modeling
  - ReportLab for server-side regulatory PDF generation
  - PyJWT & bcrypt for zero-dependency password security and token cryptography
- **External Providers:**
  - Open-Meteo Air Quality API (No API key required; primary real-time source)
  - OpenAQ, IQAir, WAQI (Optional secondary data sources)
  - Ollama with `gemma3:4b` for local offline LLM intelligence

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** v18+ (tested with v20+)
- **Python** 3.11 or 3.12
- *(Optional)* **MySQL** 8.0 (backend falls back gracefully when DB is offline)
- *(Optional)* **Ollama** running locally for `/ai-insights`

---

### 2. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create & activate virtual environment (optional but recommended)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your secret keys and database credentials

# Run backend test suite (19 tests)
python -m pytest tests/ -v

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

FastAPI interactive documentation will be available at: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup

```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Configure environment variables
cp .env.example .env
# Default points to VITE_API_URL=http://localhost:8000

# Run frontend development server
npm run dev

# Or build for production
npm run build
```

The frontend SPA will be accessible at: `http://localhost:5173`

---

## 🔐 Security & Access Control

### Role-Based Access Hierarchy
1. **Free Tier:**
   - 3D Pollution Dashboard (`/dashboard`, `/map`)
   - Single-city real-time telemetry search
   - Account settings & profile management
2. **Pro Tier:**
   - Historical Trends Analysis with date/aggregation filters (`/trends`)
   - Multi-City Comparison & Ranking (`/compare`)
   - 7-Day SARIMAX Predictive Forecasting (`/forecast`)
   - Compliance report generation and PDF exports (`/reports`)
3. **Enterprise Tier:**
   - AI Environmental Agent with tool orchestration traces (`/ai-insights`)
   - Extended 30-day forecast horizons and custom training windows

### Security Protections Verified
- **Server-Side Enforcement:** Route protections and tier limitations are enforced at the API layer (`require_auth_user`, `enforce_tier`). Client headers cannot spoof higher plans.
- **Password Strength:** Minimum 8 characters requiring both letters and numbers/symbols.
- **Session Security:** `HttpOnly` cookie issuance with configurable `SameSite` and `Secure` flags.
- **Zero Exposed Secrets:** Production builds do not bundle credentials or API keys.

---

## 🧪 Testing & Verification Results

All tests have been executed and verified in this environment:

```
tests/test_auth_security.py::test_signup_validation_weak_password PASSED
tests/test_auth_security.py::test_signup_successful_and_cookie_issuance PASSED
tests/test_auth_security.py::test_duplicate_signup_conflict PASSED
tests/test_auth_security.py::test_login_invalid_credentials PASSED
tests/test_auth_security.py::test_login_success_and_me_profile PASSED
tests/test_auth_security.py::test_logout_clears_session_cookie PASSED
tests/test_auth_security.py::test_unauthenticated_protected_route_rejection PASSED
tests/test_auth_security.py::test_expired_token_rejection PASSED
tests/test_auth_security.py::test_tampered_token_signature_rejection PASSED
tests/test_auth_security.py::test_plan_restriction_free_user_on_pro_features PASSED
tests/test_auth_security.py::test_plan_restriction_free_and_pro_on_enterprise_agent PASSED
tests/test_auth_security.py::test_anti_spoofing_authenticated_plan_overrides_client_header PASSED
tests/test_auth_security.py::test_password_change_requires_valid_current_password PASSED
tests/test_real_data_flow.py::test_health_endpoint PASSED
tests/test_real_data_flow.py::test_historical_measurements_single_city PASSED
tests/test_real_data_flow.py::test_pollutant_filter_pm10 PASSED
tests/test_real_data_flow.py::test_aggregation_daily PASSED
tests/test_real_data_flow.py::test_multi_city_comparison_and_rankings PASSED
tests/test_real_data_flow.py::test_invalid_city_graceful_handling PASSED

================== 19 passed, 0 errors in 68.38s ==================
```

Frontend production build status:
- **Build tool:** Vite v7.1.4
- **Modules transformed:** 1,310 modules
- **Status:** Exit code 0 (18.94s)
- **Code splitting:** 12 chunks lazy-loaded via `React.lazy()` with zero build errors

---

## 🌐 Production Deployment Recommendations

1. **Reverse Proxy (Nginx / Caddy):**
   - Route `/api/*` and `/auth/*` to FastAPI on port 8000.
   - Serve frontend `dist/` static assets directly with caching headers.
   - Configure HTTPS/SSL certificates via Let's Encrypt.
2. **Environment Configuration:**
   - In production, set `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none` (or `lax` if served on the same parent domain).
   - Generate a cryptographically secure 64-byte `JWT_SECRET`: `openssl rand -hex 32`.
3. **Database Maintenance:**
   - Run migrations against MySQL 8.0: `python -c "from app.models import Base; from app.db import engine; Base.metadata.create_all(bind=engine)"`.

---

## 📜 License & Attribution

Developed as an environmental intelligence system for academic and industrial research. All real-time telemetry is sourced with attribution from Open-Meteo, OpenAQ, and regional monitoring networks.
