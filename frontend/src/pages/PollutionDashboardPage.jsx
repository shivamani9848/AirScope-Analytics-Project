import React, { useState, useEffect, useRef } from 'react'
import AppShell from '../components/layout/AppShell'
import CityCanvas3D from '../components/map3d/CityCanvas3D'
import FloatingEnvPins from '../components/dashboard/FloatingEnvPins'
import AnalyticsDrawer from '../components/dashboard/AnalyticsDrawer'
import Spinner from '../components/design-system/Spinner'
import Badge from '../components/design-system/Badge'
import Button from '../components/design-system/Button'
import {
  fetchCityEnvironmentalData,
  VERIFIED_CITIES,
} from '../services/environmentalData'

export default function PollutionDashboardPage() {
  const [selectedCity, setSelectedCity] = useState(VERIFIED_CITIES[0])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 3D Map controls state
  const [is2D, setIs2D] = useState(false)
  const [projectedPins, setProjectedPins] = useState([])
  const [showBriefBanner, setShowBriefBanner] = useState(true)

  // City canvas container size tracking
  const canvasContainerRef = useRef(null)
  const [containerDimensions, setContainerDimensions] = useState({ width: 900, height: 560 })

  // Fetch real data on city change
  useEffect(() => {
    let isCancelled = false
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchCityEnvironmentalData(selectedCity)
        if (!isCancelled) {
          setData(result)
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load city data:', err)
          setError('Unable to fetch live telemetry. Demonstrating offline baseline.')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      isCancelled = true
    }
  }, [selectedCity])

  // Track container dimensions for pin projection
  useEffect(() => {
    if (!canvasContainerRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    ro.observe(canvasContainerRef.current)
    return () => ro.disconnect()
  }, [])

  function handleCityChange(e) {
    const cityName = e.target.value
    const found = VERIFIED_CITIES.find((c) => c.name === cityName)
    if (found) {
      setSelectedCity(found)
    }
  }

  return (
    <AppShell currentCity={selectedCity.name} onCitySelect={(cityName) => {
      const found = VERIFIED_CITIES.find((c) => c.name.toLowerCase() === cityName.toLowerCase())
      if (found) setSelectedCity(found)
    }}>
      <div className="space-y-6">
        {/* Main 3D Visualization Viewport Card */}
        <div className="relative rounded-3xl border border-slate-200/90 bg-white shadow-card overflow-hidden">
          {/* Top Over-Map HUD Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            {/* Location Selector Pill */}
            <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md px-3.5 py-2 shadow-card border border-slate-100">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <select
                value={selectedCity.name}
                onChange={handleCityChange}
                className="appearance-none bg-transparent text-xs font-bold text-slate-800 pr-5 focus:outline-none cursor-pointer"
                aria-label="Select city for 3D map telemetry"
              >
                {VERIFIED_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.display}
                  </option>
                ))}
              </select>
              <svg className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Weather Telemetry Pill */}
            <div className="pointer-events-auto hidden sm:flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md px-3.5 py-2 shadow-card border border-slate-100 text-xs font-semibold text-slate-700">
              <span>⛅ {data?.metrics?.temp ?? 23}°C</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-normal">{data?.timestamp || '00:25 PM'}</span>
              <Badge variant={data?.metrics?.aqiVariant || 'good'} size="sm" dot>
                AQI {data?.metrics?.aqi ?? 42}
              </Badge>
            </div>
          </div>

          {/* 3D Canvas Stage Container */}
          <div
            ref={canvasContainerRef}
            className="relative w-full h-[540px] bg-slate-50 overflow-hidden"
          >
            {loading && !data && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                <Spinner size="lg" />
                <p className="text-xs font-semibold text-slate-600 mt-3">
                  Calibrating 3D Urban Grid & Sensor Feeds for {selectedCity.name}...
                </p>
              </div>
            )}

            {/* In-scene 3D Floating Environmental Pins */}
            <FloatingEnvPins
              metrics={data?.metrics}
              projectedPins={projectedPins}
              containerWidth={containerDimensions.width}
              containerHeight={containerDimensions.height}
            />

            {/* Three.js Procedural City */}
            <CityCanvas3D
              metrics={data?.metrics}
              city={selectedCity.name}
              is2D={is2D}
              onPinProject={(pins) => setProjectedPins(pins)}
            />

            {/* Bottom-Right On-Canvas Map Controls */}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
              {/* Zoom and Navigation HUD */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 backdrop-blur-md shadow-card border border-slate-100">
                <button
                  type="button"
                  onClick={() => setIs2D(false)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Center View"
                  aria-label="Re-center map"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="3" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setIs2D(!is2D)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    is2D ? 'bg-emerald-600 text-white shadow-soft' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Toggle 2D / 3D Perspective"
                  aria-label="Toggle 2D and 3D mode"
                >
                  {is2D ? '2D Mode' : '3D'}
                </button>

                <button
                  type="button"
                  onClick={() => setIs2D(false)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Reset View"
                  aria-label="Reset camera view"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Analytics Drawer */}
        <AnalyticsDrawer
          metrics={data?.metrics}
          timeline={data?.timeline}
          apportionment={data?.apportionment}
        />

        {/* Floating Project Brief Banner matching reference image */}
        {showBriefBanner && (
          <div className="relative rounded-2xl bg-white shadow-card border border-slate-200/90 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Start an Environmental Project Brief
                </h4>
                <p className="text-xs text-slate-500">
                  Tell us what you need and calibrate dedicated spatial sensors and dispersion models for your municipality.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => alert(`Municipal sensor profile calibrated for ${selectedCity.name}.`)}
              >
                Get Started
              </Button>
              <button
                type="button"
                onClick={() => setShowBriefBanner(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Dismiss banner"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
