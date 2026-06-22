import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Speaker } from 'lucide-react'
import { introVideoContent } from '../data/content'

export default function IntroVideo() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const overlayRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const prefersReduced = useRef(false)

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Auto-play when scrolled into view — try with audio first
  useEffect(() => {
    const video = videoRef.current
    if (!video || prefersReduced.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed) {
          setHasPlayed(true)
          // Try to play with audio first
          video.muted = false
          setIsMuted(false)
          video.play()
            .then(() => {
              setIsPlaying(true)
              setAudioBlocked(false)
            })
            .catch(() => {
              // Autoplay with audio blocked — fall back to muted
              video.muted = true
              setIsMuted(true)
              setAudioBlocked(true)
              video.play()
                .then(() => setIsPlaying(true))
                .catch(() => {})
            })
        }
      },
      { threshold: 0.4 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [hasPlayed])

  // Progress tracking
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const update = () => {
      setProgress(video.currentTime / (video.duration || 1))
    }
    video.addEventListener('timeupdate', update)
    return () => video.removeEventListener('timeupdate', update)
  }, [])

  // GSAP overlay fade
  useEffect(() => {
    if (prefersReduced.current) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 60%',
        onEnter: () => {
          gsap.to(overlayRef.current, { opacity: 0.3, duration: 1.5, ease: 'power2.out' })
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const next = !isMuted
    videoRef.current.muted = next
    setIsMuted(next)
    if (!next) setAudioBlocked(false)
  }

  return (
    <section
      id="intro"
      data-bg="#060B14"
      ref={sectionRef}
      className="relative h-screen min-h-[500px] flex items-center justify-center overflow-hidden"
    >
      <video
        ref={videoRef}
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        poster="/assets/intro-poster.jpg"
      >
        <source src={introVideoContent.videoSrc} type="video/mp4" />
      </video>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/30 to-navy/60 z-10" />
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-navy z-10 opacity-70"
      />

      {/* Content */}
      <div className="relative z-20 text-center max-w-3xl mx-auto px-4">
        <motion.span
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block rounded-full border border-teal/30 bg-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-teal-light mb-6"
        >
          Platform Overview
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4"
        >
          {introVideoContent.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-base leading-relaxed mb-8"
        >
          {introVideoContent.description}
        </motion.p>
      </div>

      {/* Audio blocked indicator — more prominent */}
      {audioBlocked && isMuted && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={toggleMute}
          className="absolute top-6 right-6 z-30 flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 text-white/80 hover:bg-white/20 hover:text-white transition-all border border-white/10"
          aria-label="Unmute video"
        >
          <VolumeX className="w-4 h-4" />
          <span className="text-xs font-medium">Click for Audio</span>
        </motion.button>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
        <div
          className="h-full bg-gradient-to-r from-teal to-teal-light transition-all duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition-all border border-white/10"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          onClick={toggleMute}
          className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-all border ${
            isMuted
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-300 hover:bg-rose-500/30'
              : 'bg-white/15 border-white/10 text-white hover:bg-white/25'
          }`}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Muted label */}
        {isMuted && (
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
            Muted
          </span>
        )}
      </div>
    </section>
  )
}
