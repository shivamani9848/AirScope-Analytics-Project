const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchJson(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const msg = error.detail || error.message || (typeof error === 'string' ? error : `HTTP ${response.status}`)
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  
  return response.json()
}

export const authApi = {
  signup: (email, password) => fetchJson('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  
  login: (email, password) => fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  
  logout: () => fetchJson('/auth/logout', { method: 'POST' }),
  
  me: () => fetchJson('/auth/me'),

  changePassword: (current_password, new_password) => fetchJson('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password })
  })
}

