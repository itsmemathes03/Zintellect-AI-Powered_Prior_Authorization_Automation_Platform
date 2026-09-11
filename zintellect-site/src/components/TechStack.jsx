import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { techStackContent } from '../data/content'

const catColor = {
  frontend: { dot: 'bg-sky-400', pill: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
  backend: { dot: 'bg-emerald-400', pill: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  ai: { dot: 'bg-purple-400', pill: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
  database: { dot: 'bg-amber-400', pill: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  security: { dot: 'bg-rose-400', pill: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
  devops: { dot: 'bg-teal-400', pill: 'border-teal-500/30 bg-teal-500/10 text-teal-300' },
}

export default function TechStack() {
  const [activeCat, setActiveCat] = useState('all')
  const [hoveredItem, setHoveredItem] = useState(null)
  const headerRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: headerRef.current,
        start: 'top 75%',
        onEnter: () => {
          gsap.from(headerRef.current, { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out' })
        },
      })
    }, headerRef)
    return () => ctx.revert()
  }, [])

  const filtered =
    activeCat === 'all'
      ? techStackContent.items
      : techStackContent.items.filter((item) => item.cat === activeCat)

  return (
    <section
      id="techstack"
      data-bg="#0B1120"
      className="relative section-padding overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-20" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-block rounded-full border border-teal/30 bg-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-teal-light mb-5">
            Technology
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-2">
            {techStackContent.title}
          </h2>
        </div>

        {/* Category pills - compact toggle row */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-6" role="tablist" aria-label="Filter by category">
          {techStackContent.categories.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeCat === cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-medium tracking-wide transition-all ${
                activeCat === cat.id
                  ? 'bg-teal text-navy shadow-sm shadow-teal/20'
                  : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70 border border-white/[0.06]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Horizontal scrolling belt */}
        <div className="relative">
          {/* Edge fade indicators */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0B1120] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0B1120] to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#1E293B transparent' }}
          >
            {filtered.map((item) => {
              const cc = catColor[item.cat] || catColor.devops
              const isHovered = hoveredItem === item.name
              return (
                <div
                  key={item.name}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onFocus={() => setHoveredItem(item.name)}
                  onBlur={() => setHoveredItem(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.name} — ${item.cat}`}
                >
                  {/* Tech chip */}
                  <motion.div
                    layout
                    className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all duration-200 cursor-default whitespace-nowrap ${
                      isHovered
                        ? `${cc.pill} border-opacity-60 shadow-sm`
                        : 'border-white/[0.06] bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/70'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cc.dot} flex-shrink-0`} />
                    {item.name}
                  </motion.div>

                  {/* Floating tooltip on hover */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 w-48 pointer-events-none"
                    >
                      <div className="rounded-lg border border-white/[0.08] bg-navy-dark/95 backdrop-blur-xl px-3 py-2.5 shadow-xl shadow-black/40">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${cc.dot}`} />
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                            item.cat === 'frontend' ? 'text-sky-400' :
                            item.cat === 'backend' ? 'text-emerald-400' :
                            item.cat === 'ai' ? 'text-purple-400' :
                            item.cat === 'database' ? 'text-amber-400' :
                            item.cat === 'security' ? 'text-rose-400' : 'text-teal-400'
                          }`}>
                            {item.cat}
                          </span>
                        </div>
                        <p className="text-white/50 text-[11px] leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Count summary */}
        <div className="text-center mt-6">
          <span className="text-[11px] text-white/20 font-mono">
            {filtered.length} / {techStackContent.items.length} technologies
          </span>
        </div>
      </div>
    </section>
  )
}
