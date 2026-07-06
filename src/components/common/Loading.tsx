// ============================================================
// FILE: src/components/common/Loading.tsx (IMPROVED)
// ============================================================
import React from 'react'

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size]
  return (
    <svg className={`animate-spin ${s} text-accent`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <Spinner size="lg" />
  </div>
)

export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`skeleton rounded-xs ${className}`} style={style} />
)

export const CardSkeleton: React.FC = () => (
  <div className="card p-4 space-y-3">
    <Skeleton className="h-3 w-1/3" />
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="h-3 w-1/2" />
  </div>
)

export const EmptyState: React.FC<{
  title: string
  description: string
  action?: React.ReactNode
}> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-10 h-10 rounded-xs bg-surface-3 flex items-center justify-center mb-4">
      <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
      </svg>
    </div>
    <h3 className="text-sm font-medium text-text-secondary mb-1">{title}</h3>
    <p className="text-xs text-text-tertiary max-w-xs mb-4">{description}</p>
    {action}
  </div>
)

export const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-sm text-danger mb-3">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary text-xs">
        دوباره تلاش کنید
      </button>
    )}
  </div>
)
