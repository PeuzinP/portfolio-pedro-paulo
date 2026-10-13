import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { motion, useInView, useSpring, useTransform } from 'motion/react'
import { AVATAR_MOTION, usePixelMaterialization } from './avatar/usePixelMaterialization'
import './pixel-avatar.css'

export default function PixelAvatar() {
  const ref = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const image = useRef<HTMLImageElement>(null)
  const pointer = useRef({ x: .5, y: .5, inside: false })
  const inView = useInView(ref, { amount: .15 })
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [finePointer, setFinePointer] = useState(false)
  const [compact, setCompact] = useState(false)
  const [lowPower, setLowPower] = useState(false)
  const active = inView && pageVisible
  const interactive = finePointer && !reduced && active
  const x = useSpring(0, AVATAR_MOTION.spring)
  const y = useSpring(0, AVATAR_MOTION.spring)
  const rotateX = useTransform(y, [-1, 1], [AVATAR_MOTION.tilt, -AVATAR_MOTION.tilt])
  const rotateY = useTransform(x, [-1, 1], [-AVATAR_MOTION.tilt, AVATAR_MOTION.tilt])
  const offsetX = useTransform(x, value => value * AVATAR_MOTION.parallax)
  const offsetY = useTransform(y, value => value * AVATAR_MOTION.parallax)
  const gridX = useTransform(x, value => value * -AVATAR_MOTION.parallax * 2)
  const gridY = useTransform(y, value => value * -AVATAR_MOTION.parallax * 2)
  const phase = usePixelMaterialization({ canvas, image, pointer, loaded, active, reduced: !!reduced, compact, lowPower })

  useEffect(() => {
    const media = matchMedia('(hover: hover) and (pointer: fine)')
    const mobile = matchMedia('(max-width: 767px)')
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { setFinePointer(media.matches); setCompact(mobile.matches); setReduced(motionPreference.matches) }
    const visibility = () => setPageVisible(!document.hidden)
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    setLowPower((device.hardwareConcurrency || 8) <= 4 || (device.deviceMemory || 8) <= 4 || !!device.connection?.saveData)
    update()
    visibility()
    media.addEventListener('change', update)
    mobile.addEventListener('change', update)
    motionPreference.addEventListener('change', update)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      media.removeEventListener('change', update)
      mobile.removeEventListener('change', update)
      motionPreference.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  useEffect(() => {
    if (!interactive) {
      pointer.current.inside = false
      if (reduced) { x.jump(0); y.jump(0) } else { x.set(0); y.set(0) }
    }
  }, [interactive, reduced, x, y])

  function move(event: PointerEvent<HTMLElement>) {
    if (!interactive || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const px = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    const py = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
    pointer.current = { x: px, y: py, inside: true }
    x.set((px - .5) * 2)
    y.set((py - .5) * 2)
  }

  function leave() {
    pointer.current.inside = false
    x.set(0)
    y.set(0)
  }

  return <figure ref={ref} className="pixel-avatar" data-phase={phase} data-active={active} data-interactive={interactive} data-reduced={!!reduced} onPointerMove={move} onPointerLeave={leave}>
    <div className="pixel-avatar-overline mono" aria-hidden="true"><span><i /> IDENTIDADE DIGITAL</span><span>PP / 01</span></div>
    <div className="pixel-avatar-stage">
      <motion.div className="pixel-avatar-grid" aria-hidden="true" style={{ x: gridX, y: gridY }} />
      <div className="pixel-avatar-aura" aria-hidden="true" />
      <motion.div className="pixel-avatar-scene" style={{ rotateX, rotateY, x: offsetX, y: offsetY }}>
        <div className="pixel-avatar-art">
          <div className="pixel-avatar-original">
            <img ref={image} className="pixel-avatar-image" src="/pedro-pixel-avatar.png" width="1254" height="1254" alt="Pedro Paulo em pixel art, com detalhes em ciano" loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
            <div className="pixel-avatar-shoulders" aria-hidden="true"><img src="/pedro-pixel-avatar.png" width="1254" height="1254" alt="" /></div>
          </div>
          <canvas ref={canvas} className="pixel-avatar-canvas" aria-hidden="true" />
        </div>
        <div className="pixel-avatar-reticle reticle-tl" aria-hidden="true" /><div className="pixel-avatar-reticle reticle-tr" aria-hidden="true" />
        <div className="pixel-avatar-reticle reticle-bl" aria-hidden="true" /><div className="pixel-avatar-reticle reticle-br" aria-hidden="true" />
      </motion.div>
      <span className="pixel-avatar-axis axis-left" aria-hidden="true" /><span className="pixel-avatar-axis axis-right" aria-hidden="true" />
      {failed && <span className="pixel-avatar-fallback">Pedro Paulo</span>}
    </div>
    <figcaption className="pixel-avatar-terminal mono">
      <span className="pixel-avatar-status" aria-hidden="true" />
      <span className="pixel-avatar-prompt" aria-hidden="true">&gt;</span>
      <span className="pixel-avatar-terminal-copy"><span className="terminal-default">pedro.paulo <span>— online</span></span><span className="terminal-hover" aria-hidden="true">sistemas conectados ✓</span></span>
      <span className="pixel-avatar-cursor" aria-hidden="true">_</span>
    </figcaption>
  </figure>
}
