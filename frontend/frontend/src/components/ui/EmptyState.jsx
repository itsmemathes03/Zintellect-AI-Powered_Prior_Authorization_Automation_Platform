import { AlertTriangle, RefreshCw } from "lucide-react"
import Button from "./Button"

export default function EmptyState({ icon: Icon = AlertTriangle, title, description, action, onAction, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-navy-800 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      )}
      {action && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  )
}

export function ErrorState({ title = "Something went wrong", description, onRetry, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-xl bg-danger-50 dark:bg-danger-500/10 flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-danger-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
        {description || "Please try again or contact support if the issue persists."}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw size={14} /> Try Again
        </Button>
      )}
    </div>
  )
}
