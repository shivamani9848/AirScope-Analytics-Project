import React from 'react'

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-card focus:ring-emerald-500 border border-emerald-600 active:scale-[0.98]',
    secondary: 'bg-slate-100 hover:bg-slate-200/90 text-slate-800 border border-slate-200/80 focus:ring-slate-400 active:scale-[0.98]',
    outline: 'bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 focus:ring-emerald-500 active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-400',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-soft focus:ring-rose-500 active:scale-[0.98]'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 font-semibold'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-0.5 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      ) : null}
      <span>{children}</span>
    </button>
  )
}
