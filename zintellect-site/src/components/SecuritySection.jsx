import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { securityContent } from '../data/content'
import { Icon } from './Icon'

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' },
  }),
}

export default function SecuritySection() {
  const sectionRef = useRef(null)
  const headerRef = useRef(null)

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

  return (
    <section
      id="security"
      data-bg="#0B1120"
      ref={sectionRef}
      className="relative section-padding overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-20" aria-hidden="true" />
      <div className="absolute inset-0 scanline opacity-20" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block rounded-full border border-cyan/30 bg-cyan/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-6">
            Security
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4">
            {securityContent.title}
          </h2>
          <p className="text-white/50 leading-relaxed text-base">
            {securityContent.description}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {securityContent.items.map((item, i) => (
            <motion.div
              key={item.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="glow-card group cursor-default p-5"
              tabIndex={0}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/10 text-cyan-300 transition-colors group-hover:bg-cyan/20">
                <Icon name={item.icon} className="w-5 h-5" />
              </div>
              <h3 className="text-white font-heading font-semibold text-sm mb-2">{item.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
