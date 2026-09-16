export default function Skeleton({ className = "", variant = "rect" }) {
  const base = "animate-pulse bg-slate-200 dark:bg-navy-800"
  const variants = {
    rect: "rounded-lg",
    circle: "rounded-full",
    text: "rounded h-4",
    title: "rounded h-6",
    card: "rounded-xl h-32",
  }
  return <div className={`${base} ${variants[variant]} ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 dark:bg-navy-900 dark:border-navy-800">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="title" className="w-32" />
          <Skeleton variant="text" className="w-48" />
        </div>
        <Skeleton variant="circle" className="w-12 h-12" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-3 border-b border-slate-200 dark:border-navy-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 py-3">
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} variant="text" className="flex-1 h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <Skeleton variant="title" className="w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    </div>
  )
}
