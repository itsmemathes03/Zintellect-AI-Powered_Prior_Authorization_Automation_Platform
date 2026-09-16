import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = "brand", className = "" }) {
  const colorMap = {
    brand: { bg: "bg-brand-50 dark:bg-brand-900/20", icon: "text-brand-600 dark:text-brand-400", ring: "ring-brand-600/10" },
    teal: { bg: "bg-teal-50 dark:bg-teal-900/20", icon: "text-teal-600 dark:text-teal-400", ring: "ring-teal-600/10" },
    green: { bg: "bg-success-50 dark:bg-success-500/10", icon: "text-success-600 dark:text-success-500", ring: "ring-success-600/10" },
    amber: { bg: "bg-warning-50 dark:bg-warning-500/10", icon: "text-warning-600 dark:text-warning-500", ring: "ring-warning-600/10" },
    red: { bg: "bg-danger-50 dark:bg-danger-500/10", icon: "text-danger-600 dark:text-danger-500", ring: "ring-danger-600/10" },
    purple: { bg: "bg-purple-50 dark:bg-purple-900/20", icon: "text-purple-600 dark:text-purple-400", ring: "ring-purple-600/10" },
  }

  const c = colorMap[color] || colorMap.brand

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200 dark:bg-navy-900 dark:border-navy-800 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {trendLabel && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" && <ArrowUpRight size={14} className="text-success-600" />}
              {trend === "down" && <ArrowDownRight size={14} className="text-danger-600" />}
              {trend === "neutral" && <Minus size={14} className="text-slate-400" />}
              <span className={`text-xs font-medium ${
                trend === "up" ? "text-success-600" :
                trend === "down" ? "text-danger-600" :
                "text-slate-500"
              }`}>{trendLabel}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center ring-1 ${c.ring}`}>
            <Icon size={20} className={c.icon} />
          </div>
        )}
      </div>
    </div>
  )
}
