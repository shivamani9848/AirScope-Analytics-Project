import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts'

import AppShell from '../components/layout/AppShell'
import PageHeader from '../components/layout/PageHeader'
import { Card, StatCard } from '../components/design-system/Card'
import Badge from '../components/design-system/Badge'
import Button from '../components/design-system/Button'
import Spinner from '../components/design-system/Spinner'
import {
  CpuIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  DownloadIcon,
  ActivityIcon,
  BarChartIcon,
  LayersIcon,
} from '../components/design-system/Icons'
import { forecastMulti, forecastCity } from '../api'
import { VERIFIED_CITIES } from '../services/environmentalData'

// ─── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: 'easeOut' },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtLabel(ds) {
  if (!ds) return ''
  try {
    const d = new Date(ds)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return ds
  }
}

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function skillColor(score) {
  if (score >= 0.4) return 'text-emerald-700'
  if (score >= 0.2) return 'text-amber-700'
  return 'text-rose-700'
}

function skillBadge(score) {
  if (score >= 0.4) return 'success'
  if (score >= 0.2) return 'warning'
  return 'danger'
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function ForecastTooltip({ active, payload, label, pollutant }) {
  if (!active || !payload?.length) return null
  const unit = pollutant === 'pm10' ? 'PM₁₀' : 'PM₂.₅'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-2">{fmtLabel(label)}</p>
      {payload.map((p) => {
        if (!p || p.value == null) return null
        const name = p.name === 'ci' ? 'CI Band' : p.name === 'actual' ? `${unit} (Historical)` : `${unit} (Forecast)`
        if (p.name === 'ci') return null
        return (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full inline-block" style={{ background: p.stroke || p.fill }} />
              {name}
            </span>
            <span className="font-semibold text-slate-800">{Number(p.value).toFixed(1)} µg/m³</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ForecastingPage() {
  const [selectedCity, setSelectedCity] = useState(VERIFIED_CITIES[0].name)
  const [pollutant, setPollutant] = useState('pm25')
  const [horizon, setHorizon] = useState(3)
  const [trainDays, setTrainDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)   // single city result object
  const [error, setError] = useState(null)

  const runForecast = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      let entry = null
      try {
        entry = await forecastCity(selectedCity, horizon, trainDays, pollutant, false)
      } catch (err) {
        const multi = await forecastMulti([selectedCity], horizon, trainDays, false)
        entry = Array.isArray(multi) ? multi[0] : (multi?.details?.[selectedCity] || multi)
      }
      if (!entry) throw new Error('No forecast data returned.')
      if (entry.error) throw new Error(entry.error)
      setResult(entry)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Forecast failed.')
    } finally {
      setLoading(false)
    }
  }, [selectedCity, horizon, trainDays, pollutant])

  // Build chart data: merge historical + forecast into one series
  const chartData = React.useMemo(() => {
    if (!result) return []
    const hist = (result.historical || []).map((pt) => ({
      ds: pt.ds || pt.ts,
      actual: pt.actual != null ? Number(pt.actual.toFixed(2)) : (pt.yhat != null ? Number(pt.yhat.toFixed(2)) : null),
      forecast: null,
      yhat_lower: null,
      yhat_upper: null,
    }))
    const fc = (result.forecast || result.series || []).map((pt) => ({
      ds: pt.ds || pt.ts,
      actual: null,
      forecast: pt.yhat != null ? Number(pt.yhat.toFixed(2)) : null,
      yhat_lower: pt.yhat_lower != null ? Number(pt.yhat_lower.toFixed(2)) : null,
      yhat_upper: pt.yhat_upper != null ? Number(pt.yhat_upper.toFixed(2)) : null,
    }))
    return [...hist, ...fc]
  }, [result])

  // The ds value where forecast begins (for ReferenceLine "Now")
  const nowDs = result?.forecast?.[0]?.ds ?? result?.series?.[0]?.ts ?? null

  const pollutantLabel = pollutant === 'pm10' ? 'PM₁₀' : 'PM₂.₅'

  // ── Download CSV ─────────────────────────────────────────────────────────────
  const downloadCsv = () => {
    if (!chartData.length) return
    const header = 'timestamp,actual,forecast,lower_ci,upper_ci\n'
    const rows = chartData
      .map((r) => `${r.ds},${r.actual ?? ''},${r.forecast ?? ''},${r.yhat_lower ?? ''},${r.yhat_upper ?? ''}`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forecast_${selectedCity}_${pollutant}_${horizon}d.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell currentCity={selectedCity}>
      <PageHeader
        title="Air Quality Forecast"
        subtitle="SARIMAX time-series forecast with confidence intervals and backtest evaluation"
        badge={<Badge variant="brand" dot>ML Model</Badge>}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Forecasting' }]}
        actions={
          result && (
            <Button
              variant="outline"
              size="sm"
              icon={DownloadIcon}
              onClick={downloadCsv}
            >
              Export CSV
            </Button>
          )
        }
      />

      {/* ── 1. Controls Card ─────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
        <Card
          title="Forecast Configuration"
          subtitle="Select city, pollutant, horizon, and training window"
          action={
            <Badge variant="info" size="sm">
              <CpuIcon className="w-3 h-3 mr-1" />
              SARIMAX
            </Badge>
          }
          hover={false}
          className="mb-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
            {/* City selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">City</label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 appearance-none pr-9 cursor-pointer transition-colors hover:border-slate-300"
                >
                  {VERIFIED_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Pollutant toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Pollutant</label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
                {['pm25', 'pm10'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPollutant(p)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-150 cursor-pointer
                      ${pollutant === p
                        ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80 font-semibold'
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    {p === 'pm25' ? 'PM₂.₅' : 'PM₁₀'}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizon slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Horizon</label>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                  {horizon}d
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-slate-200 accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 -mt-1">
                <span>1d</span><span>7d</span>
              </div>
            </div>

            {/* Training window slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Train Window</label>
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-md px-2 py-0.5">
                  {trainDays}d
                </span>
              </div>
              <input
                type="range"
                min={7}
                max={30}
                step={1}
                value={trainDays}
                onChange={(e) => setTrainDays(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-slate-200 accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 -mt-1">
                <span>7d</span><span>30d</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Forecasting <span className="font-semibold text-slate-700">{pollutantLabel}</span> for{' '}
              <span className="font-semibold text-slate-700">{selectedCity}</span> — {horizon}-day horizon,
              trained on {trainDays} days of historical data.
            </p>
            <Button
              variant="primary"
              size="md"
              icon={TrendingUpIcon}
              onClick={runForecast}
              loading={loading}
              disabled={loading}
            >
              Run Forecast
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ── Body: loading / error / empty / results ───────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Loading state */}
        {loading && (
          <motion.div
            key="loading"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <Spinner size="xl" color="text-emerald-600" />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Running SARIMAX model…</p>
              <p className="text-xs text-slate-500 mt-1">Training on {trainDays} days, projecting {horizon} days ahead</p>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {!loading && error && (
          <motion.div key="error" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
            <Card hover={false} className="border-rose-200 bg-rose-50/60">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 shrink-0">
                  <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-rose-800">Forecast failed</p>
                  <p className="text-xs text-rose-600 mt-1 break-words">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={RefreshCwIcon}
                  onClick={runForecast}
                  className="shrink-0 border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  Retry
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !error && !result && (
          <motion.div
            key="empty"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center justify-center py-24 gap-5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 shadow-soft">
              <BarChartIcon className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-base font-semibold text-slate-700">No forecast yet</p>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Select a city, choose your pollutant, configure the horizon and training window, then click{' '}
                <span className="font-semibold text-emerald-700">Run Forecast</span>.
              </p>
            </div>
            <Button variant="primary" icon={TrendingUpIcon} onClick={runForecast}>
              Run Forecast
            </Button>
          </motion.div>
        )}

        {/* Results */}
        {!loading && !error && result && (
          <motion.div key="results" initial="hidden" animate="visible" exit="exit">

            {/* ── KPI row ──────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                {
                  title: 'Model',
                  value: result.model || 'SARIMAX',
                  icon: CpuIcon,
                  subtext: `Trained on ${result.training_days ?? trainDays} days`,
                },
                {
                  title: 'Data Freshness',
                  value: result.data_freshness ? fmtDate(result.data_freshness) : '—',
                  icon: ActivityIcon,
                  subtext: 'Last ingestion timestamp',
                },
                {
                  title: 'Fit MAE',
                  value: result.metrics?.fit_mae != null ? Number(result.metrics.fit_mae).toFixed(2) : '—',
                  unit: 'µg/m³',
                  icon: BarChartIcon,
                  subtext: result.metrics?.fit_rmse != null
                    ? `RMSE ${Number(result.metrics.fit_rmse).toFixed(2)} µg/m³`
                    : 'In-sample error',
                },
              ].map((kpi, i) => (
                <motion.div key={kpi.title} custom={i} variants={fadeUp}>
                  <StatCard
                    title={kpi.title}
                    value={kpi.value}
                    unit={kpi.unit}
                    icon={kpi.icon}
                    subtext={kpi.subtext}
                  />
                </motion.div>
              ))}
            </div>

            {/* ── Chart card ───────────────────────────────────────────────────── */}
            <motion.div custom={3} variants={fadeUp} className="mb-6">
              <Card
                title={`${pollutantLabel} Forecast — ${result.city || selectedCity}`}
                subtitle={`${result.historical?.length ?? 0} historical points · ${result.forecast?.length ?? 0} forecast points`}
                hover={false}
                action={
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" size="sm" dot>Historical</Badge>
                    <Badge variant="info" size="sm">Forecast</Badge>
                  </div>
                }
              >
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                    No chart data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={340}>
                    <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                      <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />

                      <XAxis
                        dataKey="ds"
                        tickFormatter={fmtLabel}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={60}
                      />

                      <YAxis
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}`}
                        width={42}
                        label={{
                          value: 'µg/m³',
                          angle: -90,
                          position: 'insideLeft',
                          offset: 12,
                          style: { fontSize: 10, fill: '#94a3b8' },
                        }}
                      />

                      <RechartsTooltip
                        content={<ForecastTooltip pollutant={pollutant} />}
                        cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                      />

                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => {
                          if (value === 'actual') return <span className="text-xs text-slate-600">Historical</span>
                          if (value === 'forecast') return <span className="text-xs text-slate-600">Forecast</span>
                          if (value === 'ci') return <span className="text-xs text-slate-600">Confidence Interval</span>
                          return value
                        }}
                      />

                      {/* Confidence interval band */}
                      <Area
                        dataKey="yhat_upper"
                        name="ci"
                        stroke="none"
                        fill="#10b981"
                        fillOpacity={0.08}
                        legendType="none"
                        activeDot={false}
                        isAnimationActive={false}
                        connectNulls={false}
                      />
                      <Area
                        dataKey="yhat_lower"
                        name="ci_lower"
                        stroke="none"
                        fill="#ffffff"
                        fillOpacity={1}
                        legendType="none"
                        activeDot={false}
                        isAnimationActive={false}
                        connectNulls={false}
                      />

                      {/* Historical actuals */}
                      <Area
                        dataKey="actual"
                        name="actual"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="#10b981"
                        fillOpacity={0.15}
                        dot={false}
                        activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                        connectNulls={false}
                      />

                      {/* Forecast line */}
                      <Line
                        dataKey="forecast"
                        name="forecast"
                        stroke="#0d9488"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={false}
                        activeDot={{ r: 4, stroke: '#0d9488', strokeWidth: 2, fill: '#fff' }}
                        connectNulls={false}
                      />

                      {/* "Now" reference line */}
                      {nowDs && (
                        <ReferenceLine
                          x={nowDs}
                          stroke="#64748b"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: 'Now',
                            position: 'top',
                            fontSize: 11,
                            fill: '#64748b',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>

            {/* ── Model Info + Backtest row ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Model Info */}
              <motion.div custom={4} variants={fadeUp}>
                <Card
                  title="Model Information"
                  subtitle="Training configuration and data provenance"
                  hover={false}
                  action={<LayersIcon className="w-4 h-4 text-slate-400" />}
                >
                  <dl className="space-y-3">
                    {[
                      { label: 'Algorithm', value: result.model || 'SARIMAX' },
                      { label: 'Pollutant', value: pollutantLabel },
                      { label: 'Training Days', value: `${result.training_days ?? trainDays} days` },
                      {
                        label: 'Data Freshness',
                        value: result.data_freshness ? fmtDate(result.data_freshness) : '—',
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                        <dt className="text-xs text-slate-500 font-medium">{label}</dt>
                        <dd className="text-xs font-semibold text-slate-800">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* Limitations */}
                  {result.backtest_roll?.limitations?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">⚠ Limitations</p>
                      <ul className="space-y-1.5">
                        {result.backtest_roll.limitations.map((lim, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                            {lim}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Backtest Card */}
              <motion.div custom={5} variants={fadeUp}>
                <Card
                  title="Backtest Evaluation"
                  subtitle="Rolling-window out-of-sample model performance"
                  hover={false}
                  action={<TrendingUpIcon className="w-4 h-4 text-slate-400" />}
                >
                  {result.backtest_roll ? (
                    <>
                      <dl className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                          <dt className="text-xs text-slate-500 font-medium">Backtest MAE</dt>
                          <dd className="text-xs font-semibold text-slate-800">
                            {result.backtest_roll.mae != null
                              ? `${Number(result.backtest_roll.mae).toFixed(2)} µg/m³`
                              : '—'}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                          <dt className="text-xs text-slate-500 font-medium">Backtest RMSE</dt>
                          <dd className="text-xs font-semibold text-slate-800">
                            {result.backtest_roll.rmse != null
                              ? `${Number(result.backtest_roll.rmse).toFixed(2)} µg/m³`
                              : '—'}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between pb-2">
                          <dt className="text-xs text-slate-500 font-medium">Skill Score</dt>
                          <dd className="flex items-center gap-2">
                            {result.backtest_roll.skill_score != null ? (
                              <>
                                <span
                                  className={`text-sm font-bold ${skillColor(result.backtest_roll.skill_score)}`}
                                >
                                  {(result.backtest_roll.skill_score * 100).toFixed(1)}%
                                </span>
                                <Badge variant={skillBadge(result.backtest_roll.skill_score)} size="sm">
                                  {result.backtest_roll.skill_score >= 0.4
                                    ? 'Good'
                                    : result.backtest_roll.skill_score >= 0.2
                                    ? 'Fair'
                                    : 'Poor'}
                                </Badge>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </dd>
                        </div>
                      </dl>

                      {/* Skill bar */}
                      {result.backtest_roll.skill_score != null && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                            <span>0% (Poor)</span><span>40%+ (Good)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                result.backtest_roll.skill_score >= 0.4
                                  ? 'bg-emerald-500'
                                  : result.backtest_roll.skill_score >= 0.2
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(result.backtest_roll.skill_score * 100, 100)}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Limitations */}
                      {result.backtest_roll.limitations?.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">⚠ Notes</p>
                          <ul className="space-y-1.5">
                            {result.backtest_roll.limitations.map((lim, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                                {lim}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-6">No backtest data available.</p>
                  )}
                </Card>
              </motion.div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
