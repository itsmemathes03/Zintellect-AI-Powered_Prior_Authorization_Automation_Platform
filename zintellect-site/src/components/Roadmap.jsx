import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, AnimatePresence } from 'framer-motion'
import { roadmapContent } from '../data/content'
import { Icon } from './Icon'

export default function Roadmap() {
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const containerRef = useRef(null)
  const mainPathRef = useRef(null)
  const glowPathRef = useRef(null)
  const circlesRef = useRef([])
  const nodesRef = useRef([])
  const [expanded, setExpanded] = useState({})
  const [isMobile, setIsMobile] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const activeRef = useRef(-1)
  const stRef = useRef(null)
  const rafPending = useRef(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Scroll-driven SVG path + particle effect
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { setActiveStep(roadmapContent.steps.length - 1); return }

    const ctx = gsap.context(() => {
      const refreshPath = () => {
        if (!mainPathRef.current || !containerRef.current) return
        const circles = circlesRef.current.filter(Boolean)
        if (circles.length < 2) return

        const cr = containerRef.current.getBoundingClientRect()
        const pts = circles.map((c) => {
          const r = c.getBoundingClientRect()
          return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top }
        })

        let d = `M ${pts[0].x} ${pts[0].y}`
        for (let i = 1; i < pts.length; i++) {
          const p = pts[i - 1], c = pts[i], cy = (p.y + c.y) / 2
          d += ` C ${p.x} ${cy}, ${c.x} ${cy}, ${c.x} ${c.y}`
        }
        mainPathRef.current.setAttribute('d', d)
        glowPathRef.current?.setAttribute('d', d)
        const len = mainPathRef.current.getTotalLength()
        gsap.set(mainPathRef.current, { strokeDasharray: len, strokeDashoffset: len })
        if (stRef.current) stRef.current.kill()

        const thresh = pts.map((p) => (p.y - pts[0].y) / (pts[pts.length - 1].y - pts[0].y))

        stRef.current = ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
          onUpdate: (self) => {
            const p = self.progress, draw = len * p
            mainPathRef.current.style.strokeDashoffset = len - draw
            const idx = thresh.findIndex((t) => t > p)
            const next = idx >= 0 ? idx : pts.length - 1
            if (next !== activeRef.current) {
              activeRef.current = next
              if (!rafPending.current) {
                rafPending.current = true
                requestAnimationFrame(() => { setActiveStep(activeRef.current); rafPending.current = false })
              }
            }
          },
        })
        ScrollTrigger.refresh()
      }

      const timer = setTimeout(() => refreshPath(), 120)
      let ro
      if (containerRef.current) {
        ro = new ResizeObserver(() => refreshPath())
        ro.observe(containerRef.current)
      }
      window.addEventListener('resize', refreshPath)

      ScrollTrigger.create({
        trigger: headerRef.current, start: 'top 75%',
        onEnter: () => gsap.to(headerRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }),
      })
      nodesRef.current.forEach((node, i) => {
        if (!node) return
        ScrollTrigger.create({
          trigger: node, start: 'top 80%',
          onEnter: () => gsap.to(node, { opacity: 1, x: 0, duration: 0.7, delay: i * 0.08, ease: 'power3.out' }),
        })
      })

      return () => { clearTimeout(timer); window.removeEventListener('resize', refreshPath); if (ro) ro.disconnect() }
    }, sectionRef)
    return () => ctx.revert()
  }, [isMobile])

  const toggleExpand = useCallback((step) => {
    setExpanded((p) => ({ ...p, [step]: !p[step] }))
  }, [])

  const statusFor = (i) => {
    if (i < activeStep) return { label: 'Complete', cls: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' }
    if (i === activeStep) return { label: 'In Progress', cls: 'text-teal-light border-teal/30 bg-teal/10 animate-pulse-slow' }
    return { label: 'Upcoming', cls: 'text-white/30 border-white/10 bg-white/[0.04]' }
  }

  return (
    <section id="roadmap" data-bg="#0F172A" ref={sectionRef} className="relative section-padding overflow-hidden pb-40">
      <div className="absolute inset-0 grid-bg opacity-20" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-14 opacity-0 translate-y-10">
          <span className="inline-block rounded-full border border-teal/30 bg-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-teal-light mb-5">
            Pipeline
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-3">{roadmapContent.title}</h2>
          <p className="text-white/50 text-base">{roadmapContent.subtitle}</p>
        </div>

        <div ref={containerRef} className="relative max-w-4xl mx-auto">
          {/* SVG timeline path */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" aria-hidden="true" style={{ overflow: 'visible' }}>
            <path ref={glowPathRef} fill="none" stroke="#22D3EE" strokeWidth="14" strokeLinecap="round" opacity="0.08" style={{ filter: 'blur(10px)' }} />
            <path ref={mainPathRef} fill="none" stroke="url('#roadGrad')" strokeWidth="3.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0891B2" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>

          {/* Steps */}
          <div className="relative z-10 space-y-12 md:space-y-16">
            {roadmapContent.steps.map((step, i) => {
              const isLeft = i % 2 === 0
              const isActive = i === activeStep
              const isComplete = i < activeStep
              const status = statusFor(i)

              return (
                <div key={step.step} className={`relative flex items-start gap-5 md:gap-0 ${
                  isMobile ? 'flex-row' : isLeft ? 'md:flex-row md:justify-start' : 'md:flex-row-reverse md:justify-start'
                }`}>
                  {/* Timeline node */}
                  <div
                    ref={(el) => (circlesRef.current[i] = el)}
                    className={`relative z-10 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 font-heading font-bold text-base transition-all duration-700 ${
                      isComplete ? 'border-teal bg-teal text-navy shadow-lg shadow-teal/20' :
                      isActive ? 'border-teal bg-teal text-navy shadow-xl shadow-teal/30 scale-110' :
                      'border-white/15 bg-navy-dark text-white/30'
                    } md:absolute md:left-1/2 md:-translate-x-1/2`}
                    aria-hidden="true"
                  >
                    {step.step}
                    {/* Pulsing ring for active */}
                    {isActive && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-teal/30 opacity-75" />
                    )}
                  </div>

                  {/* Card */}
                  <div ref={(el) => (nodesRef.current[i] = el)} className={`w-full opacity-0 md:w-[calc(50%-44px)] ${
                    isMobile ? '' : isLeft ? 'md:pr-0' : 'md:pl-0'
                  }`} style={{ transform: isMobile ? 'translateX(0)' : isLeft ? 'translateX(-30px)' : 'translateX(30px)' }}>
                    <motion.div
                      layout
                      className={`glow-card overflow-hidden transition-all duration-500 ${
                        isActive ? 'border-teal/30 ring-1 ring-teal/10' : 'border-white/5'
                      }`}
                    >
                      {/* Header row — always visible */}
                      <button
                        onClick={() => toggleExpand(step.step)}
                        className="w-full flex items-start gap-3 p-5 text-left cursor-pointer group"
                        aria-expanded={expanded[step.step]}
                        aria-label={`Step ${step.step}: ${step.title}`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isComplete || isActive ? 'bg-teal/15 text-teal-light' : 'bg-white/[0.04] text-white/30'
                        }`}>
                          <Icon name={step.icon} className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-[11px] font-mono text-white/30 font-medium">Step {step.step}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${status.cls}`}>
                              {status.label}
                            </span>
                            <span className="text-[10px] text-white/20 font-mono ml-auto">{step.duration}</span>
                          </div>
                          <h3 className="text-white font-heading font-semibold text-base group-hover:text-teal-light transition-colors">
                            {step.title}
                          </h3>
                          {/* Brief excerpt when collapsed */}
                          {!expanded[step.step] && (
                            <p className="text-white/40 text-xs mt-1.5 leading-relaxed line-clamp-1">
                              {step.highlights.slice(0, 2).join(' · ')}
                            </p>
                          )}
                        </div>
                        <motion.div
                          animate={{ rotate: expanded[step.step] ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className={`shrink-0 mt-1.5 ${isComplete || isActive ? 'text-teal-light' : 'text-white/20'}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M4 5l3 3 3-3" />
                          </svg>
                        </motion.div>
                      </button>

                      {/* Expanded detail panel */}
                      <AnimatePresence initial={false}>
                        {expanded[step.step] && (
                          <motion.div
                            key="detail"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-0 border-t border-white/[0.06]">
                              <p className="text-white/60 text-sm leading-relaxed mt-3 mb-4">
                                {step.description}
                              </p>
                              {/* Highlights as pills */}
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {step.highlights.map((h) => (
                                  <span key={h} className="text-[11px] text-teal-light/70 bg-teal/8 px-2 py-1 rounded-md border border-teal/10">
                                    {h}
                                  </span>
                                ))}
                              </div>
                              {/* Detail footer */}
                              <div className="flex items-center gap-3 text-[11px] text-white/25">
                                <span className="flex items-center gap-1">
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="6" cy="6" r="5" /><path d="M6 3v3l2 2" />
                                  </svg>
                                  Est. {step.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M1 6l3-3 3 3M4 3v8" />
                                  </svg>
                                  Step {step.step} of {roadmapContent.steps.length}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
