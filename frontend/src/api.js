import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // Enable cookies for authentication
    timeout: 30000,
});

// Inject plan header dynamically (your backend enforces tiers by X-PLAN)
api.interceptors.request.use((config) => {
    let currentPlan = "pro";
    try {
        const storedUser = localStorage.getItem("airscope_user") || localStorage.getItem("user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed?.plan) currentPlan = parsed.plan;
        }
    } catch (e) {
        // ignore JSON parse error
    }
    config.headers["X-PLAN"] = import.meta.env.VITE_PLAN || currentPlan || "pro";
    return config;
});

// Add response interceptor to handle authentication and errors cleanly
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Return structured error for components to handle without forcing hard window reloads
        return Promise.reject(error);
    }
);

export const health = () => api.get("/healthz").then(r => r.data);
export const scrape = (city, days=7) => api.post("/scrape", { city, days }).then(r=>r.data);
export const compareCities = (cities, days=7) => api.post("/compare", { cities, days }).then(r=>r.data);
export const getMeasurements = (city, days=7, pollutant="pm25", aggregation="hourly") =>
    api.get("/measurements", { params: { city, days, pollutant, aggregation } }).then(r => r.data);
export const queryMeasurements = (payload) =>
    api.post("/measurements/query", payload).then(r => r.data);

export const forecastMulti = (cities, horizonDays=7, trainDays=30, use_cache=true) =>
    api.post("/forecast/multi", { cities, horizonDays, trainDays, use_cache }).then(r=>r.data);

export const forecastCity = (city, horizonDays=7, trainDays=30, pollutant="pm25", use_cache=true) =>
    api.post("/forecast", { city, horizonDays, trainDays, pollutant, use_cache }).then(r=>r.data);

export const agentPlan = (prompt) =>
    api.post("/agent/plan", { prompt }).then(r=>r.data);

export const agentExecute = (payload) =>
    api.post("/agent/execute", payload).then(r=>r.data);

export const generateLlmComparisonReport = (reportData) =>
    api.post("/llm-comparison-note", reportData).then(r=>r.data);

export const generateLlmForecastReport = (reportData) =>
    api.post("/llm-forecast-note", reportData).then(r=>r.data);
