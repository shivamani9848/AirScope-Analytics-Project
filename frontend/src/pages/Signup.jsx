import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/design-system/Button'
import Input from '../components/design-system/Input'
import Card from '../components/design-system/Card'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signup } = useAuth()
  const navigate = useNavigate()

  const validateForm = () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please provide an email address.')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid email address (e.g. user@domain.com).')
      return false
    }

    if (!password) {
      setError('Please choose a password.')
      return false
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return false
    }

    const hasAlpha = /[a-zA-Z]/.test(password)
    const hasNumOrSymbol = /[\d\W_]/.test(password)
    if (!hasAlpha || !hasNumOrSymbol) {
      setError('Password must contain at least one letter and at least one number or symbol.')
      return false
    }

    if (password !== confirmPassword) {
      setError('The passwords you entered do not match.')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)

    try {
      await signup(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed. An account with this email may already exist.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/home" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-soft shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
            </div>
            <div className="text-left">
              <span className="font-bold text-xl text-slate-900 tracking-tight leading-tight block">
                AirScope<span className="text-emerald-600">.</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block">
                Analytics
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create an AirScope Account
          </h1>
          <p className="mt-1.5 text-xs text-slate-600">
            Start tracking urban air-quality trends and dispersion models
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8 border-slate-200/90 shadow-card bg-white/95 backdrop-blur-sm">
          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in"
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="analyst@agency.gov"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                disabled={loading}
                required
                className="w-full text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="password">
                  Password
                </label>
                <span className="text-[10px] text-slate-600">Min 8 chars, 1 letter, 1 number</span>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  disabled={loading}
                  required
                  className="w-full text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (error) setError('')
                }}
                disabled={loading}
                required
                className="w-full text-sm"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full mt-2 justify-center shadow-soft shadow-emerald-500/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/signin" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </Card>

        {/* Security Disclosures */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-600 flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Passlib bcrypt salted key derivation & HttpOnly session authorization</span>
          </p>
        </div>
      </div>
    </div>
  )
}
