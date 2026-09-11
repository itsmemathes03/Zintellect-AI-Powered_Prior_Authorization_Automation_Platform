import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { benefitsContent, chartData } from '../data/content'
import { Icon } from './Icon'

// --- Animated counter ---
function AnimatedStat({ value, suffix, label, delay = 0 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const animated = useRef(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { setDisplay(value); return }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const duration = 2200
          const start = performance.now()
          const step = (now) => {
            const p = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setDisplay(Math.round(eased * value))
            if (p < 1) requestAnimationFrame(step)
          }
          setTimeout(() => requestAnimationFrame(step), delay)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, delay])

  return (
    <div ref={ref} className="text-center mb-5">
      <span className="text-4xl sm:text-5xl font-heading font-bold gradient-text">
        {display}{suffix}
      </span>
      <p className="text-white/40 text-xs mt-1">{label}</p>
    </div>
  )
}

// --- Animated horizontal bar ---
function AnimatedBar({ label, value, color = 'teal', delay = 0 }) {
  const barRef = useRef(null)
  const animated = useRef(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          if (prefersReduced) {
            barRef.current.style.width = `${value}%`
            return
          }
          gsap.to(barRef.current, {
            width: `${value}%`,
            duration: 1.5,
            delay: delay,
            ease: 'power4.out',
          })
        }
      },
      { threshold: 0.3 }
    )
    if (barRef.current) observer.observe(barRef.current)
    return () => observer.disconnect()
  }, [value, delay])

  const colorMap = {
    teal: 'from-teal to-teal-light',
    cyan: 'from-cyan-500 to-blue-500',
    rose: 'from-rose-500 to-pink-500',
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/60 text-xs">{label}</span>
        <span className="text-white/80 text-xs font-mono font-bold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          ref={barRef}
          className={`h-full rounded-full bg-gradient-to-r ${colorMap[color] || colorMap.teal} shadow-lg`}
          style={{ width: '0%' }}
        />
      </div>
    </div>
  )
}

// --- Animated ring/circle progress ---
function RingProgress({ value, size = 80, strokeWidth = 6, label, delay = 0 }) {
  const ref = useRef(null)
  const animated = useRef(false)
  const [displayVal, setDisplayVal] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayVal / 100) * circumference

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { setDisplayVal(value); return }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const duration = 1800
          const start = performance.now()
          const step = (now) => {
            const p = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setDisplayVal(Math.round(eased * value))
            if (p < 1) requestAnimationFrame(step)
          }
          setTimeout(() => requestAnimationFrame(step), delay)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, delay])

  return (
    <div ref={ref} className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-lg font-heading font-bold text-white">{displayVal}%</span>
      </div>
      {label && <p className="text-white/40 text-[10px] mt-2 text-center max-w-[80px]">{label}</p>}
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
    </div>
  )
}

