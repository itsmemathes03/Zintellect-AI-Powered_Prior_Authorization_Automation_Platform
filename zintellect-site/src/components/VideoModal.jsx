import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause } from 'lucide-react'
import { demoContent } from '../data/content'

export default function VideoModal({ isOpen, onClose, videoSrc }) {
  const modalRef = useRef(null)
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      modalRef.current?.focus()
      const handleKey = (e) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleKey)
      // Auto-play when modal opens
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
        }
      }, 300)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKey)
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
        }
      }
    } else {
      document.body.style.overflow = ''
      setIsPlaying(false)
    }
  }, [isOpen, onClose])

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Full demo video player"
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              controls
              playsInline
              preload="auto"
            >
              <source src={videoSrc || demoContent.fullVideoSrc} type="video/mp4" />
            </video>

            {/* Custom play button overlay when paused */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 group cursor-pointer"
                aria-label="Play video"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/90 group-hover:bg-teal transition-all group-hover:scale-110 shadow-lg shadow-teal/30">
                  <Play className="w-7 h-7 ml-1 text-navy fill-navy" />
                </div>
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
              aria-label="Close video modal"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
