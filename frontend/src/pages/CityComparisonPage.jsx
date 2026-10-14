import React, { useState, useEffect, useRef } from 'react'
import AppShell from '../components/layout/AppShell'
import PageHeader from '../components/layout/PageHeader'
import { Card, StatCard } from '../components/design-system/Card'
import Badge, { getAqiCategory } from '../components/design-system/Badge'
import Button from '../components/design-system/Button'
import Spinner from '../components/design-system/Spinner'
import {
  BarChartIcon,
  RefreshCwIcon,
  DownloadIcon,
  ShieldCheckIcon,
  ActivityIcon,
  LayersIcon,
} from '../components/design-system/Icons'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts'
import { compareCities } from '../api'
import { VERIFIED_CITIES, calculateEpaAqi } from '../services/environmentalData'

const CITY_PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']

export default function CityComparisonPage() {
  const [selectedCities, setSelectedCities] = useState(['London', 'Delhi'])
  const [days, setDays] = useState(7)
  const [pollutant, setPollutant] = useState('pm25') // 'pm25' | 'pm10'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const activeRequestId = useRef(0)

  useEffect(() => {
    const reqId = ++activeRequestId.current
    async function loadComparison() {
      if (selectedCities.length === 0) {
        setData(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const res = await compareCities(selectedCities, days)
        if (reqId === activeRequestId.current) {
          if (res.ok) {
            setData(res)
          } else {
            setError(res.error || 'Failed to compare cities.')
          }
        }
      } catch (err) {
        if (reqId === activeRequestId.current) {
          console.warn('Compare API error:', err)
          setError(
            err.response?.data?.detail ||
              'Unable to complete comparison. Data providers may be temporarily unavailable.'
          )
        }
      } finally {
        if (reqId === activeRequestId.current) {
          setLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    loadComparison()
  }, [selectedCities, days])

  function toggleCity(cityName) {
    if (selectedCities.includes(cityName)) {
      if (selectedCities.length > 1) {
        setSelectedCities(selectedCities.filter((c) => c !== cityName))
      }
    } else {
      if (selectedCities.length < 5) {
        setSelectedCities([...selectedCities, cityName])
      }
    }
  }

  function handleRefresh() {
    setIsRefreshing(true)
    const reqId = ++activeRequestId.current
    compareCities(selectedCities, days)
      .then((res) => {
        if (reqId === activeRequestId.current && res.ok) setData(res)
      })
      .catch((e) => console.error(e))
      .finally(() => setIsRefreshing(false))
  }

  // Merge the timeline series of each city into a synchronized multi-line dataset
  const mergedTimeline = []
  if (data?.byCity) {
    // Map of timestamp -> { time, City1: val, City2: val }
    const timeMap = {}

    selectedCities.forEach((city) => {
      const cityData = data.byCity[city]
      const series = cityData?.series || []
      series.forEach((pt) => {
        const key = pt.ts
        if (!timeMap[key]) {
          timeMap[key] = {
            ts: key,
            displayTime: key.length > 11 ? key.substring(11, 16) : key,
          }
        }
        timeMap[key][city] = pollutant === 'pm25' ? pt.pm25 : pt.pm10
      })
    })

    const sortedKeys = Object.keys(timeMap).sort()
    sortedKeys.forEach((k) => {
      mergedTimeline.push(timeMap[k])
    })
  }

  return (
    <AppShell currentCity={selectedCities[0]} onCitySelect={(c) => toggleCity(c)}>
      <PageHeader
        title="Multi-City Air Quality Benchmarking"
        subtitle="Side-by-side particulate comparison, standardized delta rankings, and synchronized time-series"
        breadcrumbs={[
          { label: 'Platform', href: '/workspace' },
          { label: 'City Comparison' },
        ]}
        badge={
          <Badge variant="brand" size="md" dot>
            Harmonized Observation Window
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCwIcon}
              onClick={handleRefresh}
              loading={isRefreshing}
            >
              Recalibrate Delta
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={DownloadIcon}
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `city_comparison_${days}d.json`
                a.click()
              }}
            >
              Export Comparison Audit
            </Button>
          </div>
        }
      />

      {/* Control Filter Bar */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* City Selection Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Cities to Compare (Up to 5)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {VERIFIED_CITIES.map((c) => {
                const isSelected = selectedCities.includes(c.name)
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggleCity(c.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-soft shadow-emerald-600/20'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right filters: Days & Pollutant */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Common Lookback Window
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (Standard)</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days (Pro)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pollutant Metric
              </label>
              <div className="flex rounded-xl bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setPollutant('pm25')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    pollutant === 'pm25' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  PM2.5
                </button>
                <button
                  type="button"
                  onClick={() => setPollutant('pm10')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    pollutant === 'pm10' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  PM10
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Standardized Delta Ranking Banner */}
      {data?.rankings && data.rankings.length > 0 && (
        <Card className="mb-6 p-5 border-emerald-100 bg-gradient-to-r from-emerald-50/40 to-teal-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Standardized Particulate Ranking
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Benchmark Metric: Mean PM2.5 over past {days} days
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cities evaluated over an identical observation window using normalized gravimetric concentrations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {data.best && (
                <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-white shadow-soft border border-emerald-200">
                  <span className="text-lg">🌿</span>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Cleanest Airshed</span>
                    <p className="text-xs font-black text-slate-900">{data.best}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Synchronized Multi-City Interactive Line Chart */}
      <Card
        title="Harmonized Cross-City Time Series Progression"
        subtitle={`Synchronized ${pollutant.toUpperCase()} concentration curve across selected urban airsheds`}
        className="mb-6"
      >
        {loading && (
          <div className="h-80 flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="text-xs text-slate-500 mt-3 font-medium">
              Harmonizing cross-city observations...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="h-80 flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <ActivityIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Comparison Data Notice</h4>
            <p className="text-xs text-slate-500 max-w-md mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
              Retry Comparison
            </Button>
          </div>
        )}

        {!loading && !error && mergedTimeline.length > 0 && (
          <div className="h-84 w-full">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={mergedTimeline} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="displayTime"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#e2e8f0"
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, (dataMax) => Math.max(30, Math.ceil(dataMax * 1.2))]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#e2e8f0"
                  unit=" µg"
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(val, name) => [`${val} µg/m³`, name]}
                  labelFormatter={(lbl, payload) => {
                    const fullTs = payload?.[0]?.payload?.ts
                    return fullTs ? `Timestamp: ${fullTs}` : lbl
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                <ReferenceLine
                  y={12.0}
                  stroke="#22c55e"
                  strokeDasharray="4 4"
                  label={{ value: 'EPA Good (12)', fill: '#16a34a', fontSize: 10, position: 'right' }}
                />

                {selectedCities.map((city, idx) => (
                  <Line
                    key={city}
                    type="monotone"
                    dataKey={city}
                    stroke={CITY_PALETTE[idx % CITY_PALETTE.length]}
                    strokeWidth={2.2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Side-by-Side City Summary Metrics Table */}
      <Card title="Comparative Summary & Statistical Spread" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Mean PM2.5</th>
                <th className="py-3 px-4">Min PM2.5</th>
                <th className="py-3 px-4">Max PM2.5</th>
                <th className="py-3 px-4">Mean PM10</th>
                <th className="py-3 px-4">Valid Points</th>
                <th className="py-3 px-4">Air Quality Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {data?.rankings?.map((r) => {
                const cityStats = data.byCity?.[r.city] || {}
                const aqi = r.mean_pm25 ? calculateEpaAqi(r.mean_pm25) : null
                return (
                  <tr key={r.city} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs">
                        #{r.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.city}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {r.mean_pm25 ?? '—'} <span className="font-normal text-slate-400">µg/m³</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {cityStats.min_pm25 ?? '—'} µg/m³
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {cityStats.max_pm25 ?? '—'} µg/m³
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {cityStats.mean_pm10 ?? '—'} µg/m³
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {cityStats.n_points ?? '0'} ({days * 24} hrs max)
                    </td>
                    <td className="py-3.5 px-4">
                      {aqi ? (
                        <Badge variant={aqi.variant} size="sm">
                          AQI {aqi.aqi} · {aqi.category}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Responsible Analytics & Causal Independence Disclosure */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-soft text-xs text-slate-500 leading-relaxed">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
          Environmental Intelligence Standards & Causal Independence Notice
        </h4>
        <p>
          Comparative statistics strictly evaluate independent atmospheric airsheds over identical time intervals.
          AirScope Analytics does not infer transboundary causality between disconnected metropolitan regions.
          All rankings are computed from gravimetric mass observations ($\mu g/m^3$) under calibrated EPA 40 CFR Part 58 procedures.
        </p>
      </div>
    </AppShell>
  )
}
