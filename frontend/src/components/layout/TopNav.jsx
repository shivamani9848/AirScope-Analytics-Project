import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  SearchIcon,
  MapPinIcon,
  RefreshCwIcon,
  MenuIcon,
  UserIcon,
  SunIcon,
  WindIcon,
} from '../design-system/Icons'
import Badge from '../design-system/Badge'
import Button from '../design-system/Button'
import { useAuth } from '../../contexts/AuthContext'

export default function TopNav({
  onToggleMobileMenu,
  currentCity = 'London',
  onCitySelect,
  isCollapsed,
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const quickCities = ['London', 'Delhi', 'New York', 'Tokyo', 'Paris', 'Beijing']

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (searchQuery.trim() && onCitySelect) {
      onCitySelect(searchQuery.trim())
    }
  }

  function handleRefresh() {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/signin')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300 ease-in-out flex items-center justify-between px-4 sm:px-6 ${
        isCollapsed ? 'left-20' : 'left-0 lg:left-64'
      }`}
    >
      {/* Left: Mobile menu toggle + City Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle mobile menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <SearchIcon className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city telemetry (e.g. London, Delhi)..."
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </form>

        {/* Quick select pills */}
        <div className="hidden xl:flex items-center gap-1.5">
          {quickCities.slice(0, 3).map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onCitySelect?.(city)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                currentCity.toLowerCase() === city.toLowerCase()
                  ? 'bg-emerald-100 text-emerald-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Ambient Telemetry Pill + Quick Actions + User Profile */}
      <div className="flex items-center gap-3">
        {/* Ambient Telemetry Badge */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <MapPinIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentCity}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <SunIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>22°C</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <WindIcon className="w-3.5 h-3.5 text-sky-500" />
            <span>12 km/h</span>
          </div>
          <Badge variant="good" size="sm" dot>
            AQI 42 Good
          </Badge>
        </div>

        {/* Refresh Action */}
        <button
          type="button"
          onClick={handleRefresh}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
          title="Refresh live telemetry"
          aria-label="Refresh telemetry"
        >
          <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>

        {/* User Account / Auth Actions */}
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase">
                {user.email ? user.email.charAt(0) : 'U'}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                {user.email}
              </span>
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-card border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-medium text-slate-400">Signed in as</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
                  <Badge variant="pro" size="sm" className="mt-1.5 capitalize">
                    {user.plan || 'Free'} Tier
                  </Badge>
                </div>
                <Link
                  to="/account"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Account & Security
                </Link>
                <Link
                  to="/workspace"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Workspace Hub
                </Link>
                <Link
                  to="/reports"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Compliance Reports
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/signin">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
