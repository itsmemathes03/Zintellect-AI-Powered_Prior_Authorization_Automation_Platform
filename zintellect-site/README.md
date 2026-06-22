# Zintellect AI — Showcase Website

A cinematic, scroll-driven single-page React website showcasing **Zintellect AI**, the Intelligent Healthcare Prior Authorization Automation Platform built by **Cognitive Crew** from Velammal College of Engineering and Technology.

## Tech Stack

- **React 18** + **Vite 6**
- **Tailwind CSS** — utility-first styling
- **GSAP** + **ScrollTrigger** — scroll-linked animations (video blur/scale scrub, timeline line drawing, section reveals)
- **Framer Motion** — micro-interactions (hover/tap cards, 3D flip roadmap nodes, AnimatePresence layout transitions)
- **Lenis** — smooth-scroll engine synced to GSAP ScrollTrigger
- **Three.js** (lightweight canvas 2D fallback) — particle/network background in Hero/Solution sections
- **Lucide React** — icon system

## Sections

1. **Hero** — video background with space-like starfield particle overlay, typewriter headline, "Watch Demo" modal
2. **Intro Video** — full-viewport intro.mp4 auto-plays when scrolled into view (mute/play controls)
3. **Problem** — 5 pain-point cards with staggered slide-in reveal
4. **Solution** — HMH-RAGES description + 8 innovation pillar cards with hover-reveal
5. **Tech Stack** — 26 technologies in a filterable grid (7 categories)
6. **How It Works** — 9-step scroll-driven roadmap with SVG curved line drawing + 3D flip cards
7. **System Demo** — UI mockup frames with 3D tilt parallax + full.mp4 video walkthrough CTA
8. **Benefits / Impact** — 3 category stat cards + data visualizations (bar charts, ring progress, before/after comparison, processing metrics)
9. **Future Vision** — 3-track roadmap with tabbed detail view
10. **Team & CTA** — team member cards + GitHub / Demo buttons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build
npm run preview
```

## Adding Your Media

Place these video files in `public/assets/`:

| File | Purpose | Source |
|------|---------|--------|
| `hero-demo.mp4` | Hero background looping video | Your screen recording |
| `hero-poster.jpg` | Hero video poster frame | Screenshot of your app |
| `intro.mp4` | Auto-plays when user scrolls past hero | Short platform intro clip |
| `intro-poster.jpg` | Intro video poster frame | Screenshot |
| `full.mp4` | Plays in the "Watch Demo" modal | Full walkthrough recording |

Update media paths in `src/data/content.js` if you need to change filenames. The key fields are:
- `heroContent.videoPlaceholder`
- `introVideoContent.videoSrc`
- `demoContent.fullVideoSrc`
- `demoContent.videoPlaceholder` (Google Drive fallback)

## Performance Notes

- The starfield particle system uses **Canvas 2D** (350 stars, 8 nebula clouds, periodic shooting stars) with mouse parallax — all in a single `requestAnimationFrame` loop. No Three.js dependency.
- Stars have 3 depth layers with parallax factors, twinkle animation, and glow on larger stars.
- All data visualizations (animated bars, ring progress, before/after counters) use IntersectionObserver + requestAnimationFrame — zero layout thrashing.
- All animations respect `prefers-reduced-motion` and gracefully fall back to static reveals (star count reduces to 80, no shooting stars).
- Lenis smooth-scroll is synced to GSAP's ScrollTrigger via the scroller proxy pattern.
- Total JS bundle ~160kB gzipped (code-split GSAP + Framer).

## Lighthouse Target

- Performance: 85+
- Accessibility: 95+ (keyboard navigation, ARIA labels, focus management)
- Best Practices: 90+

## License

MIT — built for the Human–AI Collaboration Track.
