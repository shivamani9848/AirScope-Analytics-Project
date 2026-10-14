import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PlanGate from './PlanGate'

export default function RequireAuth({ children, requiredPlan = null }) {
  const { user, loading, hasPlan } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="w-screen min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Verifying session credentials...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Preserve requested route for automatic redirection after successful sign in
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  if (requiredPlan && !hasPlan(requiredPlan)) {
    return <PlanGate requiredPlan={requiredPlan} userPlan={user.plan} />
  }

  return children
}

