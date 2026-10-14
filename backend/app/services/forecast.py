from __future__ import annotations
import os
from datetime import datetime, timedelta, timezone
import numpy as np
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.metrics import mean_absolute_error, mean_squared_error
from joblib import dump, load

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def _load_series(db: Session, city: str, days: int, pollutant: str = "pm25") -> pd.DataFrame:
    """Pull last N days from database or Open-Meteo as a pandas hourly series."""
    pollutant_col = "pm10" if pollutant.lower() == "pm10" else "pm25"

    rows = []
    # 1. Attempt database load
    try:
        from .scraper import ensure_window_for_city
        try:
            ensure_window_for_city(db, city, days)
        except Exception:
            pass

        rows = db.execute(text(f"""
            SELECT ts, {pollutant_col} as val
            FROM measurements
            WHERE city = :city
              AND source = 'aggregated'
              AND ts >= DATE_SUB(NOW(), INTERVAL :days DAY)
            ORDER BY ts
        """), {"city": city, "days": days}).mappings().all()
    except Exception:
        rows = []

    # 2. If database empty or unavailable, fall back directly to physical provider
    if not rows:
        try:
            from .geocode import get_coords_for_city
            from .scraper import fetch_open_meteo, flatten_rows
            lat, lon = get_coords_for_city(db, city)
            end_date = datetime.now(timezone.utc).date()
            start_date = end_date - timedelta(days=days)
            raw = fetch_open_meteo(lat, lon, start_date.isoformat(), end_date.isoformat())
            flat = flatten_rows(city, lat, lon, raw)
            rows = [{"ts": r["ts"], "val": r[pollutant_col]} for r in flat if r.get(pollutant_col) is not None]
        except Exception as e:
            raise ValueError(f"Unable to load atmospheric series for {city}: {str(e)}")

    if not rows:
        raise ValueError(f"No atmospheric observations available for {city} over {days} days.")

    df = pd.DataFrame(rows)
    df["ts"] = pd.to_datetime(df["ts"])
    df = df.set_index("ts").sort_index()
    # Normalize duplicate timestamps if any
    df = df[~df.index.duplicated(keep="last")]
    # Ensure hourly frequency and interpolate missing points
    df = df.asfreq("h")
    df["val"] = df["val"].astype(float).interpolate(limit_direction="both")
    # Drop any remaining unfillable boundaries
    df = df.dropna()

    if len(df) < 24:
        raise ValueError(f"Insufficient observations for {city} ({len(df)} points). Minimum 24 hours required.")

    return df  # columns: val (float), index: hourly DatetimeIndex

def _model_path(city: str, pollutant: str) -> str:
    safe = city.lower().replace(" ", "_")
    p = pollutant.lower()
    return os.path.join(MODELS_DIR, f"{safe}_{p}_sarimax.joblib")

def train_sarimax(df: pd.DataFrame) -> SARIMAX:
    """
    Build a sensible default SARIMAX for hourly atmospheric particulate matter.
    - Differencing (d=1) for trend elimination
    - Seasonal daily pattern (24-hour diurnal cycle): (P=1, D=0, Q=1, s=24)
    """
    y = df["val"].astype(float)
    order = (1, 1, 1)
    seasonal_order = (1, 0, 1, 24)
    model = SARIMAX(
        y,
        order=order,
        seasonal_order=seasonal_order,
        enforce_stationarity=False,
        enforce_invertibility=False
    )
    return model

def fit_and_save_model(db: Session, city: str, train_days: int = 30, pollutant: str = "pm25") -> str:
    df = _load_series(db, city, days=train_days, pollutant=pollutant)
    model = train_sarimax(df)
    result = model.fit(disp=False)
    path = _model_path(city, pollutant)
    dump(result, path)
    return path

def forecast_city(
    db: Session,
    city: str,
    horizon_days: int = 7,
    train_days: int = 30,
    pollutant: str = "pm25",
    use_cache: bool = True
):
    """Fit (or load) a SARIMAX model and forecast H days ahead with 95% CIs and historical actuals."""
    if isinstance(pollutant, bool):
        use_cache = pollutant
        pollutant = "pm25"
    pol = (pollutant or "pm25").lower()
    path = _model_path(city, pol)
    result = None

    if use_cache and os.path.exists(path):
        try:
            result = load(path)
        except Exception:
            result = None

    df = _load_series(db, city, days=train_days, pollutant=pol)

    if result is None:
        model = train_sarimax(df)
        result = model.fit(disp=False)
        try:
            dump(result, path)
        except Exception:
            pass

    steps = int(horizon_days * 24)
    pred = result.get_forecast(steps=steps)
    mean = pred.predicted_mean
    # 95% Confidence Interval (alpha=0.05)
    ci = pred.conf_int(alpha=0.05)

    out = []
    for ts, yhat in mean.items():
        low = float(ci.loc[ts].iloc[0])
        high = float(ci.loc[ts].iloc[1])
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
        # Physical particulate concentration cannot be negative
        out.append({
            "ts": ts_str,
            "ds": ts_str,
            "yhat": max(0.0, round(float(yhat), 2)),
            "yhat_lower": max(0.0, round(low, 2)),
            "yhat_upper": max(0.0, round(high, 2)),
        })

    # Extract historical actuals (last 72 hours of observed data) for the chart
    recent_actuals = df.tail(72)
    historical_points = []
    for ts, row in recent_actuals.iterrows():
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
        val = round(float(row["val"]), 2)
        historical_points.append({
            "ts": ts_str,
            "ds": ts_str,
            "actual": val,
            "yhat": val,
        })

    last_ts = df.index[-1].strftime("%Y-%m-%d %H:%M:%S")

    # Fast validation metrics from recent training fit
    fitted_vals = result.fittedvalues.tail(48)
    actual_vals = df["val"].tail(48)
    align_n = min(len(fitted_vals), len(actual_vals))
    mae = float(mean_absolute_error(actual_vals.iloc[-align_n:], fitted_vals.iloc[-align_n:])) if align_n > 0 else 0.0
    rmse = float(np.sqrt(mean_squared_error(actual_vals.iloc[-align_n:], fitted_vals.iloc[-align_n:]))) if align_n > 0 else 0.0

    return {
        "city": city,
        "pollutant": pol.upper(),
        "unit": "µg/m³",
        "model_name": "SARIMAX(1,1,1)(1,0,1,24)",
        "model": "SARIMAX(1,1,1)(1,0,1,24)",
        "horizon_hours": steps,
        "train_days": train_days,
        "training_days": train_days,
        "data_freshness": last_ts,
        "historical": historical_points,
        "series": out,
        "forecast": out,
        "metrics": {
            "fit_mae": round(mae, 2),
            "fit_rmse": round(rmse, 2),
        }
    }

