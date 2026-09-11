import { useEffect, useRef } from 'react'

export default function ParticleBackground({ id = 'particle-bg' }) {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const prefersReduced = useRef(false)
  const skipFrame = useRef(false)

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let stars = []
    let shootingStars = []
    let nebulaParticles = []
    let cachedGradients = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouse = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse)

    // --- Starfield (200 stars, fillRect instead of arc) ---
    const starCount = prefersReduced.current ? 60 : 200
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        baseX: 0, baseY: 0,
        layer: Math.floor(Math.random() * 3),
        glow: Math.random() > 0.85,
      })
    }
    stars.forEach((s) => { s.baseX = s.x; s.baseY = s.y })

    // --- Nebula clouds (pre-computed gradients) ---
    const nebulaCount = prefersReduced.current ? 2 : 5
    const nebulaColors = [
      [6, 182, 212, 0.02],
      [34, 211, 238, 0.015],
      [139, 92, 246, 0.01],
      [236, 72, 153, 0.008],
      [6, 182, 212, 0.012],
    ]
    for (let i = 0; i < nebulaCount; i++) {
      const c = nebulaColors[i % nebulaColors.length]
      nebulaParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 200 + 80,
        color: c,
        driftX: (Math.random() - 0.5) * 0.1,
        driftY: (Math.random() - 0.5) * 0.1,
      })
    }

    // --- Shooting stars (spawn periodically) ---
    let shootingStarTimer
    if (!prefersReduced.current) {
      const schedule = () => {
        shootingStars.push({
          x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          y: Math.random() * canvas.height * 0.3,
          len: Math.random() * 60 + 30,
          speed: Math.random() * 10 + 5,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
          alpha: 1,
          life: 0,
          maxLife: 35 + Math.random() * 25,
        })
        shootingStarTimer = setTimeout(schedule, 4000 + Math.random() * 6000)
      }
      shootingStarTimer = setTimeout(schedule, 3000)
    }

    // Frame skip counter — only render every other frame when not visible
    let frameCount = 0

    function animate() {
      frameCount++
      const isVisible = !document.hidden

      // Skip every other frame when tab is hidden or canvas offscreen
      skipFrame.current = !isVisible && frameCount % 3 !== 0

      if (!skipFrame.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Nebula — only redraw gradient when position changes significantly
        for (const neb of nebulaParticles) {
          neb.x += neb.driftX
          neb.y += neb.driftY
          if (neb.x < -neb.r) neb.x = canvas.width + neb.r
          if (neb.x > canvas.width + neb.r) neb.x = -neb.r
          if (neb.y < -neb.r) neb.y = canvas.height + neb.r
          if (neb.y > canvas.height + neb.r) neb.y = -neb.r

          const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.r)
          grad.addColorStop(0, `rgba(${neb.color[0]},${neb.color[1]},${neb.color[2]},${neb.color[3]})`)
          grad.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(neb.x, neb.y, neb.r, 0, Math.PI * 2)
          ctx.fill()
        }

        // Stars using fillRect (faster than arc)
        const mx = mouseRef.current.x
        const my = mouseRef.current.y
        const now = Date.now()

        for (const s of stars) {
          const pfx = (s.layer + 1) * 0.02
          const px = s.baseX + mx * pfx * 30
          const py = s.baseY + my * pfx * 30

          const twinkle = Math.sin(now * s.twinkleSpeed + s.twinklePhase) * 0.3 + 0.7
          const alpha = s.alpha * twinkle

          ctx.globalAlpha = alpha
          ctx.fillStyle = '#fff'
          ctx.fillRect(px - s.s / 2, py - s.s / 2, s.s, s.s)

          // Glow for larger stars (single fill per frame)
          if (s.glow) {
            ctx.globalAlpha = alpha * 0.12
            ctx.fillStyle = '#c8e6ff'
            ctx.fillRect(px - s.s * 1.5, py - s.s * 1.5, s.s * 3, s.s * 3)
          }
        }
        ctx.globalAlpha = 1

        // Shooting stars
        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const ss = shootingStars[i]
          ss.x += Math.cos(ss.angle) * ss.speed
          ss.y += Math.sin(ss.angle) * ss.speed
          ss.life++
          ss.alpha = 1 - ss.life / ss.maxLife

          if (ss.alpha <= 0 || ss.x > canvas.width + 80 || ss.y > canvas.height + 80) {
            shootingStars.splice(i, 1)
            continue
          }

          const ex = ss.x - Math.cos(ss.angle) * ss.len
          const ey = ss.y - Math.sin(ss.angle) * ss.len
          const grad = ctx.createLinearGradient(ss.x, ss.y, ex, ey)
          grad.addColorStop(0, `rgba(255,255,255,${ss.alpha})`)
          grad.addColorStop(1, 'rgba(34,211,238,0)')
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(ss.x, ss.y)
          ctx.lineTo(ex, ey)
          ctx.stroke()
        }
      }

      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      clearTimeout(shootingStarTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}
