import React from 'react'

export function Spinner({ size = 'md', className = '', color = 'text-emerald-600' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-slate-200 border-t-current ${color} ${sizes[size] || sizes.md} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  }

  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${variants[variant] || variants.rectangular} ${className}`}
      aria-hidden="true"
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton variant="circular" className="h-9 w-9" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}

export default Spinner
