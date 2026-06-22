import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { siteConfig } from '../data/content'
import { smoothScrollTo } from '../hooks/useLenis'

const sectionIds = siteConfig.navSections.map(s => s.id)

export default function Nav() {
  const [active, setActive] = useState('hero')
  const [progress, setProgress] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dotsRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
      setScrolled(scrollTop > 80)

      // Determine active section
      let current = 'hero'
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= window.innerHeight * 0.3) {
            current = id
          }
        }
      }
      setActive(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id) => {
    smoothScrollTo(`#${id}`)
    setMenuOpen(false)
  }

  return (
    <>
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 z-[60] h-[3px] bg-gradient-to-r from-teal to-teal-light transition-all duration-150"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Page scroll progress"
      />

      {/* Nav bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-navy/90 backdrop-blur-lg shadow-lg shadow-black/10' : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => scrollTo('hero')}
            className="flex items-center gap-2 text-lg font-heading font-bold tracking-tight text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-navy text-sm font-bold">
              Z
            </span>
            <span className="hidden sm:inline">Zintellect</span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-1 md:flex">
            {sectionIds.slice(1).map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active === id
                    ? 'text-teal-light'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                {siteConfig.navSections.find(s => s.id === id)?.label}
              </button>
            ))}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="flex items-center gap-2 rounded-lg p-2 text-white/80 hover:text-white md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 z-40 bg-navy/95 backdrop-blur-xl md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex flex-col items-center gap-4 pt-12">
              {sectionIds.map((id) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`text-lg font-medium ${
                    active === id ? 'text-teal-light' : 'text-white/70'
                  }`}
                >
                  {siteConfig.navSections.find(s => s.id === id)?.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section nav dots (desktop) */}
      <nav
        ref={dotsRef}
        className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex"
        aria-label="Section navigation"
      >
        {sectionIds.map((id, i) => {
          const label = siteConfig.navSections.find(s => s.id === id)?.label || id
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="group relative flex items-center justify-center"
              aria-label={`Scroll to ${label} section`}
              aria-current={isActive ? 'true' : undefined}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? 'h-3 w-3 bg-teal shadow-lg shadow-teal/40'
                    : 'h-2 w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
              <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-navy-light/90 px-2 py-1 text-xs text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
