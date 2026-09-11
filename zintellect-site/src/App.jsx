import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import useLenis from './hooks/useLenis'
import Nav from './components/Nav'
import ParticleBackground from './components/ParticleBackground'
import Hero from './components/Hero'
import IntroVideo from './components/IntroVideo'
import Problem from './components/Problem'
import StatsMarquee from './components/StatsMarquee'
import Solution from './components/Solution'
import SecuritySection from './components/SecuritySection'
import TechStack from './components/TechStack'
import ArchitectureFlow from './components/ArchitectureFlow'
import Roadmap from './components/Roadmap'
import SystemDemo from './components/SystemDemo'
import Benefits from './components/Benefits'
import FutureVision from './components/FutureVision'
import FAQSection from './components/FAQSection'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const mainRef = useRef(null)
  useLenis()

  useEffect(() => {
    const sections = document.querySelectorAll('[data-bg]')
    sections.forEach((section) => {
      const bg = section.dataset.bg
      gsap.set(section, { backgroundColor: bg })
    })
  }, [])

  return (
    <div ref={mainRef} className="relative">
      <ParticleBackground />
      <div className="relative z-10">
        <Nav />
        <main>
          <Hero />
          <IntroVideo />
          <Problem />
          <StatsMarquee />
          <Solution />
          <SecuritySection />
          <TechStack />
          <ArchitectureFlow />
          <Roadmap />
          <SystemDemo />
          <Benefits />
          <FutureVision />
          <FAQSection />
        </main>
      </div>
    </div>
  )
}
