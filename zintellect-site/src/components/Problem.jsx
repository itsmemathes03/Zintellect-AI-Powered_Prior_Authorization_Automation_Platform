import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { problemContent } from '../data/content'
import { Icon } from './Icon'

const cardVariants = {
  hidden: { opacity: 0, x: -60, rotateY: 8 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export default function Problem() {
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const prefersReduced = useRef(false)

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (prefersReduced.current) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 70%',
        onEnter: () => {
          gsap.to(headerRef.current, {
            opacity: 1,
            x: 0,
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
      id="problem"
      data-bg="#0B1120"
      ref={sectionRef}
      className="relative section-padding overflow-hidden"
    >
      {/* Grid BG */}
      <div className="absolute inset-0 grid-bg opacity-40" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left column: heading */}
          <div ref={headerRef} className="opacity-0 lg:sticky lg:top-32 lg:self-start">
            <span className="inline-block rounded-full border border-coral/30 bg-coral/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-coral mb-6">
              The Challenge
            </span>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-6">
              {problemContent.title}
            </h2>
            <p className="text-white/50 leading-relaxed text-base">
              In insurance-based healthcare systems, patients face critical administrative barriers
              before accessing specialist treatments, medications, and procedures. Prior authorization
              is heavily dependent on manual paperwork, scanned document processing, repetitive data
              entry, and complex policy verification between doctors and insurers.
            </p>
            <div className="mt-8 border-l-2 border-teal/40 pl-5">
              <p className="text-sm text-white/60 leading-relaxed italic">
                &ldquo;{problemContent.closingLine}&rdquo;
              </p>
            </div>
          </div>

          {/* Right column: pain point cards */}
          <div className="space-y-4">
            {problemContent.painPoints.map((point, i) => (
              <motion.div
                key={point.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="glow-card group cursor-default p-5"
                tabIndex={0}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-coral/10 text-coral">
                    <Icon name={point.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-heading font-semibold text-base mb-1">
                      {point.title}
                    </h3>
                    <p className="text-white/40 text-sm leading-relaxed">{point.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
