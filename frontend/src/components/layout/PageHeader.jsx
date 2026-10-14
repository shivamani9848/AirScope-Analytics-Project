import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from '../design-system/Icons'

export default function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  actions,
  className = '',
}) {
  return (
    <div className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              return (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />}
                  {crumb.href && !isLast ? (
                    <Link to={crumb.href} className="hover:text-emerald-600 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'font-semibold text-slate-800' : ''}>{crumb.label}</span>
                  )}
                </React.Fragment>
              )
            })}
          </nav>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && <p className="mt-1 text-sm text-slate-500 leading-relaxed">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  )
}
