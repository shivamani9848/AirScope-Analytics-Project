import React from 'react'

export default function Toast({
  id,
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  onDismiss,
  duration,
  className = '',
}) {
  const styles = {
    success: {
      bg: 'bg-white border-emerald-200 text-slate-800',
      iconColor: 'text-emerald-600',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-white border-rose-200 text-slate-800',
      iconColor: 'text-rose-600',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <line x1="12" y1="8" x2="12" y2="12" strokeWidth={2} />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2} strokeLinecap="round" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-white border-amber-200 text-slate-800',
      iconColor: 'text-amber-600',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-white border-sky-200 text-slate-800',
      iconColor: 'text-sky-600',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <line x1="12" y1="16" x2="12" y2="12" strokeWidth={2} />
          <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth={2} strokeLinecap="round" />
        </svg>
      ),
    },
  }

  const current = styles[type] || styles.info

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-card transition-all duration-200 ${current.bg} ${className}`}
    >
      <div className={`shrink-0 ${current.iconColor}`}>{current.icon}</div>
      <div className="flex-1 pt-0.5">
        {title && <p className="text-sm font-semibold text-slate-900">{title}</p>}
        {message && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{message}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
