from pydantic import BaseModel, conint, Field
from typing import Optional, Dict, Any, List, Literal

# Inputs
class CityWindowIn(BaseModel):
    city: str
    days: conint(ge=1, le=90) = 7
    sources: Optional[list[str]] = None

class CompareIn(BaseModel):
    cities: list[str]
    days: conint(ge=1, le=90) = 7

class MeasurementQueryIn(BaseModel):
    city: str
    days: conint(ge=1, le=90) = 7
    pollutant: Literal["pm25", "pm10"] = "pm25"
    aggregation: Literal["hourly", "daily", "monthly"] = "hourly"
    sources: Optional[list[str]] = None

class ForecastIn(BaseModel):
    city: str
    horizonDays: conint(ge=1, le=30) = 7
    trainDays: conint(ge=7, le=120) = 30
    pollutant: Literal["pm25", "pm10"] = "pm25"
    use_cache: bool = True

class ForecastMultiIn(BaseModel):
    cities: list[str]
    horizonDays: conint(ge=1, le=30) = 7
    trainDays: conint(ge=7, le=120) = 30
    pollutant: Literal["pm25", "pm10"] = "pm25"
    use_cache: bool = True

class AgentPlanIn(BaseModel):
    prompt: str = Field(..., description="Natural language task")

class ToolStep(BaseModel):
    name: str
    arguments: dict = {}

class AgentPlanOut(BaseModel):
    plan: list[ToolStep]
    notes: str | None = None
    irrelevant: bool = False
    reason: str | None = None

class AgentExecIn(BaseModel):
    prompt: str | None = None
    plan: list[ToolStep] | None = None

class AgentExecOut(BaseModel):
    answer: str
    trace: list
    final: dict | None = None

class AgentChatIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: Optional[List[Dict[str, str]]] = None

class AgentChatOut(BaseModel):
    ok: bool
    answer: str
    trace: List[Dict[str, Any]] = []
    data_context: Optional[Dict[str, Any]] = None
    status: str = "success"
    error: Optional[str] = None

class ReportRequest(BaseModel):
    report_type: str
    payload: dict
    llm_notes: str | None = None
    chart_images: list[str] | None = None


class ReportIn(BaseModel):
    report_type: Literal["forecast", "comparison", "trends"]
    cities: List[str]
    metrics: Optional[Dict[str, Any]] = None
    stats: Optional[Dict[str, Any]] = None
    charts: Dict[str, str] = {}
    options: Optional[Dict[str, Any]] = None
