from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta, timezone
import math
import os
from typing import Optional, List

from ..db import get_db
from ..schemas import CityWindowIn, CompareIn, MeasurementQueryIn
from ..core.security import get_plan, Plan
from ..core.tiers import enforce_scrape, enforce_compare
from ..services.scraper import ensure_window_for_city, ensure_window_for_city_with_counts, fetch_open_meteo, flatten_rows
from ..services.geocode import get_coords_for_city
from ..utils.compare import compare_logic

router = APIRouter()

@router.post("/scrape")
def scrape_city(payload: CityWindowIn, request: Request, plan: Plan = Depends(get_plan), db: Session = Depends(get_db)):
    enforce_scrape(plan, payload.days)
    inserted, (lat, lon) = ensure_window_for_city(db, payload.city, payload.days, payload.sources)
    return {"ok": True, "city": payload.city, "inserted": inserted, "lat": lat, "lon": lon}

@router.post("/compare")
def compare_cities(payload: CompareIn, request: Request, plan: Plan = Depends(get_plan), db: Session = Depends(get_db)):
    if not payload.cities:
        raise HTTPException(400, "No cities provided")
    enforce_compare(plan, payload.cities, payload.days)
    for c in payload.cities:
        try:
            ensure_window_for_city(db, c, payload.days, None)
        except Exception:
            pass
    return {"ok": True, **compare_logic(db, payload.cities, payload.days)}

@router.post("/scrape/aggregate")
def scrape_city_aggregate(payload: CityWindowIn, request: Request, plan: Plan = Depends(get_plan), db: Session = Depends(get_db)):
    enforce_scrape(plan, payload.days)
    counts, (lat, lon) = ensure_window_for_city_with_counts(db, payload.city, payload.days, payload.sources)
    sources_enabled = payload.sources
    if not sources_enabled:
        env_val = os.getenv('SOURCES_ENABLED', '')
        sources_enabled = [s.strip() for s in env_val.split(',') if s.strip()] or ["openaq", "iqair", "waqi"]
    return {
        "ok": True,
        "city": payload.city,
        "lat": lat,
        "lon": lon,
        "inserted": sum(counts.values()),
        "counts": counts,
        "sources_enabled": sources_enabled,
        "aggregated": counts.get('aggregated', 0),
    }

@router.get("/measurements")
def get_measurements_get(
    city: str = Query(..., description="City name"),
    days: int = Query(7, ge=1, le=90, description="Lookback window in days"),
    pollutant: str = Query("pm25", description="Pollutant (pm25 or pm10)"),
    aggregation: str = Query("hourly", description="Temporal aggregation (hourly, daily, monthly)"),
    plan: Plan = Depends(get_plan),
    db: Session = Depends(get_db)
):
    enforce_scrape(plan, days)
    return _fetch_and_aggregate_measurements(db, city, days, pollutant, aggregation)

@router.post("/measurements/query")
def get_measurements_post(
    payload: MeasurementQueryIn,
    plan: Plan = Depends(get_plan),
    db: Session = Depends(get_db)
):
    enforce_scrape(plan, payload.days)
    return _fetch_and_aggregate_measurements(db, payload.city, payload.days, payload.pollutant, payload.aggregation, payload.sources)

