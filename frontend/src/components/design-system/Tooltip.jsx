import React, { useState } from 'react'

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className = '',
}) {
  const [visible, setVisible] = useState(false)
  const [timer, setTimer] = useState(null)

  function show() {
    const t = setTimeout(() => setVisible(true), delay)
    setTimer(t)
  }

  function hide() {
    clearTimeout(timer)
    setVisible(false)
  }

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          className={`absolute z-40 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 ${positions[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