// --- Before/After comparison card ---
function BeforeAfterComparison() {
  const ref = useRef(null)
  const [animDays, setAnimDays] = useState(0)
  const [animMins, setAnimMins] = useState(0)
  const animated = useRef(false)
  const { before, after } = chartData.beforeAfter

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const dur = 2000
          const start = performance.now()
          const step = (now) => {
            const p = Math.min((now - start) / dur, 1)
            const e = 1 - Math.pow(1 - p, 3)
            setAnimDays(Math.round(e * before.days))
            setAnimMins(Math.round(e * after.minutes))
            if (p < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [before.days, after.minutes])

  return (
    <div ref={ref} className="glow-card p-6 text-center">
      <h4 className="text-white font-heading font-semibold text-sm mb-6">Processing Time Comparison</h4>
      <div className="flex items-center justify-center gap-6 sm:gap-12">
        <div>
          <div className="text-3xl sm:text-4xl font-heading font-bold text-rose-400">{animDays}<span className="text-lg">d</span></div>
          <p className="text-white/40 text-xs mt-1">Traditional</p>
        </div>
        <div className="text-3xl text-white/20 font-light">→</div>
        <div>
          <div className="text-3xl sm:text-4xl font-heading font-bold text-teal-light">{animMins}<span className="text-lg">min</span></div>
          <p className="text-white/40 text-xs mt-1">Zintellect AI</p>
        </div>
      </div>
      <div className="mt-4 h-3 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-teal"
          style={{ width: `${Math.max(0, 100 - (animMins / (before.days * 24 * 60)) * 100)}%` }}
        />
      </div>
      <p className="text-white/30 text-[10px] mt-2">99.97% reduction in processing time</p>
    </div>
  )
}

// --- Processing metrics mini chart ---
function ProcessingMetrics() {
  const maxBefore = Math.max(...chartData.processingMetrics.map(m => m.before))
  const ref = useRef(null)
  const [animVals, setAnimVals] = useState(chartData.processingMetrics.map(() => 0))
  const animated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const dur = 2000
          const start = performance.now()
          const step = (now) => {
            const p = Math.min((now - start) / dur, 1)
            const e = 1 - Math.pow(1 - p, 3)
            setAnimVals(chartData.processingMetrics.map(m => ({
              before: Math.round(e * m.before),
              after: Math.round(e * m.after),
            })))
            if (p < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="glow-card p-6">
      <h4 className="text-white font-heading font-semibold text-sm mb-5">Processing Metrics Breakdown</h4>
      <div className="space-y-4">
        {chartData.processingMetrics.map((m, i) => {
          const val = animVals[i] || { before: 0, after: 0 }
          const beforePct = (m.before / maxBefore) * 100
          const afterPct = (m.after / m.before) * 100
          return (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/50 text-[11px]">{m.label}</span>
                <span className="text-white/60 text-[11px] font-mono">
                  {val.before} {m.unit} → {val.after} {m.unit}
                </span>
              </div>
              <div className="relative h-5 rounded bg-white/5 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-rose-500/40 transition-all duration-300"
                  style={{ width: `${val.before ? (val.before / m.before) * beforePct : 0}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-teal to-teal-light transition-all duration-300"
                  style={{ width: `${val.after ? (val.after / m.after) * afterPct : 0}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Benefits() {
  const sectionRef = useRef(null)
  const headerRef = useRef(null)

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
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="benefits"
      data-bg="#0B1120"
      ref={sectionRef}
      className="relative section-padding overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block rounded-full border border-teal/30 bg-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-teal-light mb-6">
            Outcomes
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-3">
            {benefitsContent.title}
          </h2>
          <p className="text-white/50 text-base">{benefitsContent.subtitle}</p>
        </div>

        {/* Before/After Comparison */}
        <div className="max-w-md mx-auto mb-12">
          <BeforeAfterComparison />
        </div>

        {/* 3 Category Cards */}
        <div className="grid gap-8 md:grid-cols-3 mb-12">
          {benefitsContent.categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="glow-card p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10 text-teal-light">
                  <Icon name={cat.icon} className="w-5 h-5" />
                </div>
                <h3 className="text-white font-heading font-semibold text-lg">{cat.title}</h3>
              </div>
              <AnimatedStat value={cat.stat.value} suffix={cat.stat.suffix} label={cat.stat.label} delay={i * 200} />
              <ul className="space-y-2">
                {cat.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-white/50 text-xs leading-relaxed">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Data visualization row */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Pillar effectiveness bars */}
          <div className="glow-card p-6">
            <h4 className="text-white font-heading font-semibold text-sm mb-5">Pillar Effectiveness Scores</h4>
            <div className="space-y-1">
              {chartData.pillarEffectiveness.map((p, i) => (
                <AnimatedBar key={p.label} label={p.label} value={p.value} delay={i * 0.08} />
              ))}
            </div>
          </div>

          {/* Processing metrics */}
          <ProcessingMetrics />
        </div>

        {/* Ring progress row */}
        <div className="grid grid-cols-4 gap-4 mt-8 max-w-lg mx-auto">
          {chartData.pillarEffectiveness.slice(0, 4).map((p, i) => (
            <div key={p.label} className="glow-card p-4 flex flex-col items-center relative">
              <RingProgress value={p.value} size={70} strokeWidth={5} label={p.label} delay={i * 150} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
