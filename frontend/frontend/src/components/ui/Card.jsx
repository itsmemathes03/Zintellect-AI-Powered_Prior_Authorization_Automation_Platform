export default function Card({ children, className = "", padding = true, ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-card dark:bg-navy-900 dark:border-navy-800 ${padding ? "p-6" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`text-base font-semibold text-slate-900 dark:text-white ${className}`}>
      {children}
    </h3>
  )
}
