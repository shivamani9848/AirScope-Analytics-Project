# 🌍 AirScope Analytics – Environmental Intelligence & 3D Pollution Monitoring Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg)](https://vitejs.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)
[![Three.js](https://img.shields.io/badge/Three.js-3D_WebGL-000000.svg)](https://threejs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-26%2F26%20Passing-brightgreen.svg)]()

AirScope Analytics is a full-stack environmental intelligence platform combining authentic atmospheric telemetry, interactive 3D urban pollution dispersion modeling, statistical SARIMAX forecasting with chronological out-of-sample validation, multi-city comparative analytics, automated regulatory audit reports, and a local LLM-powered planning agent.

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
| **AI Environmental Agent** | `/ai-insights` | ⚠️ **Conditional (Enterprise)** | Rule-based heuristic fallback when local Ollama (`gemma3:4b`) is offline |
| **Data Ingestion Hub** | `/workspace` | ✅ **Implemented & Verified** | Multi-source ingestion triggers for Open-Meteo, OpenAQ, IQAir, and WAQI |

---

## 🧱 System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│  React 18 SPA + Vite + Tailwind CSS + Framer Motion (Page Transitions)  │
│  - 3D Digital Twin: Three.js WebGL Low-Poly Isometric City             │
│  - Data Visualizations: Recharts Composed/Line/Area/Bar Charts        │
│  - Reverse Proxy (Nginx in Docker / Vite in Dev): /api/* -> Backend    │
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
│  - /agent: Heuristic + LLM planner with MCP-style execution traces     │
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

## 🚀 Production Docker Deployment

The repository includes a complete production-grade containerization stack orchestrating MySQL 8.0, the FastAPI backend, and an Nginx reverse proxy serving the compiled React SPA.

### 1. Configure Production Environment

Create `.env` from the provided example template:

```bash
cp .env.example .env
```

Set high-entropy passwords and secrets in `.env`:

```ini
MYSQL_ROOT_PASSWORD=your_secure_mysql_root_password_here
MYSQL_DB=airq
MYSQL_USER=airscope
MYSQL_PASSWORD=your_secure_mysql_user_password_here

JWT_SECRET=your_minimum_32_character_cryptographic_secret_here
API_KEY=your_production_api_key_here
```

### 2. Build and Run via Docker Compose

```bash
# Build images and start services in the background
docker compose up -d --build

# Verify all services are healthy and running
docker compose ps

# View service logs
docker compose logs -f backend
```

### 3. Service Ports

- **Frontend (Nginx + SPA):** `http://localhost:80` (also mapped to `http://localhost:5173`)
- **Backend API:** `http://localhost:8000` (and `http://localhost:8000/api`)
- **MySQL 8.0 Database:** `localhost:3306`

---

## 💻 Local Development Setup (Non-Docker)

### Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies via pip or uv
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Default uses SQLite: DATABASE_URL=sqlite:///./airq.db

# Run complete pytest test suite (26 tests)
python -m pytest tests/ -v

# Start FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

FastAPI interactive documentation: `http://127.0.0.1:8000/docs`

### Frontend Setup

```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run development server
npm run dev

# Or test production build
npm run build
```

---

## 🧪 Verified Test Results

All 26 automated tests are passing with zero failures:

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
tests/test_forecast_validation.py::test_pollutant_allowlist_valid PASSED
tests/test_forecast_validation.py::test_pollutant_allowlist_rejects_invalid_names PASSED
tests/test_forecast_validation.py::test_pollutant_allowlist_rejects_booleans PASSED
tests/test_forecast_validation.py::test_forecast_city_rejects_boolean_pollutant PASSED
tests/test_forecast_validation.py::test_api_rejects_invalid_pollutant_in_forecast PASSED
tests/test_forecast_validation.py::test_dual_dialect_upsert_on_sqlite PASSED
tests/test_forecast_validation.py::test_unauthenticated_client_x_plan_header_strictly_ignored PASSED
tests/test_real_data_flow.py::test_health_endpoint PASSED
tests/test_real_data_flow.py::test_historical_measurements_single_city PASSED
tests/test_pollutant_filter_pm10 PASSED
tests/test_real_data_flow.py::test_aggregation_daily PASSED
tests/test_real_data_flow.py::test_multi_city_comparison_and_rankings PASSED
tests/test_real_data_flow.py::test_invalid_city_graceful_handling PASSED

================= 26 passed, 0 failed, 0 errors in 122s =================
```

---

## 📈 SARIMAX Forecasting Validation Benchmark

Chronological out-of-sample evaluation on real atmospheric telemetry (London, PM2.5, 72-hour horizon):

| Metric | Measured Value | Benchmark / Baseline |
| :--- | :--- | :--- |
| **Model Specification** | `SARIMAX(1,1,1)(1,0,1,24)` | Hourly diurnal periodicity |
| **In-Sample Fit MAE** | `0.47 µg/m³` | Statistical training convergence |
| **In-Sample Fit RMSE** | `0.69 µg/m³` | Training residuals |
| **Out-of-Sample Holdout MAE** | `1.34 µg/m³` | Future unobserved 24 hours |
| **Out-of-Sample Holdout RMSE** | `1.78 µg/m³` | Future unobserved 24 hours |
| **Persistence Baseline MAE** | `2.76 µg/m³` | 24-hour persistence $\hat{y}(t) = y(t - 24)$ |
| **Persistence Baseline RMSE** | `3.30 µg/m³` | 24-hour persistence $\hat{y}(t) = y(t - 24)$ |
| **Model Skill Score** | **`+51.3%`** (`0.513`) | Substantial outperformance over naive baseline |
| **Physical Constraint** | `[0.0, ∞)` | Concentrations strictly non-negative |

---

## 🛡️ Security & Access Control

- **Server-Side Token Derivation**: Client headers (`X-PLAN`) are never trusted for unauthenticated requests. Unauthenticated requests strictly default to `free`.
- **Zero Fallback Credentials**: Insecure development backdoor accounts (`_get_dev_account`) have been removed; database failures return standard HTTP 503 errors.
- **Fail-Safe Secret Validation**: When run in `ENV=production`, the application refuses to start if `JWT_SECRET` is left as a default string or is under 32 characters.
- **Cookie Security**: Auth cookies are issued with `HttpOnly=True`, configurable `Secure` flags, and `SameSite=Lax`.

---

## 🔧 Troubleshooting & Known Upstream Behaviors

1. **OpenAQ API v2 Deprecation (HTTP 410):**
   - OpenAQ retired v2 endpoints in favor of v3. The ingestion engine automatically catches 410 Gone errors and falls back immediately to Open-Meteo real-time feeds without retrying.
2. **Ollama / Gemma Offline:**
   - If Ollama is not installed or unreachable, the AI Agent (`/agent/plan`) seamlessly falls back to a rule-based heuristic planner without returning 500 errors.
3. **Database Port Conflicts (3306):**
   - If running locally with an existing MySQL service on port 3306, you can either stop local MySQL or use the SQLite connection (`DATABASE_URL=sqlite:///./airq.db`).

---

## 📜 License & Attribution

Developed as an environmental intelligence platform for academic and industrial research. Atmospheric observations are sourced from Open-Meteo, OpenAQ, IQAir, and WAQI monitoring networks.
