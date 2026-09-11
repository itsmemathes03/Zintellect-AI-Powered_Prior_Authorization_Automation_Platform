import { useEffect, useRef } from "react"

export default function ParticleBackground({ r = 59, g = 130, b = 246, opacity = 0.5 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let animationId
    let particles = []
    const mouse = { x: null, y: null, radius: 180 }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2.5 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.4
        this.speedY = (Math.random() - 0.5) * 0.4
        this.opacity = Math.random() * 0.4 + 0.1
      }
      update() {
        this.x += this.speedX
        this.y += this.speedY
        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
        if (mouse.x !== null) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius
            this.x -= dx * force * 0.02
            this.y -= dy * force * 0.02
          }
        }
      }
      draw() {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const init = () => {
      particles = []
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100)
      for (let i = 0; i < count; i++) particles.push(new Particle())
    }
    init()

    const connect = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 160) {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.08 * (1 - dist / 160)})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => { p.update(); p.draw() })
      connect()
      animationId = requestAnimationFrame(animate)
    }
    animate()

    const handleMouse = (e) => { mouse.x = e.clientX; mouse.y = e.clientY }
    const handleLeave = () => { mouse.x = null; mouse.y = null }
    window.addEventListener("mousemove", handleMouse)
    window.addEventListener("mouseleave", handleLeave)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouse)
      window.removeEventListener("mouseleave", handleLeave)
    }
  }, [r, g, b])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity, zIndex: 0 }}
    />
  )
}
