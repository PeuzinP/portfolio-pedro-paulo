import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

// Timings in milliseconds; movement limits in CSS pixels / degrees.
export const AVATAR_MOTION = {
  duration: 2200,
  tilt: 2.4,
  parallax: 3,
  spring: { stiffness: 95, damping: 23, mass: .8 },
  tiles: { desktop: 20, compact: 14, lowPower: 12 },
  particles: { desktop: 24, compact: 12, lowPower: 8 },
  idleFps: 30,
  lowPowerFps: 24,
  maxDpr: 2,
} as const

type Phase = 'waiting' | 'assembling' | 'ready'
type Options = {
  canvas: RefObject<HTMLCanvasElement | null>
  image: RefObject<HTMLImageElement | null>
  pointer: RefObject<{ x: number; y: number; inside: boolean }>
  loaded: boolean
  active: boolean
  reduced: boolean
  compact: boolean
  lowPower: boolean
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const random = (index: number) => {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}
const ease = (value: number) => 1 - Math.pow(1 - clamp(value), 3)

export function usePixelMaterialization({ canvas, image, pointer, loaded, active, reduced, compact, lowPower }: Options) {
  const [phase, setPhase] = useState<Phase>('waiting')
  const elapsed = useRef(0)
  const complete = useRef(false)

  useEffect(() => {
    const surface = canvas.current
    const source = image.current
    if (!surface || !source || !loaded) return
    if (reduced) {
      complete.current = true
      elapsed.current = AVATAR_MOTION.duration
      setPhase('ready')
      surface.getContext('2d')?.clearRect(0, 0, surface.width, surface.height)
      return
    }
    if (!active) return
    const ctx = surface.getContext('2d', { alpha: true })
    if (!ctx) { complete.current = true; setPhase('ready'); return }
    if (!complete.current) setPhase('assembling')

    const count = lowPower ? AVATAR_MOTION.tiles.lowPower : compact ? AVATAR_MOTION.tiles.compact : AVATAR_MOTION.tiles.desktop
    const particleCount = lowPower ? AVATAR_MOTION.particles.lowPower : compact ? AVATAR_MOTION.particles.compact : AVATAR_MOTION.particles.desktop
    const fragments = Array.from({ length: count * count }, (_, index) => ({
      column: index % count, row: Math.floor(index / count),
      delay: .1 + random(index + 3) * .4 + (Math.floor(index / count) / count) * .16,
      duration: .28 + random(index + 17) * .13,
      dx: (random(index + 31) - .5) * .55,
      dy: (random(index + 61) - .5) * .5,
    }))
    const particles = Array.from({ length: particleCount }, (_, index) => ({
      x: random(index + 411), y: random(index + 517), phase: random(index + 619) * Math.PI * 2,
      size: index % 5 === 0 ? 3 : 2,
    }))
    let size = 1
    let dpr = 1
    let frame = 0
    let previous = 0
    let lastDraw = 0
    let stopped = false
    const cursor = { x: .5, y: .5, strength: 0 }

    function resize() {
      if (!surface || !ctx) return
      // Layout width is stable while Motion rotates the composited scene.
      size = Math.max(1, surface.clientWidth)
      dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : AVATAR_MOTION.maxDpr)
      surface.width = Math.round(size * dpr)
      surface.height = Math.round(size * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = false
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(surface)

    function render(timestamp: number) {
      if (stopped || !ctx || !source || !surface) return
      if (!previous) previous = timestamp
      const interval = complete.current ? 1000 / (lowPower ? AVATAR_MOTION.lowPowerFps : AVATAR_MOTION.idleFps) : lowPower ? 1000 / 30 : 0
      if (timestamp - lastDraw < interval) { frame = requestAnimationFrame(render); return }
      // Time only advances while visible: no catch-up after tab/viewport pauses.
      const delta = Math.min(timestamp - previous, 70)
      elapsed.current += delta
      previous = timestamp
      lastDraw = timestamp
      const time = elapsed.current
      const progress = clamp(time / AVATAR_MOTION.duration)
      ctx.clearRect(0, 0, size, size)

      if (!complete.current) {
        for (const tile of fragments) {
          const local = clamp((progress - tile.delay) / tile.duration)
          if (local === 0) continue
          const settled = ease(local)
          const sx = Math.floor(tile.column * source.naturalWidth / count)
          const sy = Math.floor(tile.row * source.naturalHeight / count)
          const sw = Math.floor((tile.column + 1) * source.naturalWidth / count) - sx
          const sh = Math.floor((tile.row + 1) * source.naturalHeight / count) - sy
          const tx = tile.column * size / count
          const ty = tile.row * size / count
          const dx = Math.round((tx + tile.dx * size * (1 - settled)) * dpr) / dpr
          const dy = Math.round((ty + tile.dy * size * (1 - settled)) * dpr) / dpr
          ctx.globalAlpha = clamp(local * 5)
          ctx.drawImage(source, sx, sy, sw, sh, dx, dy, size / count + .3, size / count + .3)
          if (local < .32) {
            ctx.globalAlpha = (.32 - local) * .55
            ctx.fillStyle = '#65d9d8'
            ctx.fillRect(dx, dy, size / count, size / count)
          }
        }
        // Resolve tile seams to the exact original before the DOM handoff.
        if (progress > .86) {
          ctx.globalAlpha = ease((progress - .86) / .12)
          ctx.drawImage(source, 0, 0, size, size)
        }
        if (progress > .12 && progress < .97) {
          const scanY = size * clamp((progress - .12) / .85)
          const glow = ctx.createLinearGradient(0, scanY - 22, 0, scanY + 2)
          glow.addColorStop(0, 'rgba(101,217,216,0)')
          glow.addColorStop(1, 'rgba(101,217,216,.13)')
          ctx.globalAlpha = Math.sin(clamp((progress - .12) / .85) * Math.PI)
          ctx.fillStyle = glow
          ctx.fillRect(0, scanY - 22, size, 23)
          ctx.fillStyle = '#65d9d8'
          ctx.fillRect(size * .04, Math.round(scanY), size * .92, 1)
        }
        if (progress === 1) {
          complete.current = true
          setPhase('ready')
          // Retain the final canvas portrait until React commits the DOM image.
        }
      }

      // Sparse pixels stay near the perimeter, leaving the face unobstructed.
      const follow = 1 - Math.exp(-delta / 120)
      cursor.x += (pointer.current.x - cursor.x) * follow
      cursor.y += (pointer.current.y - cursor.y) * follow
      cursor.strength += ((pointer.current.inside ? 1 : 0) - cursor.strength) * follow
      for (const particle of particles) {
        let px = particle.x < .5 ? particle.x * .3 : .85 + (particle.x - .5) * .3
        let py = (particle.y + time * .000008) % 1
        px += Math.sin(time * .0003 + particle.phase) * .012
        if (cursor.strength > .001) {
          const dx = px - cursor.x
          const dy = py - cursor.y
          const distance = Math.hypot(dx, dy)
          const force = Math.max(0, 1 - distance / .3) * .025 * cursor.strength
          px += dx / Math.max(distance, .01) * force
          py += dy / Math.max(distance, .01) * force
        }
        ctx.globalAlpha = (.2 + (Math.sin(time * .001 + particle.phase) + 1) * .16) * clamp(time / 250)
        ctx.fillStyle = '#65d9d8'
        ctx.fillRect(Math.round(px * size), Math.round(py * size), particle.size, particle.size)
      }
      ctx.globalAlpha = 1
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => { stopped = true; cancelAnimationFrame(frame); observer.disconnect() }
  }, [canvas, image, pointer, loaded, active, reduced, compact, lowPower])

  return phase
}
