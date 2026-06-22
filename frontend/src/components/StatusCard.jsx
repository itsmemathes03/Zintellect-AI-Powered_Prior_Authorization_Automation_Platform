import {

  CheckCircle2,

  XCircle,

  AlertTriangle,

  Clock,

} from "lucide-react"

export default function StatusCard({ result }) {

  if (!result) return null

  const status = result.status || result.decision || "Pending"

  const isApproved = status === "Approved"

  const isRejected = status === "Rejected"

  const isError = status === "Error"

  const isPending = status === "Pending" || status === "Processing"

  const confidence = result.confidence_score || 0

  const config = isApproved

    ? { icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-500", label: "Approved" }
    : isRejected
    ? { icon: XCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-500", label: "Rejected" }
    : isError
    ? { icon: XCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-500", label: "Error" }
    : { icon: AlertTriangle, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-400", label: "Pending Review" }

  const StatusIcon = config.icon

  const rawMessage = result.message || result.xai_reasoning || result.explanation || result.provider_explanation || ""

  const message = typeof rawMessage === "string" ? rawMessage : typeof rawMessage === "object" ? JSON.stringify(rawMessage) : String(rawMessage)

  return (
    <div className={`${config.bg} border ${config.border} rounded-2xl p-6`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${config.badge} flex items-center justify-center shrink-0`}>
          <StatusIcon className="text-white" size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className={`text-lg font-bold ${config.color}`}>{config.label}</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
              {confidence}% confidence
            </span>
            {result.request_id && (
              <span className="text-xs text-slate-400 font-mono">
                {result.request_id.slice(0, 8)}...
              </span>
            )}
          </div>
          {message && (
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{message}</p>
          )}
          {result.processing_time_seconds && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <Clock size={12} />
              <span>{result.processing_time_seconds}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
