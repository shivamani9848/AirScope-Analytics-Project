import React from 'react'

export function Card({
  children,
  className = '',
  hover = true,
  padding = 'p-6',
  header,
  title,
  subtitle,
  action,
  footer,
  ...props
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white transition-all duration-200 shadow-soft ${
        hover ? 'hover:shadow-card hover:border-slate-300/80' : ''
      } ${className}`}
      {...props}
    >
      {(header || title) && (
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="ml-4 flex items-center">{action}</div>}
        </div>
      )}
      <div className={padding}>{children}</div>
      {footer && (
        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/60 rounded-b-2xl text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  )
}

export function StatCard({
  title,
  value,
  unit = '',
  delta,
  deltaType = 'neutral', // 'positive' | 'negative' | 'neutral'
  deltaLabel = 'vs last 24h',
  icon: Icon,
  badge,
  subtext,
  className = '',
  ...props
}) {
  const deltaColors = {
    positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    negative: 'text-rose-700 bg-rose-50 border-rose-200',
    neutral: 'text-slate-600 bg-slate-100 border-slate-200',
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all duration-200 hover:shadow-card hover:border-slate-300/80 ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
            <Icon className="h-4.5 w-4.5 text-emerald-600" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </div>

      {(delta !== undefined || badge || subtext) && (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          {delta !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${deltaColors[deltaType]}`}>
                {deltaType === 'positive' && '+'}
                {deltaType === 'negative' && '-'}
                {delta}
              </span>
              {deltaLabel && <span className="text-slate-500 text-[11px]">{deltaLabel}</span>}
            </div>
          )}
          {badge && <div>{badge}</div>}
          {subtext && !delta && <span className="text-slate-500 text-[11px]">{subtext}</span>}
        </div>
      )}
    </div>
  )
}

export default Card
