import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"

const ToastContext = createContext()

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Listen for standalone toast events (from toast.js utility)
  useEffect(() => {
    const handler = (e) => {
      const { id, message, type, duration } = e.detail
      setToasts((prev) => [...prev, { id, message, type }])
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
      }
    }
    window.addEventListener("zintellect:toast", handler)
    return () => window.removeEventListener("zintellect:toast", handler)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-top transition-all duration-300 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : toast.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
            ) : toast.type === "error" ? (
              <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            ) : toast.type === "warning" ? (
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}
