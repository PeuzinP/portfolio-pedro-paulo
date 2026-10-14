import { useEffect, useRef } from 'react'
import { animate, useInView } from 'motion/react'
import { Eye, UsersRound } from 'lucide-react'
import { useVisits } from '../hooks/useVisits'
import { useMotionPreference } from '../hooks/useMotionPreference'
import { refreshStats } from '../lib/visits'
import './visits.css'

const formatter = new Intl.NumberFormat('pt-BR')
function AnimatedCount({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const visible = useInView(ref, { once: true, amount: .5 })
  const reduced = useMotionPreference()
  const previous = useRef(0)
  useEffect(() => {
    if (!visible || !ref.current) return
    if (reduced) { ref.current.textContent = formatter.format(value); previous.current = value; return }
    const controls = animate(previous.current, value, { duration: 1.15, ease: [0.16, 1, .3, 1],
      onUpdate: current => { if (ref.current) ref.current.textContent = formatter.format(Math.round(current)) },
      onComplete: () => { previous.current = value },
    })
    return () => controls.stop()
  }, [value, visible, reduced])
  return <><span className="sr-only">{formatter.format(value)}</span><span ref={ref} aria-hidden="true">{formatter.format(value)}</span></>
}

export default function PortfolioStats() {
  const { stats, status, browser, previousVisit } = useVisits()
  return <section className="portfolio-stats container" aria-labelledby="portfolio-stats-title">
    <div className="portfolio-stats-heading"><span className="stats-signal" aria-hidden="true" /><h2 id="portfolio-stats-title" className="mono">PORTFÓLIO EM NÚMEROS</h2></div>
    <div className="portfolio-stats-content" aria-busy={status === 'loading'}>
      {stats ? <dl className="portfolio-stats-values">
        <div><dt><Eye size={16} aria-hidden="true" /> Visualizações</dt><dd><AnimatedCount value={stats.views} /></dd></div>
        <div><dt><UsersRound size={16} aria-hidden="true" /> Visitantes únicos</dt><dd><AnimatedCount value={stats.uniqueVisitors} /></dd></div>
      </dl> : <p className="portfolio-stats-unavailable" role="status">{status === 'loading' ? 'Consultando estatísticas…' : <>Estatísticas indisponíveis no momento. <button type="button" onClick={() => void refreshStats()}>Tentar novamente</button></>}</p>}
      <p className="portfolio-stats-note">Estimativas dos acessos que autorizam a medição.<br />Navegadores diferentes podem representar a mesma pessoa.</p>
    </div>
    {browser && <p className="portfolio-browser-stats">Neste navegador: <strong>{formatter.format(browser.views)} {browser.views === 1 ? 'visualização' : 'visualizações'}</strong> · {formatter.format(browser.sessions)} {browser.sessions === 1 ? 'sessão' : 'sessões'}<span>{previousVisit ? <>Visita anterior: <time dateTime={previousVisit}>{new Date(previousVisit).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time></> : 'Primeira visita registrada.'}</span></p>}
  </section>
}
