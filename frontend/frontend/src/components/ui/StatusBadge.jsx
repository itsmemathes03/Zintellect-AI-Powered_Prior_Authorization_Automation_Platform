const statusConfig = {
  approved: { color: "green", label: "Approved" },
  rejected: { color: "red", label: "Rejected" },
  pending: { color: "amber", label: "Pending" },
  processing: { color: "blue", label: "Processing" },
  "manual review": { color: "orange", label: "Manual Review" },
  "awaiting review": { color: "amber", label: "Awaiting Review" },
  "pending additional information": { color: "amber", label: "Info Needed" },
  "no policy available": { color: "gray", label: "No Policy" },
  error: { color: "red", label: "Error" },
  active: { color: "green", label: "Active" },
  inactive: { color: "gray", label: "Inactive" },
  draft: { color: "gray", label: "Draft" },
  enabled: { color: "green", label: "Enabled" },
  disabled: { color: "red", label: "Disabled" },
}

export default function StatusBadge({ status, className = "" }) {
  if (!status) return null
  const key = String(status).toLowerCase()
  const config = statusConfig[key] || { color: "gray", label: status }

  const colorMap = {
    green: "bg-success-50 text-success-700 border-success-500/20",
    red: "bg-danger-50 text-danger-700 border-danger-200",
    amber: "bg-warning-50 text-warning-700 border-warning-200",
    blue: "bg-brand-50 text-brand-700 border-brand-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    gray: "bg-slate-100 text-slate-600 border-slate-200",
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${colorMap[config.color]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        config.color === "green" ? "bg-success-500" :
        config.color === "red" ? "bg-danger-500" :
        config.color === "amber" ? "bg-warning-500" :
        config.color === "blue" ? "bg-brand-500" :
        config.color === "orange" ? "bg-orange-500" :
        "bg-slate-400"
      }`} />
      {config.label}
    </span>
  )
}
