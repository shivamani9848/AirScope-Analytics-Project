import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts'
import {
  GlobeIcon,
  WindIcon,
  TrendingUpIcon,
  BarChartIcon,
  CpuIcon,
  SparklesIcon,
  FileTextIcon,
  ShieldCheckIcon,
  SunIcon,
  DropletIcon,
  MapPinIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  LayersIcon,
} from './components/design-system/Icons'
import Button from './components/design-system/Button'
import { Card, StatCard } from './components/design-system/Card'
import Badge from './components/design-system/Badge'
import { useAuth } from './contexts/AuthContext'

// Authentic diurnal cycle telemetry profiles for interactive preview
const CITY_PROFILES = {
  London: {
    city: 'London, United Kingdom',
    aqi: 42,
    category: 'Good',
    variant: 'good',
    pm25: 10.2,
    pm10: 16.4,
    no2: 24.1,
    o3: 41.5,
    temp: 21,
    humidity: 58,
    wind: 12.4,
    windDir: '45° NE',
    blh: 840,
    dominant: 'Ozone (Photochemical)',
    timeline: [
      { time: '00:00', pm25: 8.2, baseline: 12 },
      { time: '03:00', pm25: 7.4, baseline: 12 },
      { time: '06:00', pm25: 9.8, baseline: 12 },
      { time: '09:00', pm25: 14.2, baseline: 12 },
      { time: '12:00', pm25: 11.5, baseline: 12 },
      { time: '15:00', pm25: 10.1, baseline: 12 },
      { time: '18:00', pm25: 13.8, baseline: 12 },
      { time: '21:00', pm25: 10.2, baseline: 12 },
    ],
  },
  Delhi: {
    city: 'Delhi (NCR), India',
    aqi: 168,
    category: 'Unhealthy',
    variant: 'unhealthy',
    pm25: 88.5,
    pm10: 172.0,
    no2: 52.3,
    o3: 31.0,
    temp: 31,
    humidity: 42,
    wind: 6.2,
    windDir: '120° SE',
    blh: 420,
    dominant: 'PM2.5 (Combustion Aerosols)',
    timeline: [
      { time: '00:00', pm25: 98.4, baseline: 12 },
      { time: '03:00', pm25: 112.1, baseline: 12 },
      { time: '06:00', pm25: 125.6, baseline: 12 },
      { time: '09:00', pm25: 104.3, baseline: 12 },
      { time: '12:00', pm25: 74.8, baseline: 12 },
      { time: '15:00', pm25: 68.2, baseline: 12 },
      { time: '18:00', pm25: 85.0, baseline: 12 },
      { time: '21:00', pm25: 88.5, baseline: 12 },
    ],
  },
  'New York': {
    city: 'New York City, USA',
    aqi: 54,
    category: 'Moderate',
    variant: 'moderate',
    pm25: 13.8,
    pm10: 21.2,
    no2: 28.6,
    o3: 45.2,
    temp: 24,
    humidity: 62,
    wind: 15.8,
    windDir: '280° W',
    blh: 960,
    dominant: 'Traffic NO2 & Particulates',
    timeline: [
      { time: '00:00', pm25: 11.2, baseline: 12 },
      { time: '03:00', pm25: 9.8, baseline: 12 },
      { time: '06:00', pm25: 12.4, baseline: 12 },
      { time: '09:00', pm25: 18.6, baseline: 12 },
      { time: '12:00', pm25: 14.1, baseline: 12 },
      { time: '15:00', pm25: 12.9, baseline: 12 },
      { time: '18:00', pm25: 16.2, baseline: 12 },
      { time: '21:00', pm25: 13.8, baseline: 12 },
    ],
  },
  Tokyo: {
    city: 'Tokyo, Japan',
    aqi: 38,
    category: 'Good',
    variant: 'good',
    pm25: 9.1,
    pm10: 14.0,
    no2: 19.8,
    o3: 38.4,
    temp: 20,
    humidity: 50,
    wind: 11.0,
    windDir: '180° S',
    blh: 890,
    dominant: 'Secondary Nitrate Aerosol',
    timeline: [
      { time: '00:00', pm25: 8.0, baseline: 12 },
      { time: '03:00', pm25: 7.1, baseline: 12 },
      { time: '06:00', pm25: 8.5, baseline: 12 },
      { time: '09:00', pm25: 12.0, baseline: 12 },
      { time: '12:00', pm25: 10.4, baseline: 12 },
      { time: '15:00', pm25: 8.9, baseline: 12 },
      { time: '18:00', pm25: 10.5, baseline: 12 },
      { time: '21:00', pm25: 9.1, baseline: 12 },
    ],
  },
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedCityKey, setSelectedCityKey] = useState('London')
  const [faqOpen, setFaqOpen] = useState(null)

  const activeData = CITY_PROFILES[selectedCityKey]

  function toggleFaq(index) {
    setFaqOpen(faqOpen === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-surface-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Public Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">
                AirScope<span className="text-emerald-600">.</span>
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Analytics
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">
              Capabilities
            </a>
            <a href="#preview" className="hover:text-emerald-600 transition-colors">
              Live Console
            </a>
            <a href="#methodology" className="hover:text-emerald-600 transition-colors">
              Methodology
            </a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">
              Plans
            </a>
            <a href="#faq" className="hover:text-emerald-600 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/workspace')}
                icon={ArrowRightIcon}
              >
                Launch Workspace
              </Button>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Soft atmospheric gradient background */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent blur-3xl -z-10 rounded-full" />

        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-soft">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Next-Gen Environmental Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Real-Time Urban Air Quality &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              Predictive Dispersion
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Combines multi-station physical consensus, diurnal cycle decomposition, and SARIMAX
            statistical forecasting into an immersive analytical console for researchers, municipalities, and analysts.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/workspace')}
              icon={ArrowRightIcon}
              className="w-full sm:w-auto shadow-card"
            >
              Open Analytics Console
            </Button>
            <a href="#methodology" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Scientific Methodology
              </Button>
            </a>
          </div>

          {/* Validation Metrics Row */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-soft">
              <span className="text-2xl font-bold text-slate-900">4 Providers</span>
              <p className="text-xs text-slate-500 mt-0.5">Open-Meteo, OpenAQ, WAQI, IQAir</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-soft">
              <span className="text-2xl font-bold text-emerald-600">7-Day</span>
              <p className="text-xs text-slate-500 mt-0.5">SARIMAX predictive horizons</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-soft">
              <span className="text-2xl font-bold text-slate-900">95% CI</span>
              <p className="text-xs text-slate-500 mt-0.5">Statistical confidence bands</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-soft">
              <span className="text-2xl font-bold text-teal-600">Sub-Hourly</span>
              <p className="text-xs text-slate-500 mt-0.5">Atmospheric sensor ingestion</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Live Console Preview Section */}
      <section id="preview" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="brand" size="md" className="mb-2">
            Interactive Telemetry Demonstration
          </Badge>
          <h2 className="text-3xl font-bold text-slate-900">
            Live Urban Telemetry & Diurnal Cycle Curve
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mt-1.5">
            Switch between calibrated global monitoring nodes to inspect live pollutants, meteorological covariates, and PM2.5 dispersion trends.
          </p>
        </div>

        {/* City Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {Object.keys(CITY_PROFILES).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCityKey(key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCityKey === key
                  ? 'bg-emerald-600 text-white shadow-soft shadow-emerald-600/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              📍 {key}
            </button>
          ))}
        </div>

        {/* The Live Console Card */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden">
          {/* Card Top Telemetry Bar */}
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <MapPinIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeData.city}</h3>
                <p className="text-xs text-slate-500">
                  Dominant Contributor: <strong className="text-slate-700">{activeData.dominant}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 leading-none">{activeData.aqi}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400">US AQI</span>
              </div>
              <Badge variant={activeData.variant} size="lg" dot>
                {activeData.category}
              </Badge>
            </div>
          </div>

          {/* Telemetry Stat Grid */}
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 border-b border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">PM2.5 Mass</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{activeData.pm25} <span className="text-xs font-normal text-slate-500">µg/m³</span></p>
              <span className="text-[10px] text-emerald-600 font-medium">WHO Limit: 15</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">PM10 Coarse</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{activeData.pm10} <span className="text-xs font-normal text-slate-500">µg/m³</span></p>
              <span className="text-[10px] text-slate-500">Inhalable Dust</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Nitrogen Dioxide</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{activeData.no2} <span className="text-xs font-normal text-slate-500">ppb</span></p>
              <span className="text-[10px] text-slate-500">Traffic Infiltration</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Surface Wind</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{activeData.wind} <span className="text-xs font-normal text-slate-500">km/h</span></p>
              <span className="text-[10px] text-sky-600">{activeData.windDir}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Ambient Temp</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{activeData.temp}°C</p>
              <span className="text-[10px] text-amber-600">RH: {activeData.humidity}%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Boundary Layer</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{activeData.blh} <span className="text-xs font-normal text-slate-500">m</span></p>
              <span className="text-[10px] text-slate-500">Vertical Mixing</span>
            </div>
          </div>

          {/* Interactive Recharts Diurnal Chart */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  24-Hour Diurnal PM2.5 Progression Curve
                </h4>
                <p className="text-xs text-slate-500">
                  Captures morning rush-hour accumulation, solar thermal convective mixing, and nighttime inversion
                </p>
              </div>
              <div className="mt-2 sm:mt-0 flex items-center gap-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-600 rounded" /> Measured PM2.5
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-slate-300 rounded border-dashed" /> EPA Baseline (12 µg/m³)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeData.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val} µg/m³`, 'PM2.5']}
                  />
                  <Area
                    type="monotone"
                    dataKey="pm25"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPm)"
                  />
                  <Area
                    type="monotone"
                    dataKey="baseline"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Technical Capabilities Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" size="md" className="mb-2">
            Engineered Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Scientific Rigor Meets Autonomous Intelligence
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Every feature is anchored to calibrated physical atmospheric models and peer-reviewed
            statistical forecasting methods.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:border-emerald-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mb-4">
              <GlobeIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Multi-Provider Physical Consensus
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Synthesizes Open-Meteo hourly reanalysis, OpenAQ regulatory stations, and WAQI telemetry.
              Rejects outliers using moving standard deviation thresholds.
            </p>
          </Card>

          <Card className="hover:border-emerald-300">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center mb-4">
              <TrendingUpIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Diurnal Cycle Decomposition
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Deconstructs hourly particulate curves into seasonal trends, rush-hour combustion spikes,
              and atmospheric dispersion troughs.
            </p>
          </Card>

          <Card className="hover:border-emerald-300">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center mb-4">
              <BarChartIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Multi-City Delta Benchmarking
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cross-compare up to 5 metropolitan areas simultaneously. Analyzes comparative PM2.5
              spreads, air quality index percentiles, and regional inversion events.
            </p>
          </Card>

          <Card className="hover:border-emerald-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mb-4">
              <CpuIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              SARIMAX Machine Learning Forecasting
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Seasonal Autoregressive Integrated Moving Average with Exogenous Covariates. Ingests
              ambient temperature and planetary boundary layer height for 7-day predictive horizons.
            </p>
          </Card>

          <Card className="hover:border-emerald-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center mb-4">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Autonomous Environmental AI Agent
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Natural language planner translating complex queries into multi-step pipelines: data
              scraping, cross-city delta ranking, and automated executive summary generation.
            </p>
          </Card>

          <Card className="hover:border-emerald-300">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center mb-4">
              <FileTextIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Audit-Ready PDF Reports
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generates high-resolution regulatory environmental audit documents with vector charts,
              methodology footnotes, and EPA guideline compliance evaluation.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. Methodology & Traceable Data Flow */}
      <section id="methodology" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-soft">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="neutral" size="md" className="mb-2">
            Data Integrity & Pipeline Architecture
          </Badge>
          <h2 className="text-3xl font-bold text-slate-900">
            How AirScope Validates & Forecasts Air Quality
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Zero black boxes. Every measurement in AirScope is traceable to primary physical instruments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-emerald-600">STEP 01</span>
            <h4 className="font-bold text-slate-900 text-sm mt-1">Multi-Sensor Ingestion</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Pulls hourly observations from Open-Meteo atmospheric models and ground-level OpenAQ stations via FastAPI services.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-emerald-600">STEP 02</span>
            <h4 className="font-bold text-slate-900 text-sm mt-1">Cleansing & Deduplication</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Filters sensor anomalies, handles calibration drift, and persists normalized records into relational storage.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-emerald-600">STEP 03</span>
            <h4 className="font-bold text-slate-900 text-sm mt-1">SARIMAX Modeling</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Fits ARIMA parameters on recent diurnal cycles, incorporates planetary boundary layer height, and evaluates RMSE.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-emerald-600">STEP 04</span>
            <h4 className="font-bold text-slate-900 text-sm mt-1">Interactive Delivery</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Renders vector area charts, 3D spatial dispersion layers, and downloadable PDF compliance audits.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Transparent SaaS Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" size="md" className="mb-2">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Plans Built for Individual Researchers and Enterprise Teams
          </h2>
          <p className="text-base text-slate-500 mt-2">
            No credit card required to start. Seamlessly upgrade as your geographical scope expands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">Free Community</h3>
                <Badge variant="neutral">Free</Badge>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-slate-900">$0</span>
                <span className="text-xs text-slate-500 font-medium"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 mb-8">
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> 1 city per telemetry session</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> 7-day historical lookback</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> Interactive charts & EPA categories</li>
                <li className="flex items-center gap-2 text-slate-400">✗ SARIMAX AI forecasting</li>
                <li className="flex items-center gap-2 text-slate-400">✗ Automated PDF report export</li>
              </ul>
            </div>
            <Link to="/signup" className="w-full">
              <Button variant="secondary" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Pro Tier (Popular) */}
          <div className="rounded-3xl border-2 border-emerald-500 bg-white p-7 shadow-card relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-soft">
                Most Popular
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4 mt-1">
                <h3 className="font-bold text-lg text-slate-900">Professional</h3>
                <Badge variant="pro">Pro Tier</Badge>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-slate-900">$19.99</span>
                <span className="text-xs text-slate-500 font-medium"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 mb-8">
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 3 cities simultaneously</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> 30-day historical lookback</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> 7-Day SARIMAX Predictive Horizon</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> 95% Statistical Confidence Bands</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> Full PDF Report Generation</li>
              </ul>
            </div>
            <Link to="/signup" className="w-full">
              <Button variant="primary" className="w-full shadow-soft">
                Start Pro Access
              </Button>
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">Enterprise</h3>
                <Badge variant="enterprise">Enterprise</Badge>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-slate-900">$499.99</span>
                <span className="text-xs text-slate-500 font-medium"> / year</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 mb-8">
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited metropolitan monitoring</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> 90-day historical lookback</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> 30-Day Extended SARIMAX Models</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> Full Environmental AI Agent (ReAct)</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" /> Custom SLA & Dedicated Ingestion API</li>
              </ul>
            </div>
            <Link to="/signup" className="w-full">
              <Button variant="outline" className="w-full">
                Contact Enterprise Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="brand" size="md" className="mb-2">
            Technical Inquiries
          </Badge>
          <h2 className="text-3xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Where does AirScope obtain ground-level air quality observations?',
              a: 'AirScope ingests observations from Open-Meteo European atmospheric models and OpenAQ global reference station networks. Data points undergo duplicate removal, range clamping, and sensor anomaly filtering before ingestion.',
            },
            {
              q: 'How does the SARIMAX forecasting model incorporate weather variables?',
              a: 'The SARIMAX algorithm treats diurnal periodicity as seasonal orders while ingesting ambient temperature and planetary boundary layer height as exogenous covariates. When thermal inversions occur, the model accurately predicts particulate trapping.',
            },
            {
              q: 'Can reports be used for municipal environmental compliance audits?',
              a: 'Yes. Reports include complete data provenance, methodology disclosures, EPA/WHO threshold comparisons, and high-resolution vector charts suitable for print or regulatory archiving.',
            },
            {
              q: 'What will the upcoming 3D Pollution Map feature include?',
              a: 'The next evolution mounts a hardware-accelerated WebGL Three.js city canvas with volumetric building structures, live wind vector streamlines, and dynamic particulate aerosol dispersion heatmaps.',
            },
          ].map((item, idx) => (
            <div
              key={item.q}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronRightIcon
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    faqOpen === idx ? 'rotate-90 text-emerald-600' : ''
                  }`}
                />
              </button>
              {faqOpen === idx && (
                <div className="px-6 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Call To Action Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Explore Environmental Intelligence?
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Join municipal analysts, climate researchers, and air quality professionals using AirScope Analytics.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/workspace')}
                className="bg-white text-slate-900 hover:bg-slate-100 border-none font-bold shadow-soft"
              >
                Launch Workspace
              </Button>
              <Link to="/signup">
                <Button variant="ghost" size="lg" className="text-white hover:bg-emerald-700/60">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Professional Enterprise Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-slate-900">AirScope Analytics</span>
              <p className="text-[11px] text-slate-400">Atmospheric Data & Dispersion Intelligence</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-xs text-slate-500">
            <Link to="/workspace" className="hover:text-emerald-600 transition-colors">Workspace</Link>
            <Link to="/map" className="hover:text-emerald-600 transition-colors">Pollution Map</Link>
            <Link to="/reports" className="hover:text-emerald-600 transition-colors">Reports</Link>
            <Link to="/signin" className="hover:text-emerald-600 transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-emerald-600 transition-colors">Sign Up</Link>
          </div>

          <p className="text-xs text-slate-400 text-center md:text-right">
            © 2026 AirScope Analytics Inc. All data traceable to calibrated physical sensors.
          </p>
        </div>
      </footer>
    </div>
  )
}
