import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AppShell from '../components/layout/AppShell'
import PageHeader from '../components/layout/PageHeader'
import { Card, StatCard } from '../components/design-system/Card'
import Badge from '../components/design-system/Badge'
import Button from '../components/design-system/Button'
import Spinner from '../components/design-system/Spinner'
import {
  FileTextIcon,
  DownloadIcon,
  BarChartIcon,
  CpuIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  CheckIcon,
  AlertCircleIcon,
  InfoIcon,
} from '../components/design-system/Icons'
import { VERIFIED_CITIES } from '../services/environmentalData'
import { api } from '../api'

// ── Animation variants ───────────────────────────────────────────────────────
const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.28, ease: 'easeOut' } }),
}

// ── Report type definitions ──────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    id: 'comparison',
    title: 'Multi-City Comparative Audit',
    type: 'Comparison Report',
    description: 'Cross-city PM2.5 and PM10 benchmarking, delta statistics, trend divergence and sensor health diagnostics.',
    icon: BarChartIcon,
    badge: 'Certified',
    badgeVariant: 'good',
    color: 'emerald',
    href: '/print-comparison-report',
    requiresCities: true,
    requiresDays: true,
    endpoint: '/report/comparison',
  },
  {
    id: 'forecast',
    title: '7-Day SARIMAX Predictive Forecast',
    type: 'Predictive Report',
    description: 'Confidence intervals, diurnal inversion analysis, boundary layer sensitivity and model performance metrics.',
    icon: CpuIcon,
    badge: 'Statistical Model',
    badgeVariant: 'pro',
    color: 'teal',
    href: '/print-forecast-report',
    requiresCities: false,
    requiresDays: true,
    endpoint: '/report/forecast',
  },
  {
    id: 'compliance',
    title: 'EPA Compliance & Exposure Summary',
    type: 'Regulatory Record',
    description: 'Traceable sensor logs, validation audit trail, WHO guideline evaluation and municipal compliance scoring.',
    icon: ShieldCheckIcon,
    badge: 'Regulatory',
    badgeVariant: 'neutral',
    color: 'slate',
    href: '/workspace',
    requiresCities: true,
    requiresDays: true,
    endpoint: null, // Link-only for now
  },
]

const CITY_NAMES = VERIFIED_CITIES.map((c) => c.name)
const POLLUTANTS = [
  { value: 'pm25', label: 'PM2.5' },
  { value: 'pm10', label: 'PM10' },
]

// ── Report Card Component ────────────────────────────────────────────────────
function ReportCard({ report, index }) {
  const navigate = useNavigate()
  const Icon = report.icon
  const [expanded, setExpanded] = useState(false)
  const [city, setCity] = useState(CITY_NAMES[0])
  const [days, setDays] = useState(7)
  const [pollutant, setPollutant] = useState('pm25')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const accentClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    teal:    'bg-teal-50 text-teal-700 border-teal-100',
    slate:   'bg-slate-100 text-slate-600 border-slate-200',
  }

  const accentBg = accentClasses[report.color] || accentClasses.slate

  // Open the printable report (existing pages expect navigation state)
  function handleOpenReport() {
    if (report.id === 'compliance') {
      navigate(report.href)
      return
    }
    // Navigate to print page – it will use fallback if no state is provided
    navigate(report.href, {
      state: {
        cities: [city],
        periodDays: days,
        pollutant,
        comparisonData: null, // print pages handle missing state gracefully
      },
    })
  }

  // Download PDF via backend (if endpoint exists)
  async function handleDownloadPDF() {
    if (!report.endpoint) {
      handleOpenReport()
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const payload = {
        city,
        cities: [city],
        pollutant,
        days,
        report_type: report.id,
        charts: {},
      }
      const res = await api.post(report.endpoint, payload, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `airscope-${report.id}-${city.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      console.warn('PDF download failed, falling back to print view:', err)
      // Graceful fallback: open printable view
      handleOpenReport()
      setStatus('idle')
    }
  }

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <Card
        hover
        className={`transition-all duration-200 ${expanded ? 'border-emerald-200 shadow-card' : ''}`}
        padding=""
      >
        {/* Header row */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer select-none"
          onClick={() => setExpanded((e) => !e)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <div className="flex items-start gap-4">
            <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${accentBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-base text-slate-900">{report.title}</h3>
                <Badge variant={report.badgeVariant} size="sm">{report.badge}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">{report.description}</p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={DownloadIcon}
              onClick={(e) => { e.stopPropagation(); handleDownloadPDF() }}
              loading={status === 'loading'}
              disabled={status === 'loading'}
            >
              {status === 'success' ? 'Downloaded!' : 'Generate'}
            </Button>
            <button
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Configure report parameters"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
            >
              <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expandable configuration panel */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="config"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1, transition: { duration: 0.22 } }}
              exit={{ height: 0, opacity: 0, transition: { duration: 0.18 } }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/60 rounded-b-2xl">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Report Parameters</p>
                <div className="flex flex-wrap gap-4">
                  {/* City Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                      {CITY_NAMES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pollutant Toggle */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">Pollutant</label>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                      {POLLUTANTS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPollutant(p.value)}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                            pollutant === p.value
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Days Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">Historical Period: <strong className="text-slate-700">{days} days</strong></label>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={days}
                      onChange={(e) => setDays(+e.target.value)}
                      className="w-36 accent-emerald-600"
                    />
                  </div>
                </div>

                {/* Error message */}
                {errorMsg && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-rose-600">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={DownloadIcon}
                    onClick={handleDownloadPDF}
                    loading={status === 'loading'}
                  >
                    {status === 'success' ? 'Downloaded!' : 'Generate Report'}
                  </Button>
                  <Link to={report.href} state={{ cities: [city], periodDays: days, pollutant, comparisonData: null }}>
                    <Button variant="outline" size="sm">
                      Open Print View
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Environmental Intelligence Reports"
        subtitle="Generate, configure and export regulatory-grade air quality audit documents with real measurement data"
        breadcrumbs={[
          { label: 'Platform', href: '/dashboard' },
          { label: 'Reports' },
        ]}
        badge={
          <Badge variant="brand" size="md">
            ISO / EPA Format
          </Badge>
        }
        actions={
          <Button variant="outline" size="sm" icon={RefreshCwIcon}>
            Refresh Audit Index
          </Button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
          <StatCard
            title="Report Types Available"
            value="3"
            unit="templates"
            icon={FileTextIcon}
          />
        </motion.div>
        <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
          <StatCard
            title="Export Engine"
            value="PDF"
            unit="Print-Ready"
            subtext="Vector SVG charts preserved"
            icon={CpuIcon}
          />
        </motion.div>
        <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
          <StatCard
            title="Audit Trail"
            value="100%"
            unit="Traceable"
            subtext="Open-Meteo & OpenAQ lineage"
            icon={ShieldCheckIcon}
          />
        </motion.div>
      </div>

      {/* Info Banner */}
      <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-6">
          <InfoIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold mb-0.5">Configure Report Parameters</p>
            <p>Click any report card to expand its configuration panel. Set the city, pollutant type and historical period before generating. PDF download requires an active backend connection. The print view is always available offline.</p>
          </div>
        </div>
      </motion.div>

      {/* Report Cards */}
      <div className="space-y-4">
        {REPORT_TYPES.map((report, i) => (
          <ReportCard key={report.id} report={report} index={i + 4} />
        ))}
      </div>
    </AppShell>
  )
}
