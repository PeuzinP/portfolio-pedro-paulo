import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Hand, X } from 'lucide-react'
import { useVisits } from '../hooks/useVisits'
import { useMotionPreference } from '../hooks/useMotionPreference'
import { claimWelcome } from '../lib/visits'
import './visits.css'

const DELAY = 1250
const DURATION = 6000

export default function WelcomeToast() {
  const { initialized, welcomeEligible, returning } = useVisits()
  const reduced = useMotionPreference()
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(() => document.hidden)
  const remaining = useRef(DURATION)
  const paused = hovered || focused || hidden

  useEffect(() => {
    if (!initialized || !welcomeEligible || hidden) return
    const timer = setTimeout(() => {
      if (claimWelcome()) { remaining.current = DURATION; setVisible(true) }
    }, DELAY)
    return () => clearTimeout(timer)
  }, [initialized, welcomeEligible, hidden])

  useEffect(() => {
    const update = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  useEffect(() => {
    if (!visible || paused) return
    const start = performance.now()
    const timer = setTimeout(() => setVisible(false), remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (performance.now() - start))
    }
  }, [visible, paused])

  return <AnimatePresence>{visible && <motion.aside className="welcome-toast" aria-label="Boas-vindas" data-paused={paused}
    initial={{ opacity: 0, y: reduced ? 0 : -12, scale: reduced ? 1 : .975 }} animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: reduced ? 0 : -6, scale: reduced ? 1 : .985 }}
    transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 27, mass: .85 }}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}
    onKeyDown={event => { if (event.key === 'Escape') setVisible(false) }}>
    <span className="welcome-toast-icon" aria-hidden="true"><Hand size={20} strokeWidth={1.6} /></span>
    <div className="welcome-toast-copy" role="status" aria-live="polite" aria-atomic="true">
      <p className="welcome-toast-label mono">UMA NOVA CONEXÃO</p>
      <h2>{returning ? 'Que bom ter você de volta! 👋' : 'Olá, seja bem-vindo! 👋'}</h2>
      <p>{returning ? 'É um prazer receber você novamente. Que tal conferir as novidades do meu portfólio?' : 'Sou Pedro Paulo. Fique à vontade para conhecer meus projetos e as soluções que venho desenvolvendo.'}</p>
    </div>
    <button className="welcome-toast-close" type="button" onClick={() => setVisible(false)} aria-label="Fechar boas-vindas"><X size={17} /></button>
    <div className="welcome-toast-progress" aria-hidden="true"><span /></div>
  </motion.aside>}</AnimatePresence>
}
