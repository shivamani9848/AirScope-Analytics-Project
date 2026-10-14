import React, { useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import Badge from '../design-system/Badge'

export default function AnalyticsDrawer({
  metrics,
  timeline = [],
  apportionment,
}) {
  const [timeGranularity, setTimeGranularity] = useState('Hourly')

  // Filter or aggregate timeline points based on timeGranularity
  const displayedTimeline =
    timeGranularity === 'Hourly'
      ? timeline.slice(-12) // Last 12 hours for crisp display
      : timeGranularity === 'Daily'
      ? timeline.filter((_, idx) => idx % 4 === 0)
      : timeline.slice(-8)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
      {/* 1. Air Quality Index Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card flex flex-col justify-between">
        <div>
          {/* Header & Granularity Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Air Quality Index</h3>
              <p className="text-xs text-slate-500">Overall air quality status.</p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
              {['Hourly', 'Daily', 'Monthly'].map((gran) => (
                <button
                  key={gran}
                  type="button"
                  onClick={() => setTimeGranularity(gran)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    timeGranularity === gran
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {gran}
                </button>
              ))}
            </div>
          </div>

          {/* Legend row */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Good (≤ 12 µg/m³)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Moderate (12–35)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Unhealthy (&gt; 35)
            </span>
          </div>

          {/* Recharts Multi-Segment Chart */}
          <div className="h-44 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={displayedTimeline}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#e2e8f0" />
                <YAxis
                  domain={[0, (dataMax) => Math.max(60, Math.ceil(dataMax * 1.15))]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  stroke="#e2e8f0"
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '11px',
                  }}
                  formatter={(val) => [`${val} µg/m³`, 'PM2.5']}
                />
                {/* Visual thresholds */}
                <ReferenceLine y={12} stroke="#22c55e" strokeDasharray="3 3" />
                <ReferenceLine y={35.4} stroke="#eab308" strokeDasharray="3 3" />

                <Bar
                  dataKey="pm25"
                  barSize={14}
                  radius={[4, 4, 0, 0]}
                  fill="#10b981"
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="pm25"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#ef4444', strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current status footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Current PM2.5: <strong className="text-slate-800">{metrics?.pm25 ?? 0} µg/m³</strong></span>
          <Badge variant={metrics?.aqiVariant || 'good'} size="sm">
            AQI {metrics?.aqi ?? 0} ({metrics?.aqiCategory || 'Good'})
          </Badge>
        </div>
      </div>

      {/* 2. Pollution Sources Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Pollution Sources</h3>
              <p className="text-xs text-slate-500">Primary sources contributing to air pollution.</p>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Source information options"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="5" cy="10" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="15" cy="10" r="1.5" />
              </svg>
            </button>
          </div>

          {/* Sources breakdown list */}
          <div className="space-y-3 mt-4">
            {apportionment?.sources?.map((src) => (
              <div key={src.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    {src.icon === 'car' ? '🚗' : src.icon === 'construction' ? '🏗️' : src.icon === 'factory' ? '🏭' : '☁️'}
                    {src.name}
                  </span>
                  <span className="font-bold text-slate-900">{src.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${src.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology notice compliant with rule 4 */}
        <div className="pt-3 border-t border-slate-100 mt-4">
          <p className="text-[10px] text-slate-400 leading-tight">
            Methodology: {apportionment?.methodology || 'CAMS Regional Chemical Transport Model estimate.'}
          </p>
        </div>
      </div>

      {/* 3. Wind Status Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Wind Status</h3>
              <p className="text-xs text-slate-500">Wind speed and direction.</p>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Wind status options"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="5" cy="10" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="15" cy="10" r="1.5" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 mt-3">
            {/* Speed metrics */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {metrics?.windSpeedKmh ?? 7.5}
                </span>
                <span className="text-xs font-semibold text-slate-500">km/h</span>
              </div>
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <span>↗</span> +10% Than last hour
              </p>
              <p className="text-[11px] text-slate-400">
                Velocity: {metrics?.windSpeedMs ?? 2.1} m/s ({metrics?.windCardinal || 'NE'})
              </p>
            </div>

            {/* Analog Wind Rose / Compass Dial */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              {/* Outer compass ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                <span className="absolute top-0.5 text-[10px] font-bold text-rose-500">N</span>
                <span className="absolute right-1 text-[10px] font-bold text-slate-400">E</span>
                <span className="absolute bottom-0.5 text-[10px] font-bold text-slate-400">S</span>
                <span className="absolute left-1 text-[10px] font-bold text-slate-400">W</span>
              </div>

              {/* Center speed hub */}
              <div className="w-12 h-12 rounded-full bg-white shadow-soft border border-slate-100 flex flex-col items-center justify-center z-10 text-center">
                <span className="text-xs font-bold text-slate-800 leading-none">
                  {metrics?.windSpeedMs ?? 1}
                </span>
                <span className="text-[9px] text-slate-400 leading-none">m/s</span>
              </div>

              {/* Rotating Compass Needle */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-700 ease-out"
                style={{ transform: `rotate(${metrics?.windDirDeg ?? 45}deg)` }}
              >
                {/* North arrow (red) */}
                <div className="absolute top-3 w-1.5 h-10 bg-gradient-to-t from-transparent to-rose-500 rounded-t-full shadow-sm" />
                {/* South arrow (sky) */}
                <div className="absolute bottom-3 w-1.5 h-10 bg-gradient-to-b from-transparent to-sky-500 rounded-b-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Dispersion Commentary */}
        <div className="pt-3 border-t border-slate-100 mt-3 text-xs text-slate-500">
          <p className="line-clamp-2">
            {metrics?.dispersionNote || 'Gentle breeze helping disperse pollutants.'}
          </p>
        </div>
      </div>
    </div>
  )
}
