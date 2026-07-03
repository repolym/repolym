import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Spinner } from './Loading'

interface Props {
  loading?: boolean
  error?: string | null
  isEmpty?: boolean
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode | ((error: string) => React.ReactNode)
  emptyComponent?: React.ReactNode
  onRetry?: () => void
}

export const AsyncBoundary: React.FC<Props> = ({
  loading = false,
  error = null,
  isEmpty = false,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
}) => {
  // Error state takes priority
  if (error) {
    if (typeof errorComponent === 'function') {
      return <>{errorComponent(error)}</>
    }

    if (errorComponent) {
      return <>{errorComponent}</>
    }

    return (
      <div className="flex items-start gap-3 p-4 bg-danger/10 border border-danger/20 rounded-xs" role="alert">
        <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-medium text-sm text-text-primary">خطا در بارگذاری اطلاعات</p>
          <p className="text-xs text-text-secondary mt-0.5">{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn-secondary text-xs mt-3">
              دوباره تلاش کنید
            </button>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }

    return (
      <div className="flex items-center justify-center py-8" role="status" aria-label="در حال بارگذاری">
        <Spinner size="lg" />
      </div>
    )
  }

  // Empty state
  if (isEmpty) {
    if (emptyComponent) {
      return <>{emptyComponent}</>
    }

    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-sm text-text-tertiary">داده‌ای یافت نشد</p>
      </div>
    )
  }

  return <>{children}</>
}
