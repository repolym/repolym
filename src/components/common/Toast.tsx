import React from 'react'
import { useToast } from '../../context/ToastContext'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xs border shadow-lg
            pointer-events-auto animate-slide-up min-w-[260px] max-w-sm
            ${toast.type === 'success' ? 'bg-surface-2 border-success/30 text-text-primary' : ''}
            ${toast.type === 'error' ? 'bg-surface-2 border-danger/30 text-text-primary' : ''}
            ${toast.type === 'info' ? 'bg-surface-2 border-border text-text-primary' : ''}
          `}
        >
          {/* Icon */}
          {toast.type === 'success' && (
            <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {toast.type === 'error' && (
            <div className="w-4 h-4 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          <span className="text-sm flex-1">{toast.message}</span>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}