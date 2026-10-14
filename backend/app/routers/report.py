from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json

from ..db import get_db
from ..schemas import ReportIn
from ..core.security import get_plan, Plan
from ..core.tiers import enforce_report, enforce_ai_agent
from ..services.reporter import make_report
from ..services.llama_client import generate_llm_report, generate_llm_forecast_report


router = APIRouter()


@router.post("/report/generate")
def generate_report(payload: ReportIn, request: Request, plan: Plan = Depends(get_plan), db: Session = Depends(get_db)):
    enforce_report(plan)
    pdf_bytes = make_report(payload)
    filename = f"{payload.report_type}_report.pdf"
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.post("/report/{report_kind}")
async def generate_typed_report(report_kind: str, request: Request, plan: Plan = Depends(get_plan), db: Session = Depends(get_db)):
    """Generate regulatory PDF report for /report/comparison, /report/forecast, /report/compliance"""
    enforce_report(plan)
    body = {}
    try:
        body = await request.json()
    except Exception:
        body = {}

    valid_type = "comparison" if "comparison" in report_kind else ("forecast" if "forecast" in report_kind else "trends")
    cities = body.get("cities") or ([body.get("city")] if body.get("city") else ["London"])
    
    report_in = ReportIn(
        report_type=valid_type,
        cities=cities,
        metrics=body.get("metrics") or {"pollutant": body.get("pollutant", "pm25"), "days": body.get("days", 7)},
        stats=body.get("stats") or {cities[0]: {"mean_pm25": 18.5, "min_pm25": 10.2, "max_pm25": 28.4, "n_points": 72}},
        charts=body.get("charts", {}),
        options=body.get("options")
    )
    pdf_bytes = make_report(report_in)
    filename = f"{report_kind}_report.pdf"
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.post("/llm-comparison-note")
def generate_llm_comparison_report(report_data: Dict[str, Any], request: Request, plan: Plan = Depends(get_plan)):
    """
    Generate LLM-powered comparison report using Gemma3:4b (Enterprise tier)
    """
    enforce_ai_agent(plan)
    try:
        # Extract data from the request
        comparison_data = report_data.get("comparisonData", {})
        chart_data = report_data.get("chartData", {})
        cities = report_data.get("cities", [])
        period_days = report_data.get("periodDays", 7)
        show_combined = report_data.get("showCombined", False)
        
        # Generate the LLM report
        llm_response = generate_llm_report(comparison_data, chart_data, cities, period_days, show_combined)
        
        return llm_response
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e)
        if "Failed to communicate with LLM" in err_msg or "Connection refused" in err_msg or "Failed to connect" in err_msg:
            raise HTTPException(
                status_code=503,
                detail="Ollama AI service is offline or unreachable. Please start Ollama with 'ollama run gemma3:4b' or export standard PDF reports."
            )
        raise HTTPException(status_code=500, detail=f"Failed to generate LLM report: {err_msg}")


@router.post("/llm-forecast-note")
def generate_llm_forecast_report_endpoint(report_data: Dict[str, Any], request: Request, plan: Plan = Depends(get_plan)):
    """
    Generate LLM-powered forecast report using Gemma3:4b (Enterprise tier)
    """
    enforce_ai_agent(plan)
    try:
        # Extract data from the request
        forecast_data = report_data.get("forecastData", {})
        chart_data = report_data.get("chartData", {})
        cities = report_data.get("cities", [])
        horizon_days = report_data.get("horizonDays", 7)
        train_days = report_data.get("trainDays", 30)
        show_ci = report_data.get("showCI", False)
        show_combined = report_data.get("showCombined", False)
        selected_model = report_data.get("selectedModel", "sarimax")
        
        # Generate the LLM forecast report
        llm_response = generate_llm_forecast_report(forecast_data, chart_data, cities, horizon_days, train_days, show_ci, show_combined, selected_model)
        
        return llm_response
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e)
        if "Failed to communicate with LLM" in err_msg or "Connection refused" in err_msg or "Failed to connect" in err_msg:
            raise HTTPException(
                status_code=503,
                detail="Ollama AI service is offline or unreachable. Please start Ollama with 'ollama run gemma3:4b' or export standard PDF reports."
            )
        raise HTTPException(status_code=500, detail=f"Failed to generate LLM forecast report: {err_msg}")


