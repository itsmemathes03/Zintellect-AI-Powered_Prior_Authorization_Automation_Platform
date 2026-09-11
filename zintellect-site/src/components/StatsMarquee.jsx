import { statsContent } from '../data/content'

export default function StatsMarquee() {
  const items = [...statsContent.stats, ...statsContent.stats]

  return (
    <div className="relative w-full overflow-hidden bg-navy-light/40 border-y border-white/5 py-3">
      <div className="flex whitespace-nowrap marquee-animate" aria-hidden="true">
        {items.map((stat, i) => (
          <span
            key={i}
            className="mx-8 flex items-center gap-3 text-sm font-mono"
          >
            <span className={`text-base font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-white/30 text-xs">{stat.label}</span>
            <span className="text-white/10 mx-2">|</span>
          </span>
        ))}
      </div>
    </div>
  )
}
