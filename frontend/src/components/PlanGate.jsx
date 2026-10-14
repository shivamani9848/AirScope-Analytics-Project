import React from 'react'
import { Link } from 'react-router-dom'
import AppShell from './layout/AppShell'
import Card from './design-system/Card'
import Button from './design-system/Button'
import Badge from './design-system/Badge'
import { ShieldCheckIcon, SparklesIcon, TrendingUpIcon, FileTextIcon, CpuIcon } from './design-system/Icons'

const PLAN_FEATURES = {
  pro: {
    title: 'AirScope Pro Subscription Required',
    badge: 'Pro Tier Feature',
    description: 'This analytical workspace requires an active Pro subscription for deep diurnal modeling and cross-city intelligence.',
    features: [
      { name: 'Historical Diurnal Trends', desc: 'Full 30-day temporal analytics with hourly, daily, and monthly mean aggregations', icon: TrendingUpIcon },
      { name: 'Multi-City Delta Comparison', desc: 'Side-by-side benchmarking of up to 3 urban airsheds with relative delta rankings', icon: ShieldCheckIcon },
      { name: 'SARIMAX 7-Day Forecasting', desc: 'Predictive atmospheric dispersion models with 95% confidence intervals', icon: CpuIcon },
      { name: 'Regulatory PDF Report Exports', desc: 'Instant EPA-aligned compliance audits with automated statistical summaries', icon: FileTextIcon },
    ],
  },
  enterprise: {
    title: 'AirScope Enterprise Tier Required',
    badge: 'Enterprise Intelligence',
    description: 'Autonomous environmental intelligence agents and Gemma LLM reasoning require an active Enterprise subscription.',
    features: [
      { name: 'Autonomous Environmental Agent', desc: 'Multi-step diagnostic agent capable of automated scraping, analysis, and synthesis', icon: SparklesIcon },
      { name: 'Gemma 3:4b LLM Analytical Notes', desc: 'Natural language atmospheric risk synthesis tailored for environmental regulators', icon: FileTextIcon },
      { name: 'High-Volume Ingestion & MCP Tools', desc: 'Full access to MCP Model Context Protocol endpoints and extended 90-day lookbacks', icon: CpuIcon },
      { name: 'Dedicated Airshed Telemetry', desc: 'Priority execution queues and real-time station monitoring networks', icon: ShieldCheckIcon },
    ],
  },
}

export default function PlanGate({ requiredPlan = 'pro', userPlan = 'free', inAppShell = true }) {
  const planInfo = PLAN_FEATURES[requiredPlan.toLowerCase()] || PLAN_FEATURES.pro

  const content = (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <Card className="p-8 sm:p-10 border-slate-200/80 shadow-soft bg-white/90 backdrop-blur-md relative overflow-hidden">
        {/* Subtle Ambient Background Flare */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-emerald-100/60 via-teal-50/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Badge variant="pro" size="md" dot>
              {planInfo.badge}
            </Badge>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Plan: <span className="text-slate-800 capitalize font-bold">{userPlan}</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
            {planInfo.title}
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed mb-8">
            {planInfo.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {planInfo.features.map((feat) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.name}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100/80 text-emerald-800 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 mb-0.5">{feat.name}</h3>
                      <p className="text-[11px] text-slate-500 leading-normal">{feat.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="secondary" size="md">
                  Return to Dashboard
                </Button>
              </Link>
              <Link to="/account">
                <Button variant="ghost" size="md">
                  View Account Settings
                </Button>
              </Link>
            </div>

            <div className="text-xs text-slate-500 italic">
              Need access? Contact your workspace administrator to update your account tier.
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  if (inAppShell) {
    return <AppShell userPlan={userPlan}>{content}</AppShell>
  }

  return content
}
