import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { ArrowRight, Github } from 'lucide-react'
import { teamContent } from '../data/content'

export default function TeamCTA() {
  const sectionRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: contentRef.current,
        start: 'top 75%',
        onEnter: () => {
          gsap.from(contentRef.current, {
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
      id="team"
      data-bg="#0B1120"
      ref={sectionRef}
      className="relative section-padding overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-20" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-teal/5 to-transparent" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div ref={contentRef} className="max-w-3xl mx-auto text-center">
          {/* Team identifier */}
          <span className="inline-block rounded-full border border-teal/30 bg-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-teal-light mb-6">
            {teamContent.track}
          </span>

          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4">
            {teamContent.title}
          </h2>

          <p className="text-white/50 text-base mb-8">{teamContent.college}</p>

          {/* Team members */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {teamContent.members.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glow-card px-6 py-4 text-center min-w-[160px]"
              >
                {/* Avatar placeholder */}
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal to-cyan-600 text-navy font-heading font-bold text-lg">
                  {member.name.charAt(0)}
                </div>
                <h4 className="text-white font-heading font-semibold text-sm">{member.name}</h4>
                <p className="text-white/40 text-xs">{member.role}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {teamContent.ctaButtons.map((btn) => (
              <a
                key={btn.label}
                href={btn.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition-all ${
                  btn.primary
                    ? 'bg-teal text-navy hover:bg-teal-light hover:shadow-lg hover:shadow-teal/25'
                    : 'border border-white/20 text-white/80 hover:border-white/40 hover:text-white'
                }`}
              >
                {btn.label === 'View on GitHub' && <Github className="w-4 h-4" />}
                {btn.label === 'Request a Demo' && <ArrowRight className="w-4 h-4" />}
                {btn.label}
              </a>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-white/5">
            <p className="text-white/30 text-xs">
              &copy; {new Date().getFullYear()} Cognitive Crew &mdash; Velammal College of Engineering
              and Technology. Built for the Human &ndash; AI Collaboration Track.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
