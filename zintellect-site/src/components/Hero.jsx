import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { Play, ChevronDown } from 'lucide-react'
import { heroContent } from '../data/content'
import { smoothScrollTo } from '../hooks/useLenis'
import VideoModal from './VideoModal'

export default function Hero() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const textRef = useRef(null)
  const canvasRef = useRef(null)
  const [modalOpen, setModalOpen] = useState(false)
  const prefersReduced = useRef(false)

  // Check reduced motion preference
  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Force video to autoplay
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const playVideo = () => {
      video.play().catch(() => {
        // Autoplay blocked — try again on user interaction
        const resume = () => { video.play(); document.removeEventListener('click', resume) }
        document.addEventListener('click', resume)
      })
    }
    if (video.readyState >= 2) {
      playVideo()
    } else {
      video.addEventListener('canplay', playVideo, { once: true })
    }
  }, [])

  // GSAP ScrollTrigger: video blur + scale scrub on scroll
  useEffect(() => {
    if (prefersReduced.current) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
        onUpdate: (self) => {
          const progress = self.progress
          if (videoRef.current) {
            gsap.set(videoRef.current, {
              scale: 1 - progress * 0.15,
              filter: `blur(${progress * 6}px)`,
              opacity: 1 - progress * 0.4,
            })
          }
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  // GSAP text stagger reveal
  useEffect(() => {
    const ctx = gsap.context(() => {
      const chars = textRef.current?.querySelectorAll('.char')
      if (chars?.length) {
        gsap.from(chars, {
          opacity: 0,
          y: 40,
          rotateX: -90,
          stagger: 0.03,
          duration: 1.2,
          ease: 'power4.out',
          delay: 0.5,
        })
      }
      // Tagline fade-up
      gsap.from('.hero-tagline', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 1.2,
        ease: 'power3.out',
      })
      gsap.from('.hero-desc', {
        opacity: 0,
        y: 20,
        duration: 1,
        delay: 1.5,
        ease: 'power3.out',
      })
      gsap.from('.hero-cta', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 1.8,
        ease: 'power3.out',
      })
      gsap.from('.scroll-indicator', {
        opacity: 0,
        y: -10,
        duration: 0.8,
        delay: 2.2,
        ease: 'power3.out',
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  // Canvas 2D particle system (lightweight fallback from Three.js)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []
    let mouse = { x: -1000, y: -1000 }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const NUM_PARTICLES = prefersReduced.current ? 40 : 120
    const CONNECTION_DIST = 120

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 1,
      })
    }

    const onMouse = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', onMouse)

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        // Mouse interaction: slight push
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 200) {
          p.vx += dx * 0.00005
          p.vy += dy * 0.00005
        }

        p.x += p.vx
        p.y += p.vy
        // Damping
        p.vx *= 0.99
        p.vy *= 0.99

        // Wrap around
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(34, 211, 238, 0.4)'
        ctx.fill()

        // Connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx2 = p.x - p2.x
          const dy2 = p.y - p2.y
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
          if (dist2 < CONNECTION_DIST) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.1 * (1 - dist2 / CONNECTION_DIST)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  const splitText = (text) => {
    return text.split('').map((char, i) => (
      <span
        key={i}
        className="char inline-block"
        style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))
  }

  return (
    <>
      <section
        id="hero"
        ref={sectionRef}
        className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden"
      >
        {/* Video background */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster="/assets/hero-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
        >
          <source src={heroContent.videoPlaceholder} type="video/mp4" />
        </video>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/50 to-navy" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/40 to-transparent" />

        {/* Canvas particle layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
          <h1
            ref={textRef}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight text-white mb-4"
          >
            {splitText(heroContent.headline)}
          </h1>
          <p className="hero-tagline text-lg sm:text-xl md:text-2xl text-teal-light font-medium mb-6">
            {heroContent.tagline}
          </p>
          <p className="hero-desc text-base sm:text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            {heroContent.description}
          </p>
          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="group flex items-center gap-3 rounded-full bg-teal px-8 py-3.5 text-sm font-semibold text-navy transition-all hover:bg-teal-light hover:shadow-lg hover:shadow-teal/25"
            >
              <Play className="w-4 h-4 fill-navy" />
              {heroContent.cta}
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/40 hover:text-white/70 transition-colors"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          onClick={() => smoothScrollTo('#problem')}
          aria-label="Scroll to next section"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.button>
      </section>

      <VideoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} videoSrc="/assets/explain.mp4" />
    </>
  )
}
