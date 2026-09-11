import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { futureContent } from '../data/content'
import { Icon } from './Icon'

export default function FutureVision() {
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const [activeTrack, setActiveTrack] = useState(0)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: headerRef.current,
        start: 'top 75%',
        onEnter: () => {
          gsap.from(headerRef.current, {
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: 'power3.out',
          })
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="future"
      data-bg="#0F172A"
      ref={sectionRef}
      className="relative section-padding overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-20" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block rounded-full border border-amber/30 bg-amber/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-amber mb-6">
            Roadmap
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-3">
            {futureContent.title}
          </h2>
          <p className="text-white/50 text-base">{futureContent.subtitle}</p>
        </div>

        {/* Track tabs (mobile-friendly pill selector) */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {futureContent.tracks.map((track, i) => (
            <button
              key={track.title}
              onClick={() => setActiveTrack(i)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                activeTrack === i
                  ? 'bg-amber text-navy shadow-lg shadow-amber/20'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <Icon name={track.icon} className="w-3.5 h-3.5" />
              {track.title}
            </button>
          ))}
        </div>

        {/* Active track detail */}
        <div className="max-w-3xl mx-auto">
          {futureContent.tracks.map((track, i) => (
            <motion.div
              key={track.title}
              initial={false}
              animate={{
                opacity: activeTrack === i ? 1 : 0,
                y: activeTrack === i ? 0 : 20,
                position: activeTrack === i ? 'relative' : 'absolute',
                pointerEvents: activeTrack === i ? 'auto' : 'none',
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="glow-card p-8"
              style={{ display: activeTrack === i ? 'block' : 'none' }}
              role="tabpanel"
              aria-label={track.title}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber/10 text-amber">
                  <Icon name={track.icon} className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-white">{track.title}</h3>
              </div>

              <div className="space-y-4">
                {track.items.map((item, idx) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber/30 text-amber text-xs font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed pt-0.5">{item}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
