import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../utils/api'

const AuthContext = createContext()

const PLAN_HIERARCHY = {
  free: 0,
  pro: 1,
  enterprise: 2,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('airscope_user')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    try {
      const userData = await authApi.me()
      setUser(userData)
      // Cache non-sensitive user profile metadata (no tokens/secrets)
      localStorage.setItem('airscope_user', JSON.stringify({
        id: userData.id,
        email: userData.email,
        plan: userData.plan,
        created_at: userData.created_at,
        last_login: userData.last_login,
      }))
      return userData
    } catch (error) {
      setUser(null)
      localStorage.removeItem('airscope_user')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    const freshUser = {
      id: res.id,
      email: res.email,
      plan: res.plan,
      created_at: res.created_at,
      last_login: res.last_login,
    }
    setUser(freshUser)
    localStorage.setItem('airscope_user', JSON.stringify(freshUser))
    return freshUser
  }

  const signup = async (email, password) => {
    const res = await authApi.signup(email, password)
    const freshUser = {
      id: res.id,
      email: res.email,
      plan: res.plan,
      created_at: res.created_at,
      last_login: res.last_login,
    }
    setUser(freshUser)
    localStorage.setItem('airscope_user', JSON.stringify(freshUser))
    return freshUser
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      localStorage.removeItem('airscope_user')
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    return await authApi.changePassword(currentPassword, newPassword)
  }

  const hasPlan = useCallback((requiredPlan) => {
    if (!user || !user.plan) return false
    const currentRank = PLAN_HIERARCHY[user.plan.toLowerCase()] ?? 0
    const requiredRank = PLAN_HIERARCHY[requiredPlan.toLowerCase()] ?? 0
    return currentRank >= requiredRank
  }, [user])

  const isPro = user ? hasPlan('pro') : false
  const isEnterprise = user ? hasPlan('enterprise') : false

  useEffect(() => {
    loadMe()
  }, [loadMe])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        loadMe,
        changePassword,
        hasPlan,
        isPro,
        isEnterprise,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

