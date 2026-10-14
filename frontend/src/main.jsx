import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import RequireAuth from './components/RequireAuth'
import { AnimatePresence, motion } from 'framer-motion'
import './index.css'

// ── Eagerly loaded (small, always needed) ────────────────────────────────────
import Home from './Home.jsx'
import Signin from './pages/Signin.jsx'
import Signup from './pages/Signup.jsx'

// ── Lazy-loaded pages (code-split by Vite) ───────────────────────────────────
const PollutionDashboardPage = lazy(() => import('./pages/PollutionDashboardPage.jsx'))
const PollutionMapPage       = lazy(() => import('./pages/PollutionMapPage.jsx'))
const HistoricalTrendsPage   = lazy(() => import('./pages/HistoricalTrendsPage.jsx'))
const CityComparisonPage     = lazy(() => import('./pages/CityComparisonPage.jsx'))
const ForecastingPage        = lazy(() => import('./pages/ForecastingPage.jsx'))
const AIInsightsPage         = lazy(() => import('./pages/AIInsightsPage.jsx'))
const ReportsPage            = lazy(() => import('./pages/ReportsPage.jsx'))
const AccountSettingsPage    = lazy(() => import('./pages/AccountSettingsPage.jsx'))
const PrintComparisonReport  = lazy(() => import('./pages/PrintComparisonReport.jsx'))
const PrintForecastReport    = lazy(() => import('./pages/PrintForecastReport.jsx'))
// Workspace kept for /workspace data-collection tab only
const Workspace              = lazy(() => import('./Workspace.jsx'))

// ── Loading fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md animate-pulse">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          </svg>
        </div>
        <p className="text-sm text-slate-500 font-medium">Loading AirScope…</p>
      </div>
    </div>
  )
}

// ── Animated route wrapper ───────────────────────────────────────────────────
const pageVariants = {
  initial:  { opacity: 0, y: 6 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:     { opacity: 0, y: -4, transition: { duration: 0.15, ease: 'easeIn' } },
}

function AnimatedPage({ children }) {
  // Respect prefers-reduced-motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReduced) return <>{children}</>

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: '100%', minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  )
}

// ── Routing component (needs useLocation inside Router) ──────────────────────
function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Public */}
        <Route path="/home"   element={<AnimatedPage><Home /></AnimatedPage>} />
        <Route path="/signin" element={<AnimatedPage><Signin /></AnimatedPage>} />
        <Route path="/signup" element={<AnimatedPage><Signup /></AnimatedPage>} />

        {/* Free tier: 3D Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <AnimatedPage><PollutionDashboardPage /></AnimatedPage>
            </RequireAuth>
          }
        />

        {/* Free tier: Pollution Map */}
        <Route
          path="/map"
          element={
            <RequireAuth>
              <AnimatedPage><PollutionMapPage /></AnimatedPage>
            </RequireAuth>
          }
        />

        {/* Free tier: Account & Security */}
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AnimatedPage><AccountSettingsPage /></AnimatedPage>
            </RequireAuth>
          }
        />

        {/* Pro tier: Analytics */}
        <Route
          path="/trends"
          element={
            <RequireAuth requiredPlan="pro">
              <AnimatedPage><HistoricalTrendsPage /></AnimatedPage>
            </RequireAuth>
          }
        />
        <Route
          path="/compare"
          element={
            <RequireAuth requiredPlan="pro">
              <AnimatedPage><CityComparisonPage /></AnimatedPage>
            </RequireAuth>
          }
        />

        {/* Pro tier: Forecasting – dedicated standalone page */}
        <Route
          path="/forecast"
          element={
            <RequireAuth requiredPlan="pro">
              <AnimatedPage><ForecastingPage /></AnimatedPage>
            </RequireAuth>
          }
        />

        {/* Pro tier: Reports */}
        <Route
          path="/reports"
          element={
            <RequireAuth requiredPlan="pro">
              <AnimatedPage><ReportsPage /></AnimatedPage>
            </RequireAuth>
          }
        />

        {/* Pro tier: Workspace data-collection hub */}
        <Route
          path="/workspace"
          element={
            <RequireAuth requiredPlan="pro">
              <AnimatedPage><Workspace initialTab="data" /></AnimatedPage>
            </RequireAuth>
          }
        />

        {/* Enterprise tier: AI Insights – dedicated chat page */}
        <Route
          path="/ai-insights"
          element={
            <RequireAuth requiredPlan="enterprise">
              <AnimatedPage><AIInsightsPage /></AnimatedPage>
            </RequireAuth>
          }
        />

        {/* Printable reports */}
        <Route
          path="/print-comparison-report"
          element={
            <RequireAuth requiredPlan="pro">
              <PrintComparisonReport />
            </RequireAuth>
          }
        />
        <Route
          path="/print-forecast-report"
          element={
            <RequireAuth requiredPlan="pro">
              <PrintForecastReport />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

// ── Entry point ──────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
