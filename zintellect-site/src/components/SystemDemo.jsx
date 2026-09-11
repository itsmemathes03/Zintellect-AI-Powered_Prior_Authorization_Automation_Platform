import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { demoContent } from '../data/content'
import VideoModal from './VideoModal'

const tiltVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
}

export default function SystemDemo() {
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const mockupRef = useRef(null)

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

  // 3D tilt parallax on mouse move
  const handleMouseMove = (e) => {
    if (!mockupRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = mockupRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: -y * 10, y: x * 10 })
  }

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 })

  return (
    <section
      id="demo"
      data-bg="#10172A"
      ref={sectionRef}
      className="relative section-padding overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden="true" />

      <div className="section-container relative z-10">
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block rounded-full border border-teal/30 bg-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-teal-light mb-6">
            Demonstration
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4">
            {demoContent.title}
          </h2>
          <p className="text-white/50 text-base">{demoContent.description}</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Mockup frames with 3D tilt */}
          <div
            ref={mockupRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            <motion.div
              animate={{ rotateX: tilt.x, rotateY: tilt.y }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="grid gap-4 sm:grid-cols-3"
            >
              {demoContent.mockups.map((mock, i) => (
                <motion.div
                  key={mock.role}
                  custom={i}
                  variants={tiltVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.03, z: 20 }}
                  className="glow-card p-4 text-center"
                  tabIndex={0}
                >
                  {/* Browser chrome mockup */}
                  <div className="mb-3 rounded-lg overflow-hidden">
                    <div className={`h-2 flex items-center gap-1 px-2 bg-navy-dark`}>
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div
                      className={`h-28 bg-gradient-to-br ${mock.gradient} flex items-center justify-center`}
                    >
                      <span className="text-white/80 text-2xl font-heading font-bold opacity-40">
                        {mock.label}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-white font-heading font-semibold text-sm mb-1">
                    {mock.label}
                  </h4>
                  <p className="text-white/40 text-xs leading-relaxed">{mock.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Video embed / walkthrough */}
          <div className="text-center lg:text-left">
            <h3 className="text-2xl font-heading font-semibold text-white mb-4">
              Full Walkthrough
            </h3>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              Watch the complete Zintellect AI platform walkthrough — from patient registration to
              final authorization outcome.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="group inline-flex items-center gap-3 rounded-full bg-teal px-8 py-3.5 text-sm font-semibold text-navy transition-all hover:bg-teal-light hover:shadow-lg hover:shadow-teal/25"
            >
              <Play className="w-4 h-4 fill-navy" />
              Watch Full Demo
            </button>
          </div>
        </div>
      </div>

      <VideoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} videoSrc="/assets/explain.mp4" />
    </section>
  )
}
