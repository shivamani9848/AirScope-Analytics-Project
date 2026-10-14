import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  GlobeIcon,
  BarChartIcon,
  TrendingUpIcon,
  LayersIcon,
  WindIcon,
  CpuIcon,
  SparklesIcon,
  FileTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from '../design-system/Icons'
import Badge from '../design-system/Badge'

export const NAVIGATION_ITEMS = [
  { name: 'Home', path: '/home', icon: GlobeIcon, description: 'Public Overview' },
  { name: 'Dashboard', path: '/dashboard', icon: LayersIcon, description: '3D Environmental Console', badge: '3D' },
  { name: 'Pollution Map', path: '/map', icon: WindIcon, description: 'Urban Dispersion' },
  { name: 'Trends', path: '/trends', icon: TrendingUpIcon, description: 'Diurnal Cycles' },
  { name: 'City Comparison', path: '/compare', icon: BarChartIcon, description: 'Multi-City Delta' },
  { name: 'Forecasting', path: '/forecast', icon: CpuIcon, description: 'SARIMAX 7-Day' },
  { name: 'AI Insights', path: '/ai-insights', icon: SparklesIcon, description: 'Environmental Agent' },
  { name: 'Reports', path: '/reports', icon: FileTextIcon, description: 'Audits & Exports' },
]

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  userPlan = 'pro',
  apiStatus = 'online',
}) {
  const location = useLocation()

  function isActive(path) {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true
    if (path === '/map' && location.pathname === '/map') return true
    return location.pathname === path
  }

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Sidebar navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        <Link to="/home" className="flex items-center gap-3 overflow-hidden group">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-soft shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-200">
              <span className="font-bold text-base text-slate-900 tracking-tight leading-tight">
                AirScope<span className="text-emerald-600">.</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                Analytics
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className={`px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
          Navigation
        </div>

        {NAVIGATION_ITEMS.map((item) => {
          const active = isActive(item.path)
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <div
                className={`flex items-center justify-center shrink-0 ${
                  active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <Badge
                      variant={item.badge === 'Live' ? 'good' : 'brand'}
                      size="sm"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-xs">
              <span className="text-slate-500 font-medium">Platform</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                API Online
              </span>
            </div>
            <Link
              to="/account"
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/70 shadow-soft flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-600 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-semibold text-slate-800 capitalize">{userPlan} Tier</span>
              </div>
              <Badge variant="pro" size="sm" className="text-[10px]">Settings</Badge>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <span
              className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"
              title="API Online"
            />
          </div>
        )}
      </div>
    </aside>
  )
}
