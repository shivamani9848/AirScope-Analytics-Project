from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta

def compare_logic(db: Session, cities: list[str], days: int):
    by_city = {}
    want_end = "NOW()"
    want_start = f"DATE_SUB({want_end}, INTERVAL {days} DAY)"
    
    for c in cities:
        rows = []
        try:
            rows = db.execute(text(f"""
                SELECT ts, pm25, pm10
                FROM measurements
                WHERE city=:c AND source='aggregated'
                  AND ts >= {want_start} AND ts <= {want_end}
                ORDER BY ts ASC
            """), {"c": c}).mappings().all()
        except Exception:
            rows = []

        # If database has no records for this window, fetch directly from physical provider
        if not rows:
            try:
                from ..services.geocode import get_coords_for_city
                from ..services.scraper import fetch_open_meteo, flatten_rows
                lat, lon = get_coords_for_city(db, c)
                end_dt = datetime.utcnow().date()
                start_dt = end_dt - timedelta(days=days)
                data = fetch_open_meteo(lat, lon, start_dt.isoformat(), end_dt.isoformat())
                raw_rows = flatten_rows(c, lat, lon, data)
                rows = [
                    {"ts": r["ts"], "pm25": r["pm25"], "pm10": r["pm10"]}
                    for r in raw_rows
                ]
            except Exception as e:
                rows = []

        vals_pm25 = [float(r["pm25"]) for r in rows if r.get("pm25") is not None]
        vals_pm10 = [float(r["pm10"]) for r in rows if r.get("pm10") is not None]

        mean_pm25 = round(sum(vals_pm25) / len(vals_pm25), 2) if vals_pm25 else None
        min_pm25 = round(min(vals_pm25), 2) if vals_pm25 else None
        max_pm25 = round(max(vals_pm25), 2) if vals_pm25 else None

        mean_pm10 = round(sum(vals_pm10) / len(vals_pm10), 2) if vals_pm10 else None
        min_pm10 = round(min(vals_pm10), 2) if vals_pm10 else None
        max_pm10 = round(max(vals_pm10), 2) if vals_pm10 else None

        # Format series with string timestamps and rounded values
        series = [
            {
                "ts": str(r["ts"]).replace("T", " "),
                "pm25": round(float(r["pm25"]), 2) if r.get("pm25") is not None else None,
                "pm10": round(float(r["pm10"]), 2) if r.get("pm10") is not None else None,
            }
            for r in rows
        ]

        by_city[c] = {
            "n_points": len(rows),
            "mean_pm25": mean_pm25,
            "min_pm25": min_pm25,
            "max_pm25": max_pm25,
            "mean_pm10": mean_pm10,
            "min_pm10": min_pm10,
            "max_pm10": max_pm10,
            "unit": "µg/m³",
            "series": series,
            "source": "Open-Meteo European Reanalysis & WMO Ingestion Consensus",
            "latest_ts": series[-1]["ts"] if series else None,
        }

    has_vals = {c: v for c, v in by_city.items() if v["mean_pm25"] is not None}
    best = min(has_vals, key=lambda k: has_vals[k]["mean_pm25"]) if has_vals else None
    worst = max(has_vals, key=lambda k: has_vals[k]["mean_pm25"]) if has_vals else None

    # Sort cities by Mean PM2.5 (lowest is best/cleanest)
    ranked_cities = sorted(
        [{"city": c, "mean_pm25": v["mean_pm25"], "mean_pm10": v["mean_pm10"], "points": v["n_points"]} for c, v in has_vals.items()],
        key=lambda x: x["mean_pm25"]
    )
    for idx, item in enumerate(ranked_cities):
        item["rank"] = idx + 1

    return {
        "days": days,
        "byCity": by_city,
        "best": best,
        "worst": worst,
        "rankings": ranked_cities,
        "metric_used": "Mean PM2.5 (µg/m³) over common observation window",
        "units": "µg/m³",
    }
