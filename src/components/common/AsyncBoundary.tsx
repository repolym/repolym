import React from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  loading?: boolean
  error?: string | null
  isEmpty?: boolean
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode | ((error: string) => React.ReactNode)
  emptyComponent?: React.ReactNode
}

export const AsyncBoundary: React.FC<Props> = ({
  loading = false,
  error = null,
  isEmpty = false,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
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
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-red-900">خطا</p>
          <p className="text-sm text-red-700">{error}</p>
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
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
        <p className="text-gray-500">داده‌ای یافت نشد</p>
      </div>
    )
  }

  return <>{children}</>
}
