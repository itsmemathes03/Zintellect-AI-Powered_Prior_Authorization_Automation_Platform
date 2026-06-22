import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, AnimatePresence } from 'framer-motion'
import { architectureContent } from '../data/content'
import { Icon } from './Icon'

export default function ArchitectureFlow() {
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const nodeRefs = useRef([])
  const flowDotRef = useRef(null)
  const [activeNode, setActiveNode] = useState(null)
  const [paths, setPaths] = useState({ main: '', glow: '' })
  const [nodePositions, setNodePositions] = useState([])
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 })

  const calculatePositions = useCallback(() => {
    if (!containerRef.current) return
    const cr = containerRef.current.getBoundingClientRect()
    const pos = nodeRefs.current.filter(Boolean).map((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top }
    })
    setNodePositions(pos)
    setDimensions({ w: cr.width, h: cr.height })
  }, [])

  useEffect(() => {
    calculatePositions()
    window.addEventListener('resize', calculatePositions)
    const ro = new ResizeObserver(() => calculatePositions())
    if (containerRef.current) ro.observe(containerRef.current)
    return () => {
      window.removeEventListener('resize', calculatePositions)
      ro.disconnect()
    }
  }, [calculatePositions])

  useEffect(() => {
    if (nodePositions.length < 2) return
    let d = '', dGlow = ''
    for (let i = 1; i < nodePositions.length; i++) {
      const prev = nodePositions[i - 1], cur = nodePositions[i]
      const cx = (prev.x + cur.x) / 2
      const seg = `C ${cx} ${prev.y}, ${cx} ${cur.y}, ${cur.x} ${cur.y}`
      d += (i === 1 ? `M ${prev.x} ${prev.y} ` : '') + seg + ' '
      dGlow += (i === 1 ? `M ${prev.x} ${prev.y} ` : '') + seg + ' '
    }
    setPaths({ main: d.trim(), glow: dGlow.trim() })
  }, [nodePositions])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: headerRef.current, start: 'top 75%',
        onEnter: () => {
          gsap.from(headerRef.current, { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out' })
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!paths.main || !flowDotRef.current) return
    const path = flowDotRef.current
    const len = path.getTotalLength?.() || 0
    if (!len) return
    gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
      strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', scrollTrigger: {
        trigger: containerRef.current, start: 'top 75%', toggleActions: 'play none none reverse',
      },
    })
  }, [paths])

  const activeData = activeNode != null ? architectureContent.nodes[activeNode] : null

  return (
    <section
      id="architecture"
      data-bg="#0F172A"
      ref={sectionRef}
      className="relative section-padding overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-20" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block rounded-full border border-teal/30 bg-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-teal-light mb-6">
            Architecture
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4">
            {architectureContent.title}
          </h2>
          <p className="text-white/50 leading-relaxed text-base">
            {architectureContent.description}
          </p>
        </div>

        <div ref={containerRef} className="relative max-w-5xl mx-auto">
          {/* SVG Connection layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ overflow: 'visible' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="archGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0891B2" stopOpacity="0.6" />
              </linearGradient>
              <filter id="archGlow">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {paths.glow && (
              <path d={paths.glow} fill="none" stroke="#22D3EE" strokeWidth="12" strokeLinecap="round" opacity="0.08" style={{ filter: 'blur(8px)' }} />
            )}
            {paths.main && (
              <path
                ref={flowDotRef}
                d={paths.main}
                fill="none"
                stroke="url(#archGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8 6"
              />
            )}
            {/* Animated flow dots */}
            {paths.main && nodePositions.length >= 2 && (
              <>
                {nodePositions.slice(0, -1).map((from, i) => {
                  const to = nodePositions[i + 1]
                  return (
                    <circle key={i} r="4" fill="#22D3EE" filter="url(#archGlow)">
                      <animateMotion
                        dur="2.5s"
                        repeatCount="indefinite"
                        path={`M ${from.x} ${from.y} C ${(from.x+to.x)/2} ${from.y}, ${(from.x+to.x)/2} ${to.y}, ${to.x} ${to.y}`}
                      />
                    </circle>
                  )
                })}
              </>
            )}
          </svg>

          {/* Nodes grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
            {architectureContent.nodes.map((node, i) => (
              <motion.button
                key={node.id}
                ref={(el) => (nodeRefs.current[i] = el)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveNode(activeNode === i ? null : i)}
                onMouseEnter={() => setActiveNode(i)}
                onFocus={() => setActiveNode(i)}
                onMouseLeave={() => setActiveNode(null)}
                onBlur={() => setActiveNode(null)}
                className={`glow-card p-4 text-center transition-all duration-300 cursor-pointer ${
                  activeNode === i ? `${node.border} scale-105 shadow-lg` : 'border-white/5'
                }`}
                tabIndex={0}
                aria-label={`${node.title}: ${node.desc}`}
              >
                <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  activeNode === i ? node.gradient : 'bg-white/[0.04]'
                }`}>
                  <Icon name={node.icon} className={`w-5 h-5 ${node.textColor}`} />
                </div>
                <span className={`text-[11px] font-semibold tracking-wide ${node.textColor}`}>
                  {node.label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Active node detail panel */}
          <AnimatePresence>
            {activeData && (
              <motion.div
                key={activeData.id}
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden mt-4"
              >
                <div className={`glow-card p-5 ${activeData.border}`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${activeData.gradient}`}>
                      <Icon name={activeData.icon} className={`w-6 h-6 ${activeData.textColor}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-heading font-semibold text-base mb-1">{activeData.title}</h4>
                      <p className="text-white/50 text-sm leading-relaxed">{activeData.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