def _fetch_and_aggregate_measurements(
    db: Session,
    city: str,
    days: int,
    pollutant: str,
    aggregation: str,
    sources: Optional[List[str]] = None
):
    # Ensure window is populated
    try:
        ensure_window_for_city(db, city, days, sources)
    except Exception:
        pass

    now_dt = datetime.now(timezone.utc)
    start_dt = now_dt - timedelta(days=days)
    rows = []
    try:
        rows = db.execute(text("""
            SELECT ts, pm25, pm10, source
            FROM measurements
            WHERE city = :c AND source = 'aggregated'
              AND ts >= :start_dt AND ts <= :now_dt
            ORDER BY ts ASC
        """), {"c": city, "start_dt": start_dt, "now_dt": now_dt}).mappings().all()
    except Exception:
        rows = []

    # Provider fallback if DB has no rows or is unreachable
    if not rows:
        try:
            lat, lon = get_coords_for_city(db, city)
            end_dt = datetime.utcnow().date()
            start_dt = end_dt - timedelta(days=days)
            data = fetch_open_meteo(lat, lon, start_dt.isoformat(), end_dt.isoformat())
            raw = flatten_rows(city, lat, lon, data)
            rows = [
                {"ts": r["ts"], "pm25": r["pm25"], "pm10": r["pm10"], "source": "open-meteo"}
                for r in raw
            ]
        except Exception as e:
            rows = []

    pollutant_key = "pm25" if pollutant.lower() == "pm25" else "pm10"

    # Extract valid series points
    raw_series = []
    for r in rows:
        val = r.get(pollutant_key)
        if val is not None:
            raw_series.append({
                "ts": str(r["ts"]).replace("T", " "),
                "value": round(float(val), 2),
                "pm25": round(float(r["pm25"]), 2) if r.get("pm25") is not None else None,
                "pm10": round(float(r["pm10"]), 2) if r.get("pm10") is not None else None,
                "source": r.get("source", "aggregated")
            })

    # Temporal Aggregation
    if aggregation == "daily" and raw_series:
        by_day = {}
        for pt in raw_series:
            d_key = pt["ts"][:10]  # YYYY-MM-DD
            if d_key not in by_day:
                by_day[d_key] = []
            by_day[d_key].append(pt["value"])

        final_series = []
        for d_key, vals in by_day.items():
            final_series.append({
                "ts": d_key,
                "value": round(sum(vals) / len(vals), 2),
                "min": round(min(vals), 2),
                "max": round(max(vals), 2),
                "points": len(vals),
                "source": "daily-aggregated"
            })
    elif aggregation == "monthly" and raw_series:
        by_month = {}
        for pt in raw_series:
            m_key = pt["ts"][:7]  # YYYY-MM
            if m_key not in by_month:
                by_month[m_key] = []
            by_month[m_key].append(pt["value"])

        final_series = []
        for m_key, vals in by_month.items():
            final_series.append({
                "ts": m_key,
                "value": round(sum(vals) / len(vals), 2),
                "min": round(min(vals), 2),
                "max": round(max(vals), 2),
                "points": len(vals),
                "source": "monthly-aggregated"
            })
    else:
        final_series = raw_series

    # Summary Statistics over the filtered series
    stat_vals = [pt["value"] for pt in final_series if pt.get("value") is not None]
    if stat_vals:
        mean_val = round(sum(stat_vals) / len(stat_vals), 2)
        min_val = round(min(stat_vals), 2)
        max_val = round(max(stat_vals), 2)
        variance = sum((x - mean_val) ** 2 for x in stat_vals) / len(stat_vals)
        std_dev = round(math.sqrt(variance), 2)
        latest_ts = final_series[-1]["ts"]
    else:
        mean_val = min_val = max_val = std_dev = latest_ts = None

    return {
        "ok": True,
        "city": city,
        "pollutant": pollutant_key.upper(),
        "unit": "µg/m³",
        "days": days,
        "aggregation": aggregation,
        "stats": {
            "mean": mean_val,
            "min": min_val,
            "max": max_val,
            "std_dev": std_dev,
            "data_points": len(final_series),
            "unit": "µg/m³",
        },
        "data_freshness": {
            "latest_ts": latest_ts,
            "status": "fresh" if latest_ts else "unavailable",
            "coverage_percentage": round((len(stat_vals) / max(1, days * 24)) * 100, 1) if aggregation == "hourly" else 100.0
        },
        "series": final_series,
        "source": "Open-Meteo European Reanalysis & WMO Ingestion Consensus",
        "attribution": "Physical atmospheric telemetry stations (Open-Meteo, OpenAQ, WAQI)",
    }
