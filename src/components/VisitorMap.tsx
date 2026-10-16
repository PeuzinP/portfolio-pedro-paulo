import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { VisitStats } from '../../shared/visits'
import { useMotionPreference } from '../hooks/useMotionPreference'

type Country = { code: string; name: string; path: string; bounds: number[] }
const names = new Intl.DisplayNames(['pt-BR'], { type: 'region' })
const number = new Intl.NumberFormat('pt-BR')
const world = { x: 0, y: 0, width: 360, height: 180 }
export default function VisitorMap({ stats }: { stats: VisitStats | null }) {
  const [countries, setCountries] = useState<Country[]>([])
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [view, setView] = useState(world)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; y: number; view: typeof world; moved: boolean } | null>(null)
  const reduced = useMotionPreference()
  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    fetch('/geo/countries.json', { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json() }).then(setCountries).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [attempt])
  const rows = stats?.countries ?? []
  const counts = new Map(rows.map(row => [row.code, row.views]))
  const total = stats?.views ?? 0
  const maximum = Math.max(1, ...rows.map(row => row.views))
  const unknown = stats?.unknownViews ?? total
  const label = (code: string) => names.of(code) ?? code
  const details = (code: string) => `${label(code)} · ${number.format(counts.get(code) ?? 0)} visualizações · ${total ? ((counts.get(code) ?? 0) / total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'}% do total`
  const reset = () => { setSelected(null); setHovered(null); setView(world) }
  function select(code: string) {
    setSelected(code)
    const country = countries.find(item => item.code === code)
    if (!country) { setView(world); return }
    const [x1,y1,x2,y2] = country.bounds
    const width = Math.min(360, Math.max(24, (x2-x1)*1.5, (y2-y1)*3))
    setView({ x: (x1+x2-width)/2, y: (y1+y2-width/2)/2, width, height: width/2 })
  }
  function zoom(factor: number) {
    setView(v => { const width = Math.max(18, Math.min(360, v.width*factor)); return { x: v.x+(v.width-width)/2, y:v.y+(v.height-width/2)/2, width, height:width/2 } })
  }
  return <div className="visitor-explorer">
    <div className="visitor-map-column">
      <div className="visitor-map-controls" aria-label="Controles do mapa">
        <button type="button" onClick={() => zoom(.7)} disabled={view.width <= 18} aria-label="Aumentar zoom">+</button>
        <button type="button" onClick={() => zoom(1/.7)} disabled={view.width >= 360} aria-label="Diminuir zoom">−</button>
        <button type="button" onClick={reset}>Visão mundial</button>
      </div>
      <div className="visitor-map-stage" aria-busy={!countries.length && !error}>
        {error ? <p role="alert">Não foi possível carregar o mapa. <button onClick={() => setAttempt(n => n+1)}>Tentar novamente</button></p> : !countries.length ? <p role="status">Carregando mapa…</p> : <motion.svg initial={false} animate={{ viewBox: `${view.x} ${view.y} ${view.width} ${view.height}` }} transition={{ duration: reduced || dragging ? 0 : .35 }} role="group" aria-label="Mapa-múndi interativo de visualizações" style={{ touchAction: view.width < 360 ? 'none' : 'pan-y' }}
          onKeyDown={e => {
            if (e.key === 'Escape') reset()
            if (e.key === '+') zoom(.7)
            if (e.key === '-') zoom(1/.7)
            const delta: Record<string, number[]> = { ArrowLeft: [-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1] }
            if (delta[e.key] && view.width < 360) { e.preventDefault(); const [dx,dy] = delta[e.key]; setView(v => ({...v,x:v.x+dx*v.width*.1,y:v.y+dy*v.height*.1})) }
          }}
          onPointerDown={e => { if (view.width < 360 && e.isPrimary) { drag.current={x:e.clientX,y:e.clientY,view,moved:false}; e.currentTarget.setPointerCapture(e.pointerId) } }}
          onPointerMove={e => { const d=drag.current; if (!d) return; const dx=e.clientX-d.x,dy=e.clientY-d.y; if (Math.hypot(dx,dy)>5) { d.moved=true; setDragging(true); const scale=d.view.width/e.currentTarget.getBoundingClientRect().width; setView({...d.view,x:d.view.x-dx*scale,y:d.view.y-dy*scale}) } }}
          onPointerUp={e => { const d=drag.current; if (d && !d.moved) { const code=(document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-country]') as SVGElement | null)?.dataset.country; if (code) select(code) } drag.current=null; setDragging(false) }}
          onPointerCancel={() => { drag.current=null; setDragging(false) }}>
          <defs><pattern id="visitor-dots" width="1.5" height="1.5" patternUnits="userSpaceOnUse"><circle cx=".75" cy=".75" r=".48" fill="white" /></pattern><mask id="visitor-dot-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="180"><rect width="360" height="180" fill="url(#visitor-dots)" /></mask></defs>
          <g mask="url(#visitor-dot-mask)" style={{ transition: reduced || dragging ? 'none' : 'color 220ms ease' }}>
          {countries.map(country => {
            const count=counts.get(country.code) ?? 0
            const active=selected===country.code || hovered===country.code
            return <path key={country.code+country.name} data-country={country.code} d={country.path} fill="currentColor" fillRule="evenodd" stroke={active ? '#e6ffff' : 'currentColor'} strokeWidth={active ? .5 : .12} vectorEffect="non-scaling-stroke" style={{ color:active ? '#b9ffff' : count ? `hsl(179 60% ${32+Math.sqrt(count/maximum)*40}%)` : '#34454e' }} role="button" tabIndex={0} aria-label={details(country.code)} aria-pressed={selected===country.code}
              onMouseEnter={() => setHovered(country.code)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(country.code)} onBlur={() => setHovered(null)}
              onClick={() => { if (view.width===360) select(country.code) }} onKeyDown={e => { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); select(country.code) } }}><title>{details(country.code)}</title></path>
          })}</g>
        </motion.svg>}
      </div>
      <p className="visitor-tooltip" role="status">{hovered ? details(hovered) : 'Passe o mouse ou toque em um país para explorar.'}</p>
      <div className="visitor-legend"><span>Menos</span><i /><span>Mais visualizações</span></div>
      <p className="visitor-help">Use os botões para ampliar. Quando ampliado, arraste ou use as setas. Esc restaura a visão mundial.</p>
    </div>
    <div className="visitor-sidebar">
      <div className="visitor-detail" aria-live="polite"><h4>{selected ? label(selected) : 'Resumo mundial'}</h4><p>{selected ? details(selected) : `${number.format(total)} visualizações · ${rows.length} países identificados`}</p>{selected && <button type="button" onClick={reset}>Limpar seleção</button>}</div>
      <h4>Países com mais visualizações</h4>
      {rows.length ? <ol className="visitor-ranking">{rows.map(row => <li key={row.code}><button onClick={() => select(row.code)} aria-pressed={selected===row.code}><span>{label(row.code)}</span><strong>{number.format(row.views)}</strong></button></li>)}</ol> : <p>Nenhum país identificado até o momento.</p>}
      <p>Localização não identificada: <strong>{number.format(unknown)}</strong></p>
      {!total && <p>Aguardando os primeiros acessos autorizados.</p>}
    </div>
  </div>
}
