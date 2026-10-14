import React from 'react'

export default function FloatingEnvPins({
  metrics,
  projectedPins = [],
  containerWidth = 800,
  containerHeight = 600,
}) {
  if (!metrics) return null

  // Map projected IDs to actual metrics
  const pinDataMap = {
    rainfall: {
      value: `${metrics.rainfall ?? 0} mm`,
      label: 'Rainfall',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      color: 'text-emerald-700 bg-emerald-50',
      tooltip: 'Precipitation rate (Open-Meteo)',
    },
    humidity: {
      value: `${metrics.humidity ?? 60} %`,
      label: 'Humidity',
      icon: (
        <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
        </svg>
      ),
      color: 'text-teal-700 bg-teal-50',
      tooltip: 'Relative air moisture (Open-Meteo)',
    },
    temp: {
      value: `${metrics.temp ?? 22} °C`,
      label: 'Temperature',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-emerald-700 bg-emerald-50',
      tooltip: 'Surface air temperature (Open-Meteo)',
    },
    visibility: {
      value: `${metrics.visibilityKm ?? 10} km`,
      label: 'Visibility',
      icon: (
        <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'text-teal-700 bg-teal-50',
      tooltip: 'Atmospheric optical clarity (Open-Meteo)',
    },
    station: {
      isPinIcon: true,
      label: 'Active Sensor Station',
      tooltip: 'Core urban monitoring node',
    },
  }

  // Fallback fixed percentages if 3D projection is not ready yet
  const defaultPositions = {
    rainfall: { x: '24%', y: '35%' },
    humidity: { x: '45%', y: '28%' },
    temp: { x: '35%', y: '60%' },
    visibility: { x: '60%', y: '52%' },
    station: { x: '42%', y: '48%' },
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {Object.keys(pinDataMap).map((key) => {
        const item = pinDataMap[key]
        const proj = projectedPins.find((p) => p.id === key)

        let posX = defaultPositions[key]?.x
        let posY = defaultPositions[key]?.y

        if (proj && proj.visible && containerWidth > 0 && containerHeight > 0) {
          // Clamp inside viewport
          const clampedX = Math.max(50, Math.min(containerWidth - 90, proj.x))
          const clampedY = Math.max(60, Math.min(containerHeight - 90, proj.y))
          posX = `${clampedX}px`
          posY = `${clampedY}px`
        }

        if (item.isPinIcon) {
          return (
            <div
              key={key}
              style={{ left: posX, top: posY, transform: 'translate(-50%, -50%)' }}
              className="absolute pointer-events-auto transition-all duration-75 group"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute h-8 w-8 rounded-full bg-emerald-400/30 animate-ping" />
                <div className="h-7 w-7 rounded-full bg-white shadow-card border border-emerald-500 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 fill-emerald-600" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          )
        }

        return (
          <div
            key={key}
            style={{ left: posX, top: posY, transform: 'translate(-50%, -50%)' }}
            className="absolute pointer-events-auto transition-all duration-75 group"
            title={item.tooltip}
          >
            <div className="w-24 h-24 rounded-full bg-white/95 backdrop-blur-md shadow-card border border-slate-100/90 flex flex-col items-center justify-center text-center p-2 group-hover:scale-105 group-hover:shadow-2xl transition-all cursor-pointer">
              <div className="mb-1">{item.icon}</div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">
                {item.value}
              </span>
              <span className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