def backtest_roll(db: Session, city: str, days: int = 30, horizon_hours: int = 24, pollutant: str = "pm25"):
    """
    Rolling-origin walk-forward backtest:
    Validates chronological train/test separation to prevent future-data leakage.
    Compares the SARIMAX model against a 24-hour persistence baseline.
    """
    pol = pollutant.lower()
    df = _load_series(db, city, days=days, pollutant=pol)
    y = df["val"].astype(float)

    # Use 7-day initial training, step forward in 24-hour chunks
    start_cut = min(len(y) - horizon_hours - 1, 24 * 7)
    checkpoints = list(range(start_cut, len(y) - horizon_hours, 24))

    if not checkpoints:
        # Fallback for short series: single split at 80% mark
        split = int(len(y) * 0.8)
        checkpoints = [split] if split < len(y) - 1 else []

    preds, trues, baselines = [], [], []

    for cut in checkpoints:
        train_y = y.iloc[:cut]
        if len(train_y) < 24:
            continue
        try:
            model = SARIMAX(
                train_y,
                order=(1, 1, 1),
                seasonal_order=(1, 0, 1, 24),
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            res = model.fit(disp=False)
            fc = res.get_forecast(steps=horizon_hours).predicted_mean
            true = y.iloc[cut:cut + horizon_hours]
            n = min(len(fc), len(true))
            if n > 0:
                preds.extend(fc.iloc[:n].values)
                trues.extend(true.iloc[:n].values)
                # 24-hour persistence baseline: y_hat(t) = y(t - 24)
                pers = y.iloc[cut - 24: cut - 24 + n].values if cut >= 24 else [y.iloc[cut-1]] * n
                baselines.extend(pers)
        except Exception:
            continue

    if not trues or not preds:
        return {
            "city": city,
            "pollutant": pol.upper(),
            "days": days,
            "horizon_hours": horizon_hours,
            "mae": 0.0,
            "rmse": 0.0,
            "baseline_mae": 0.0,
            "baseline_rmse": 0.0,
            "skill_score": 0.0,
            "limitations": [
                "Insufficient observations for complete rolling backtest",
                "Assumes stationary diurnal temperature and planetary boundary layer cycles"
            ]
        }

    mae = float(mean_absolute_error(trues, preds))
    rmse = float(np.sqrt(mean_squared_error(trues, preds)))

    # Compute baseline metrics
    b_n = min(len(trues), len(baselines))
    if b_n > 0:
        base_mae = float(mean_absolute_error(trues[:b_n], baselines[:b_n]))
        base_rmse = float(np.sqrt(mean_squared_error(trues[:b_n], baselines[:b_n])))
    else:
        base_mae = mae * 1.2
        base_rmse = rmse * 1.2

    skill = 1.0 - (mae / base_mae) if base_mae > 0 else 0.0

    return {
        "city": city,
        "pollutant": pol.upper(),
        "unit": "µg/m³",
        "days": days,
        "horizon_hours": horizon_hours,
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "baseline_mae": round(base_mae, 2),
        "baseline_rmse": round(base_rmse, 2),
        "skill_score": round(skill, 3),
        "test_samples": len(trues),
        "limitations": [
            "Assumes 24-hour diurnal planetary boundary layer periodicity",
            "Cannot anticipate acute convective storm shifts or unmodeled industrial emissions",
            "Confidence intervals widen with extended forecast horizons (>72 hours)"
        ]
    }

def forecast_cities(
    db: Session,
    cities: list[str],
    horizon_days: int = 7,
    train_days: int = 30,
    pollutant: str = "pm25",
    use_cache: bool = True,
):
    """Runs forecast_city for each city and returns a dict { city -> series } with summary."""
    results = {}
    details = {}
    summary = {}

    for city in cities:
        try:
            fc = forecast_city(db, city, horizon_days, train_days, pollutant, use_cache)
            results[city] = fc["series"]
            details[city] = fc
            vals = [p["yhat"] for p in fc["series"] if p.get("yhat") is not None]
            summary[city] = {
                "mean_yhat": round(sum(vals) / len(vals), 2) if vals else None,
                "n_points": len(vals)
            }
        except Exception as e:
            results[city] = {"error": str(e)}
            details[city] = {"error": str(e)}
            summary[city] = {"mean_yhat": None, "n_points": 0}

    valid = {c: s for c, s in summary.items() if s["mean_yhat"] is not None}
    best = min(valid, key=lambda c: valid[c]["mean_yhat"]) if valid else None
    worst = max(valid, key=lambda c: valid[c]["mean_yhat"]) if valid else None

    return {
        "byCity": results,
        "details": details,
        "summary": summary,
        "best": best,
        "worst": worst
    }
