// ============================================================
// FILE: src/components/common/ErrorBoundary.tsx (COMPLETE)
// ============================================================
import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { logger } from '../../utils/logger'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error caught by ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
    })
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isAuthError = this.state.error?.message?.toLowerCase().includes('auth') ||
        this.state.error?.message?.toLowerCase().includes('jwt') ||
        this.state.error?.message?.toLowerCase().includes('session')

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-0 p-4" role="alert">
          <div className="max-w-md w-full bg-surface-2 border border-border rounded-xs shadow-2xl p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-danger/10 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-danger" aria-hidden="true" />
            </div>

            <h1 className="text-lg font-bold text-center text-text-primary mb-2">
              {isAuthError ? 'نشست شما منقضی شده است' : 'مشکلی پیش آمد'}
            </h1>

            <p className="text-sm text-text-secondary text-center mb-4">
              {isAuthError
                ? 'لطفاً دوباره وارد حساب خود شوید.'
                : 'متأسفانه برنامه با خطایی مواجه شد. می‌توانید دوباره تلاش کنید یا به صفحه اصلی بازگردید.'
              }
            </p>

            {import.meta.env.MODE === 'development' && this.state.error && (
              <details className="mb-4 p-3 bg-surface-3 rounded-xs border border-border-subtle">
                <summary className="cursor-pointer font-mono text-xs text-text-secondary hover:text-text-primary">
                  جزئیات خطا
                </summary>
                <pre className="mt-2 text-xs text-text-tertiary overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              {isAuthError ? (
                <button
                  onClick={this.handleGoHome}
                  className="btn-primary flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <Home className="w-4 h-4" aria-hidden="true" />
                  رفتن به صفحه ورود
                </button>
              ) : (
                <>
                  <button
                    onClick={this.handleReset}
                    className="btn-primary flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    تلاش دوباره
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="btn-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <Home className="w-4 h-4" aria-hidden="true" />
                    صفحه اصلی
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}