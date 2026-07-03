import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { logger } from '../../utils/logger'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorCount: number
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    logger.error('Error caught by ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
    })

    // Call optional callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>

            <h1 className="text-xl font-bold text-center text-gray-900 mb-2">مشکلی پیش آمد</h1>

            <p className="text-sm text-gray-600 text-center mb-4">
              متأسفانه برنامه با خطایی مواجه شد. لطفاً صفحه را دوباره بارگذاری کنید.
            </p>

            {import.meta.env.MODE === 'development' && this.state.error && (
              <details className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <summary className="cursor-pointer font-mono text-xs text-gray-700 hover:text-gray-900">
                  جزئیات خطا
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              تلاش دوباره
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}