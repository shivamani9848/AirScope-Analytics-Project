import React, { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    trailingIcon: TrailingIcon,
    onTrailingIconClick,
    type = 'text',
    id,
    name,
    required = false,
    disabled = false,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const inputId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-soft">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            Icon ? 'pl-10' : ''
          } ${TrailingIcon ? 'pr-10' : ''} ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900'
              : 'border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
          } ${className}`}
          {...props}
        />
        {TrailingIcon && (
          <button
            type="button"
            onClick={onTrailingIconClick}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            <TrailingIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  )
})

export const Select = forwardRef(function Select(
  {
    label,
    options = [],
    error,
    helperText,
    icon: Icon,
    id,
    name,
    required = false,
    disabled = false,
    className = '',
    containerClassName = '',
    children,
    ...props
  },
  ref
) {
  const selectId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-soft">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
        <select
          ref={ref}
          id={selectId}
          name={name}
          disabled={disabled}
          required={required}
          className={`block w-full appearance-none rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            Icon ? 'pl-10' : ''
          } pr-10 ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
          } ${className}`}
          {...props}
        >
          {children ? (
            children
          ) : (
            options.map((opt) => {
              const val = typeof opt === 'object' ? opt.value : opt
              const lbl = typeof opt === 'object' ? opt.label : opt
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              )
            })
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  )
})

export default Input
