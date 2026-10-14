import React from 'react'

export function getAqiCategory(aqi) {
  const val = Number(aqi)
  if (isNaN(val)) return { label: 'Unknown', variant: 'neutral', color: 'text-slate-600 bg-slate-100 border-slate-200' }
  if (val <= 50) return { label: 'Good', variant: 'good', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (val <= 100) return { label: 'Moderate', variant: 'moderate', color: 'text-amber-700 bg-amber-50 border-amber-200' }
  if (val <= 150) return { label: 'Sensitive', variant: 'sensitive', color: 'text-orange-700 bg-orange-50 border-orange-200' }
  if (val <= 200) return { label: 'Unhealthy', variant: 'unhealthy', color: 'text-rose-700 bg-rose-50 border-rose-200' }
  if (val <= 300) return { label: 'Very Unhealthy', variant: 'very-unhealthy', color: 'text-purple-700 bg-purple-50 border-purple-200' }
  return { label: 'Hazardous', variant: 'hazardous', color: 'text-rose-950 bg-rose-100 border-rose-300' }
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const variantMap = {
    // Standard semantic
    brand: 'text-emerald-800 bg-emerald-50 border-emerald-200/80',
    success: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    warning: 'text-amber-800 bg-amber-50 border-amber-200',
    danger: 'text-rose-700 bg-rose-50 border-rose-200',
    info: 'text-sky-700 bg-sky-50 border-sky-200',
    neutral: 'text-slate-700 bg-slate-100 border-slate-200/80',
    outline: 'text-slate-700 bg-white border-slate-200',
    
    // AQI EPA Scale variants
    good: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    moderate: 'text-amber-700 bg-amber-50 border-amber-200',
    sensitive: 'text-orange-700 bg-orange-50 border-orange-200',
    unhealthy: 'text-rose-700 bg-rose-50 border-rose-200',
    'very-unhealthy': 'text-purple-700 bg-purple-50 border-purple-200',
    hazardous: 'text-rose-950 bg-rose-100 border-rose-300',
    
    // Subscription tiers
    free: 'text-slate-700 bg-slate-100 border-slate-200',
    pro: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    enterprise: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  }

  const dotColorMap = {
    brand: 'bg-emerald-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
    outline: 'bg-slate-400',
    good: 'bg-emerald-500',
    moderate: 'bg-amber-500',
    sensitive: 'bg-orange-500',
    unhealthy: 'bg-rose-500',
    'very-unhealthy': 'bg-purple-500',
    hazardous: 'bg-rose-900',
    free: 'bg-slate-400',
    pro: 'bg-emerald-500',
    enterprise: 'bg-indigo-500',
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variantMap[variant] || variantMap.neutral} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColorMap[variant] || 'bg-slate-400'} animate-pulse`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
