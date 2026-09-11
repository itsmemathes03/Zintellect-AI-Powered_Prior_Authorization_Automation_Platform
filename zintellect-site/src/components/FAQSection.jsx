import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, AnimatePresence } from 'framer-motion'
import { faqContent } from '../data/content'
import { Icon } from './Icon'

export default function FAQSection() {
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const [openIndex, setOpenIndex] = useState(null)

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

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i)

  return (
    <section
      id="faq"
      data-bg="#0F172A"
      ref={sectionRef}
      className="relative section-padding overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-20" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block rounded-full border border-teal/30 bg-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-teal-light mb-5">
            Support
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-3">
            {faqContent.title}
          </h2>
          <p className="text-white/50 text-base">{faqContent.subtitle}</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqContent.items.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.06 }}
                className={`glow-card overflow-hidden transition-all duration-300 ${
                  isOpen ? 'border-teal/20 ring-1 ring-teal/5' : 'border-white/5'
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                  aria-expanded={isOpen}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isOpen ? 'bg-teal/15 text-teal-light' : 'bg-white/[0.04] text-white/30'
                  }`}>
                    <Icon name="HelpCircle" className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-heading font-semibold text-sm group-hover:text-teal-light transition-colors">
                      {item.q}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`shrink-0 ${isOpen ? 'text-teal-light' : 'text-white/20'}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 5l3 3 3-3" />
                    </svg>
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0 border-t border-white/[0.06]">
                        <p className="text-white/50 text-sm leading-relaxed mt-3">{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
