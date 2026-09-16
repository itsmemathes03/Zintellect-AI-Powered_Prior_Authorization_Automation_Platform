import { Component } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex items-center justify-center min-h-[40vh] p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Something went wrong</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                if (this.props.onReset) this.props.onReset()
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl"
              aria-label="Try again"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
