import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { VisitStats } from '../../shared/visits'
import { BRAZIL_STATES } from '../../shared/brazil-states'
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
  const [states, setStates] = useState<Country[]>([])
  const [stateError, setStateError] = useState(false)
  const [stateAttempt, setStateAttempt] = useState(0)
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState(world)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; y: number; view: typeof world; moved: boolean } | null>(null)
  const reduced = useMotionPreference()
  const svgRef = useRef<SVGSVGElement>(null)
  const panFrame = useRef(0)
  const pendingPan = useRef<typeof world | null>(null)
  function positionTooltip() {
    const tooltip = tooltipRef.current
    const stage = stageRef.current
    if (!tooltip || !stage) return
    if (!pointer.current) { tooltip.style.visibility = 'hidden'; return }
    const box = stage.getBoundingClientRect()
    const x = pointer.current.x - box.left
    const y = pointer.current.y - box.top
    const left = Math.max(8, Math.min(x + 10, stage.clientWidth - tooltip.offsetWidth - 8))
    const top = Math.max(8, Math.min(y + 12, stage.clientHeight - tooltip.offsetHeight - 8))
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${top}px`
    tooltip.style.visibility = 'visible'
  }
  useLayoutEffect(positionTooltip, [hoveredState, dragging])
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const resize = () => {
      positionTooltip()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(svg)
    return () => observer.disconnect()
  }, [countries.length])
  useEffect(() => () => { if (panFrame.current) cancelAnimationFrame(panFrame.current) }, [])
  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    fetch('/geo/countries.json', { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json() }).then(setCountries).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [attempt])
  const exploringBrazil = selected === 'BR'
  useEffect(() => {
    if (!exploringBrazil || states.length) return
    const controller = new AbortController()
    setStateError(false)
    fetch('/geo/brazil-states.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw Error(); return response.json() })
      .then(setStates)
      .catch(() => { if (!controller.signal.aborted) setStateError(true) })
    return () => controller.abort()
  }, [exploringBrazil, states.length, stateAttempt])
  const rows = stats?.countries ?? []
  const counts = new Map(rows.map(row => [row.code, row.views]))
  const total = stats?.views ?? 0
  const maximum = Math.max(1, ...rows.map(row => row.views))
  const unknown = stats?.unknownViews ?? total
  const stateCounts = new Map((stats?.brazilStates ?? []).map(row => [row.code, row.views]))
  const brazilViews = counts.get('BR') ?? 0
  const stateMaximum = Math.max(1, ...stateCounts.values())
  const stateDetails = (code: string) => {
    const name = `${BRAZIL_STATES[code]} (${code}) · Brasil`
    if (!stats?.brazilStates) return `${name} · Contagem por estado ainda indisponível.`
    const views = stateCounts.get(code) ?? 0
    const share = brazilViews ? (views / brazilViews * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'
    return `${name} · ${number.format(views)} visualizações · ${share}% dos acessos do Brasil`
  }
  const label = (code: string) => names.of(code) ?? code
  const details = (code: string) => `${label(code)} · ${number.format(counts.get(code) ?? 0)} visualizações · ${total ? ((counts.get(code) ?? 0) / total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'}% do total`
  const reset = () => { setSelected(null); setHovered(null); setSelectedState(null); setHoveredState(null); pointer.current = null; setView(world) }
  function select(code: string) {
    setSelected(code)
    setSelectedState(null)
    setHoveredState(null)
    pointer.current = null
    const country = countries.find(item => item.code === code)
    if (!country) { setView(world); return }
    const [x1,y1,x2,y2] = country.bounds
    const width = Math.min(360, Math.max(24, (x2-x1)*1.5, (y2-y1)*3))
    setView({ x: (x1+x2-width)/2, y: (y1+y2-width/2)/2, width, height: width/2 })
  }
  function selectState(code: string) {
    const state = states.find(item => item.code === code)
    if (!state) return
    setSelected('BR')
    setSelectedState(code)
    setHoveredState(null)
    pointer.current = null
    const [x1, y1, x2, y2] = state.bounds
    const width = Math.max(12, (x2 - x1) * 1.5, (y2 - y1) * 3)
    setView({ x: (x1 + x2 - width) / 2, y: (y1 + y2 - width / 2) / 2, width, height: width / 2 })
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
        <button type="button" onClick={() => select('BR')}>{exploringBrazil ? 'Ver todo o Brasil' : 'Explorar estados do Brasil'}</button>
      </div>
      <div className="visitor-map-stage" ref={stageRef} aria-busy={!countries.length && !error}>
        {error ? <p role="alert">Não foi possível carregar o mapa. <button onClick={() => setAttempt(n => n+1)}>Tentar novamente</button></p> : !countries.length ? <p role="status">Carregando mapa…</p> : <svg ref={svgRef} viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} role="group" aria-label="Mapa-múndi interativo de visualizações" style={{ touchAction: view.width < 360 ? 'none' : 'pan-y' }}
          onKeyDown={e => {
            if (e.key === 'Escape') reset()
            if (e.key === '+') zoom(.7)
            if (e.key === '-') zoom(1/.7)
            const delta: Record<string, number[]> = { ArrowLeft: [-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1] }
            if (delta[e.key] && view.width < 360) { e.preventDefault(); const [dx,dy] = delta[e.key]; setView(v => ({...v,x:v.x+dx*v.width*.1,y:v.y+dy*v.height*.1})) }
          }}
          onPointerDown={e => { if (view.width < 360 && e.isPrimary) { drag.current={x:e.clientX,y:e.clientY,view,moved:false}; e.currentTarget.setPointerCapture(e.pointerId) } }}
          onPointerMove={e => { const d=drag.current; if (!d) { if (e.pointerType === 'mouse') { pointer.current={x:e.clientX,y:e.clientY}; positionTooltip() } return }; const dx=e.clientX-d.x,dy=e.clientY-d.y; if (Math.hypot(dx,dy)>5) { d.moved=true; setDragging(true); setHoveredState(null); pointer.current=null; const scale=d.view.width/e.currentTarget.getBoundingClientRect().width; pendingPan.current={...d.view,x:d.view.x-dx*scale,y:d.view.y-dy*scale}; if (!panFrame.current) panFrame.current=requestAnimationFrame(() => { panFrame.current=0; if (pendingPan.current) setView(pendingPan.current) }) } }}
          onPointerLeave={() => { setHovered(null); setHoveredState(null); pointer.current=null }}
          onPointerUp={e => { const d=drag.current; if (d && !d.moved) { const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-state], [data-country]') as SVGElement | null; if (hit?.dataset.state) selectState(hit.dataset.state); else if (hit?.dataset.country) select(hit.dataset.country) } drag.current=null; setDragging(false) }}
          onPointerCancel={() => { drag.current=null; pendingPan.current=null; setDragging(false) }}>
          <g style={{ transition: reduced || dragging ? 'none' : 'color 160ms ease' }}>
          {countries.map(country => {
            const count=counts.get(country.code) ?? 0
            const active=selected===country.code || hovered===country.code
            return <path key={country.code+country.name} data-country={country.code} d={country.path} fill="currentColor" fillRule="evenodd" stroke={active ? '#e6ffff' : 'currentColor'} strokeWidth={active ? .5 : .12} vectorEffect="non-scaling-stroke" style={{ color:active ? '#b9ffff' : count ? `hsl(179 60% ${32+Math.sqrt(count/maximum)*40}%)` : '#34454e' }} role="button" tabIndex={0} aria-label={details(country.code)} aria-pressed={selected===country.code}
              onMouseEnter={() => setHovered(country.code)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(country.code)} onBlur={() => setHovered(null)}
              onClick={() => { if (view.width===360) select(country.code) }} onKeyDown={e => { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); select(country.code) } }}><title>{details(country.code)}</title></path>
          })}</g>
          {exploringBrazil && states.length > 0 && <g aria-label="Estados do Brasil">
            {states.map(state => {
              const active = selectedState === state.code || hoveredState === state.code
              const views = stateCounts.get(state.code) ?? 0
              return <g key={state.code}>
                <path d={state.path} fill="#101920" pointerEvents="none" />
                <path className="visitor-state" data-state={state.code} d={state.path} fill="currentColor" fillRule="evenodd" vectorEffect="non-scaling-stroke" style={{ color: active ? '#7de0dc' : views ? `hsl(179 60% ${32 + Math.sqrt(views/stateMaximum)*40}%)` : '#40555f' }}
                  role="button" tabIndex={0} aria-label={stateDetails(state.code)} aria-pressed={selectedState === state.code}
                  onMouseEnter={() => { setHoveredState(state.code); setHovered(null) }} onMouseLeave={() => setHoveredState(null)}
                  onFocus={() => { setHoveredState(state.code); setHovered(null); pointer.current=null }} onBlur={() => setHoveredState(null)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectState(state.code) } }}
                  onClick={() => { if (view.width === 360) selectState(state.code) }}><title>{stateDetails(state.code)}</title></path>
                <path className="visitor-state-border" d={state.path} fill="none" stroke={active ? '#94dedc' : '#607b85'} strokeWidth={active ? 1.2 : .65} vectorEffect="non-scaling-stroke" pointerEvents="none" />
              </g>
            })}
          </g>}
        </svg>}
        {exploringBrazil && hoveredState && !dragging && <div ref={tooltipRef} className="visitor-state-tooltip" aria-hidden="true">{BRAZIL_STATES[hoveredState]} ({hoveredState})</div>}
      </div>
      {exploringBrazil && !states.length && <p role={stateError ? 'alert' : 'status'}>{stateError ? <>Não foi possível carregar os estados. <button type="button" onClick={() => setStateAttempt(n => n+1)}>Tentar novamente</button></> : 'Carregando estados do Brasil…'}</p>}
      <p className="visitor-tooltip" role="status">{hoveredState ? stateDetails(hoveredState) : hovered ? details(hovered) : selectedState ? stateDetails(selectedState) : exploringBrazil ? 'Passe o mouse ou toque em um estado para ver seu nome e os acessos registrados.' : 'Passe o mouse ou toque em um país para explorar. Selecione o Brasil para ver os estados.'}</p>
      <div className="visitor-legend"><span>Menos</span><i /><span>Mais visualizações</span></div>
      <p className="visitor-help">Use os botões para ampliar. Quando ampliado, arraste ou use as setas. Esc restaura a visão mundial.</p>
    </div>
    <div className="visitor-sidebar">
      <div className="visitor-detail" aria-live="polite"><h4>{selectedState ? `${BRAZIL_STATES[selectedState]} (${selectedState})` : selected ? label(selected) : 'Resumo mundial'}</h4><p>{selectedState ? stateDetails(selectedState) : selected ? details(selected) : `${number.format(total)} visualizações · ${rows.length} países identificados`}</p>{selected && <button type="button" onClick={reset}>Limpar seleção</button>}</div>
      {exploringBrazil && <div className="visitor-states-panel">
        <label htmlFor="visitor-state-select">Explorar um estado</label>
        <select id="visitor-state-select" value={selectedState ?? ''} disabled={!states.length} onChange={e => e.target.value ? selectState(e.target.value) : select('BR')}>
          <option value="">Todo o Brasil</option>
          {Object.entries(BRAZIL_STATES).map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
        </select>
        <p>Visualizações por estado no mesmo período acumulado. A localização é aproximada, estimada pela rede.</p>
        {stats?.brazilStates ? <>
          <h4>Estados com mais visualizações</h4>
          {stats.brazilStates.length ? <ol className="visitor-ranking">{stats.brazilStates.map(row => <li key={row.code}><button type="button" aria-pressed={selectedState === row.code} onClick={() => selectState(row.code)}><span>{BRAZIL_STATES[row.code]} ({row.code})</span><strong>{number.format(row.views)}</strong></button></li>)}</ol> : <p>Nenhum estado identificado até o momento.</p>}
          <p>Estado não identificado: <strong>{number.format(stats.unknownBrazilStateViews ?? brazilViews)}</strong></p>
        </> : <p>A contagem por estado ainda não está disponível. Os totais abaixo representam países.</p>}
      </div>}
      <h4>Países com mais visualizações</h4>
      {rows.length ? <ol className="visitor-ranking">{rows.map(row => <li key={row.code}><button onClick={() => select(row.code)} aria-pressed={selected===row.code}><span>{label(row.code)}</span><strong>{number.format(row.views)}</strong></button></li>)}</ol> : <p>Nenhum país identificado até o momento.</p>}
      <p>Localização não identificada: <strong>{number.format(unknown)}</strong></p>
      {!total && <p>Aguardando os primeiros acessos autorizados.</p>}
    </div>
  </div>
}
