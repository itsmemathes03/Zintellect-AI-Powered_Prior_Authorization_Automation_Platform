const colorMap = {
  blue: "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-800",
  green: "bg-success-50 text-success-700 border-success-500/20 dark:bg-success-500/10 dark:text-success-500",
  red: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-500 dark:border-danger-800",
  amber: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-500 dark:border-warning-800",
  teal: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800",
  gray: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-navy-800 dark:text-slate-400 dark:border-navy-700",
  purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
  orange: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
}

const sizeMap = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
}

export default function Badge({ children, color = "gray", size = "md", dot = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${colorMap[color]} ${sizeMap[size]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          color === "green" ? "bg-success-500" :
          color === "red" ? "bg-danger-500" :
          color === "amber" ? "bg-warning-500" :
          color === "blue" ? "bg-brand-500" :
          color === "teal" ? "bg-teal-500" :
          color === "purple" ? "bg-purple-500" :
          color === "orange" ? "bg-orange-500" :
          "bg-slate-400"
        }`} />
      )}
      {children}
    </span>
  )
}
