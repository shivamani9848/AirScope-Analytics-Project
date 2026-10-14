import React, { useEffect, useRef } from 'react'

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg',
  showClose = true,
}) {
  const overlayRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleBackdropClick(e) {
    if (e.target === overlayRef.current) {
      onClose?.()
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`relative w-full ${maxWidth} rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95`}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
            <div>
              {title && (
                <h3 id="modal-title" className="text-base font-semibold text-slate-900">
                  {title}
                </h3>
              )}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto -mr-2 -mt-1 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-5 max-h-[calc(100vh-14rem)] overflow-y-auto text-slate-700 text-sm">
          {children}
        </div>

        {footer && (
          <div className="border-t border-slate-100 px-6 py-3.5 bg-slate-50/70 flex items-center justify-end gap-3 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
