import { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenisInstance = null

export function getLenis() {
  return lenisInstance
}

export function smoothScrollTo(target, options = {}) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { duration: 0.6, easing: (t) => 1 - Math.pow(1 - t, 2), ...options })
  }
}

export default function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      smoothWheel: true,
      smoothTouch: true,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      infinite: false,
    })

    lenisInstance = lenis

    lenis.on('scroll', ScrollTrigger.update)

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: true })
        }
        return lenis.scroll
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
      },
      pinType: document.body.style.transform ? 'transform' : 'fixed',
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    const rafId = requestAnimationFrame(raf)

    ScrollTrigger.refresh()

    const handleResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisInstance = null
      window.removeEventListener('resize', handleResize)
    }
  }, [])
}
