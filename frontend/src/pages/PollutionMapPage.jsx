import React, { useState } from 'react'
import AppShell from '../components/layout/AppShell'
import PageHeader from '../components/layout/PageHeader'
import { Card, StatCard } from '../components/design-system/Card'
import Badge from '../components/design-system/Badge'
import Button from '../components/design-system/Button'
import {
  WindIcon,
  LayersIcon,
  SunIcon,
  DropletIcon,
  MapPinIcon,
  RefreshCwIcon,
  SparklesIcon,
} from '../components/design-system/Icons'

export default function PollutionMapPage() {
  const [selectedLayer, setSelectedLayer] = useState('pm25')
  const [selectedCity, setSelectedCity] = useState('London')

  const stations = [
    { id: 1, name: 'Westminster Core', aqi: 42, pm25: 10.2, temp: 22, status: 'good', lat: '51.49', lon: '-0.13' },
    { id: 2, name: 'Tower Bridge Urban', aqi: 56, pm25: 14.8, temp: 23, status: 'moderate', lat: '51.50', lon: '-0.07' },
    { id: 3, name: 'Heathrow Corridor', aqi: 78, pm25: 25.1, temp: 21, status: 'moderate', lat: '51.47', lon: '-0.45' },
    { id: 4, name: 'Greenwich Observatory', aqi: 35, pm25: 8.4, temp: 21, status: 'good', lat: '51.48', lon: '0.00' },
  ]

  return (
    <AppShell currentCity={selectedCity} onCitySelect={setSelectedCity}>
      <PageHeader
        title="Urban Pollution Map"
        subtitle="High-resolution spatial dispersion modeling and ambient atmospheric sensor telemetry"
        breadcrumbs={[
          { label: 'Platform', href: '/workspace' },
          { label: 'Pollution Map' },
        ]}
        badge={
          <Badge variant="good" size="md" dot>
            Live Telemetry Staged
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCwIcon}>
              Calibrate Sensors
            </Button>
            <Button variant="primary" size="sm" icon={SparklesIcon}>
              Export Spatial GeoJSON
            </Button>
          </div>
        }
      />

      {/* Top Telemetry Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Consensus AQI"
          value="48"
          unit="US AQI"
          delta="4.2%"
          deltaType="positive"
          deltaLabel="improvement vs 24h"
          badge={<Badge variant="good">Good</Badge>}
          icon={WindIcon}
        />
        <StatCard
          title="Boundary Layer Height"
          value="840"
          unit="meters AGL"
          subtext="Strong vertical mixing"
          icon={LayersIcon}
        />
        <StatCard
          title="Surface Wind Vector"
          value="12.4"
          unit="km/h · 45° NE"
          subtext="Dispersing southwest plume"
          icon={WindIcon}
        />
        <StatCard
          title="Active Monitoring Nodes"
          value="4"
          unit="calibrated stations"
          subtext="Open-Meteo + OpenAQ consensus"
          icon={MapPinIcon}
        />
      </div>

      {/* Map Canvas / Dispersion Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive 3D Canvas / Spatial Viewport */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="p-0" className="overflow-hidden border border-slate-200">
            {/* Viewport Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Atmospheric Dispersion Canvas
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {selectedCity} Grid
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {['pm25', 'wind', 'no2'].map((layer) => (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => setSelectedLayer(layer)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      selectedLayer === layer
                        ? 'bg-emerald-600 text-white shadow-soft'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {layer === 'pm25' ? 'PM2.5 Plume' : layer === 'wind' ? 'Wind Streamlines' : 'NO2 Infiltration'}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Canvas Stage */}
            <div className="relative h-[440px] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col items-center justify-center p-8 overflow-hidden text-center">
              {/* Subtle grid pattern */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `radial-gradient(circle, #34d399 1px, transparent 1px)`,
                  backgroundSize: '28px 28px',
                }}
              />

              {/* Floating Atmospheric Sensor Nodes */}
              <div className="absolute top-12 left-16 animate-bounce duration-1000">
                <div className="flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-md px-3 py-1.5 shadow-xl border border-white/20 text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">Westminster</p>
                    <p className="text-[10px] text-slate-500">AQI 42 · Good</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-24 right-20">
                <div className="flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-md px-3 py-1.5 shadow-xl border border-white/20 text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">Tower Bridge</p>
                    <p className="text-[10px] text-slate-500">AQI 56 · Moderate</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-16 left-28">
                <div className="flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-md px-3 py-1.5 shadow-xl border border-white/20 text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">Greenwich</p>
                    <p className="text-[10px] text-slate-500">AQI 35 · Good</p>
                  </div>
                </div>
              </div>

              {/* Center Informative Overlay */}
              <div className="relative z-10 max-w-md rounded-2xl bg-white/95 backdrop-blur-md p-6 shadow-2xl border border-slate-100 text-slate-800">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <WindIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Interactive Urban Dispersion Map
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Real-time sensory telemetry nodes are currently streaming from calibrated Open-Meteo & OpenAQ stations.
                  The full Three.js 3D volumetric building mesh and aerosol particle dispersion will load here.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Badge variant="good" size="sm">
                    4 Live Nodes Active
                  </Badge>
                  <Badge variant="brand" size="sm">
                    Atmospheric Physics Calibrated
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Station Telemetry List */}
        <div className="space-y-4">
          <Card title="Calibrated Monitoring Nodes" subtitle="Micro-climate sensor network">
            <div className="space-y-3 mt-1">
              {stations.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{st.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Coordinates: {st.lat}, {st.lon}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      PM2.5: <span className="text-slate-900 font-bold">{st.pm25} µg/m³</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{st.aqi}</span>
                    <div>
                      <Badge variant={st.status === 'good' ? 'good' : 'moderate'} size="sm">
                        {st.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Aerosol Meteorological Parameters">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Thermal Inversion Cap</span>
                <span className="font-semibold text-slate-800">None detected (&gt;1,200m)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Atmospheric Pressure</span>
                <span className="font-semibold text-slate-800">1014.2 hPa (Stable)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Relative Humidity</span>
                <span className="font-semibold text-slate-800">58%</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Solar UV Index</span>
                <span className="font-semibold text-slate-800">3.4 (Moderate)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
