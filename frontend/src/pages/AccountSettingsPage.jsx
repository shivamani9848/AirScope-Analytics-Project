import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/layout/AppShell'
import Card from '../components/design-system/Card'
import Button from '../components/design-system/Button'
import Badge from '../components/design-system/Badge'
import Input from '../components/design-system/Input'
import {
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  FileTextIcon,
  CpuIcon,
  LayersIcon,
} from '../components/design-system/Icons'

export default function AccountSettingsPage() {
  const { user, logout, changePassword } = useAuth()
  const navigate = useNavigate()

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState({ type: null, message: '' })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // API Key management state
  const [apiKeyMasked, setApiKeyMasked] = useState('sk_live_airscope_••••••••••••••••7c4a')
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState(null)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordStatus({ type: null, message: '' })

    if (!currentPassword) {
      setPasswordStatus({ type: 'error', message: 'Current password is required.' })
      return
    }

    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters long.' })
      return
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[\d\W_]/.test(newPassword)) {
      setPasswordStatus({
        type: 'error',
        message: 'New password must contain both alphabetical letters and numeric/symbol characters.',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New password and confirmation do not match.' })
      return
    }

    setIsUpdatingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordStatus({ type: 'success', message: 'Your password was updated successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        message: err.message || 'Failed to change password. Please verify your current password.',
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleRollApiKey = () => {
    // Generate a secure random sample key for demonstration
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const generated = `sk_live_airscope_${randomHex}`
    setNewlyGeneratedKey(generated)
    setApiKeyMasked(`sk_live_airscope_••••••••••••••••${randomHex.slice(-4)}`)
    setShowKeyDialog(true)
  }

  const handleSignOut = async () => {
    await logout()
    navigate('/signin')
  }

  const planName = (user?.plan || 'free').toLowerCase()
  const isProOrHigher = planName === 'pro' || planName === 'enterprise'
  const isEnterprise = planName === 'enterprise'

  return (
    <AppShell userPlan={user?.plan || 'free'}>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Security Settings</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your environmental analyst identity, subscription tier, and API credentials
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 self-start sm:self-auto">
            Sign Out of Session
          </Button>
        </div>

        {/* Profile & Identity Card */}
        <Card className="p-6 border-slate-200/80 shadow-soft bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl uppercase shadow-soft shadow-emerald-500/20">
                {user?.email ? user.email.charAt(0) : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{user?.email || 'Authenticated Analyst'}</h2>
                  <Badge variant={isEnterprise ? 'enterprise' : isProOrHigher ? 'pro' : 'good'} size="sm" className="capitalize">
                    {user?.plan || 'Free'} Plan
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Account ID: #{user?.id || '1001'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Session State</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Authenticated (RFC 6265)
                </span>
              </div>
            </div>
          </div>

          {/* Account Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Subscription Status</span>
              <span className="text-xs font-bold text-slate-800 capitalize mt-0.5 block">{user?.plan || 'Free'} Tier Active</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Authentication Mechanism</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">HttpOnly Cookie + HS256</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Session Expiration</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">60-Min Rolling Window</span>
            </div>
          </div>
        </Card>

        {/* Plan Entitlements Matrix */}
        <Card className="p-6 border-slate-200/80 shadow-soft bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Subscription Entitlements</h2>
              <p className="text-xs text-slate-500">Access control restrictions applied to your account across AirScope endpoints</p>
            </div>
            <Badge variant="brand" size="sm">
              Role: {user?.plan || 'Free'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <LayersIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">3D Pollution Map & Live Dashboard</h3>
                  <Badge variant="good" size="sm" className="text-[10px]">Included</Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Real-time low-poly isometric city visualization, AQI, and weather telemetry.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`p-2 rounded-lg shrink-0 ${isProOrHigher ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                <TrendingUpIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">Historical Trends & Aggregations</h3>
                  <Badge variant={isProOrHigher ? 'good' : 'warning'} size="sm" className="text-[10px]">
                    {isProOrHigher ? 'Enabled' : 'Requires Pro'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">30-day lookback windows with hourly, daily, and monthly mean temporal aggregation.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`p-2 rounded-lg shrink-0 ${isProOrHigher ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                <CpuIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">Multi-City Comparison & SARIMAX</h3>
                  <Badge variant={isProOrHigher ? 'good' : 'warning'} size="sm" className="text-[10px]">
                    {isProOrHigher ? 'Enabled' : 'Requires Pro'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Multi-airshed delta rankings and 7-day statistical dispersion forecasting.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`p-2 rounded-lg shrink-0 ${isEnterprise ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                <SparklesIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">AI Environmental Intelligence Agent</h3>
                  <Badge variant={isEnterprise ? 'good' : 'warning'} size="sm" className="text-[10px]">
                    {isEnterprise ? 'Enabled' : 'Requires Enterprise'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Gemma 3:4b LLM agent reasoning, automated tool calling, and regulatory notes.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* API Credentials Management */}
        <Card className="p-6 border-slate-200/80 shadow-soft bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Developer API Key</h2>
              <p className="text-xs text-slate-500">Programmatic authentication key for headless ingestion and CLI queries</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRollApiKey}>
              Regenerate Key
            </Button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between font-mono text-xs text-slate-700">
            <span>{apiKeyMasked}</span>
            <span className="text-[11px] font-sans text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-md">
              X-API-KEY Header
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Private credentials and password hashes are never exposed over the wire. API keys inherit your account's plan permissions.
          </p>

          {/* One-Time Disclosure Modal */}
          {showKeyDialog && newlyGeneratedKey && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">New API Key Generated</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Please copy this secret key now. For security purposes, it will not be displayed again.
                  </p>
                  <div className="mt-2 p-2 bg-white rounded-lg border border-emerald-200 font-mono text-xs text-emerald-950 select-all">
                    {newlyGeneratedKey}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeyDialog(false)}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Change Password Form */}
        <Card className="p-6 border-slate-200/80 shadow-soft bg-white">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Change Account Password</h2>
            <p className="text-xs text-slate-500">Update your account credentials using salted bcrypt verification</p>
          </div>

          {passwordStatus.message && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              <span>{passwordStatus.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="currentPassword">
                Current Password
              </label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isUpdatingPassword}
                required
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="newPassword">
                New Password (min 8 characters)
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isUpdatingPassword}
                required
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isUpdatingPassword}
                required
                className="w-full text-xs"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isUpdatingPassword}
              className="mt-2"
            >
              {isUpdatingPassword ? 'Verifying & Updating...' : 'Update Password'}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  )
}
