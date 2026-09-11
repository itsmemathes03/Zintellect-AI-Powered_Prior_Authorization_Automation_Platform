import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { solutionContent } from '../data/content'
import { Icon } from './Icon'

const pillarVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: 'easeOut',
    },
  }),
}

export default function Solution() {
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
      id="solution"
      data-bg="#10172A"
      ref={sectionRef}
      className="relative section-padding overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden="true" />
      <div className="absolute inset-0 scanline opacity-20" aria-hidden="true" />

      <div className="section-container relative z-10">
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block rounded-full border border-teal/30 bg-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-teal-light mb-6">
            HMH-RAGES
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-6">
            {solutionContent.title}
          </h2>
          <p className="text-white/50 leading-relaxed text-base">
            {solutionContent.description}
          </p>
        </div>

        {/* 8 Innovation Pillars Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {solutionContent.pillars.map((pillar, i) => (
            <motion.div
              key={pillar.id}
              custom={i}
              variants={pillarVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glow-card group cursor-default p-6"
              tabIndex={0}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal-light transition-colors group-hover:bg-teal/20">
                <Icon name={pillar.icon} className="w-6 h-6" />
              </div>
              <h3 className="text-white font-heading font-semibold text-lg mb-2">
                {pillar.title}
              </h3>
              {/* Description visible on hover, always visible on mobile via group-hover */}
              <div className="overflow-hidden">
                <p className="text-white/40 text-sm leading-relaxed transition-all duration-300 group-hover:text-white/70">
                  {pillar.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
