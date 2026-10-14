import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Sidebar, { NAVIGATION_ITEMS } from './Sidebar'
import TopNav from './TopNav'
import { XIcon, ShieldCheckIcon } from '../design-system/Icons'
import Badge from '../design-system/Badge'
import { useAuth } from '../../contexts/AuthContext'

export default function AppShell({
  children,
  currentCity = 'London',
  onCitySelect,
}) {
  const { user } = useAuth()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-surface-50 text-slate-800 antialiased font-sans flex">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          userPlan={user?.plan || 'pro'}
          apiStatus="online"
        />
      </div>

      {/* Mobile Drawer Backdrop & Navigation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl p-4 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-soft">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">AirScope Analytics</h2>
                    <p className="text-[10px] text-slate-400">Environmental Intelligence</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-1">
                {NAVIGATION_ITEMS.map((item) => {
                  const Icon = item.icon
                  const active =
                    location.pathname === item.path ||
                    (item.path === '/workspace' && location.pathname === '/dashboard')
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                        active
                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="good" size="sm" className="text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Tier: <strong className="capitalize text-slate-700">{user?.plan || 'Free'}</strong></span>
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  API Online
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <TopNav
          isCollapsed={isCollapsed}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          currentCity={currentCity}
          onCitySelect={onCitySelect}
        />

        <main className="flex-1 mt-16 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
