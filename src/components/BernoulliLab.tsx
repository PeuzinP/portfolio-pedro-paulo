import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Play, RotateCcw, ShieldCheck } from 'lucide-react'
import { bernoulliScenarios, runBernoulliScenario, type BernoulliScenario, type BernoulliStepId } from '../lab/bernoulli'
import { caseStudyHref } from '../data/caseStudies'

const nodes: { id: BernoulliStepId; title: string }[] = [
  { id: 'request', title: 'Solicitação' }, { id: 'validate', title: 'Validar dados' }, { id: 'lookup', title: 'Consultar' }, { id: 'decision', title: 'Decidir' }, { id: 'deactivate', title: 'Desativar' }, { id: 'status', title: 'Status' },
]

export default function BernoulliLab() {
  const [scenario, setScenario] = useState<BernoulliScenario>('found')
  const [events, setEvents] = useState<ReturnType<typeof runBernoulliScenario>>([])
  const [active, setActive] = useState(-1)
  const [running, setRunning] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const reduced = useReducedMotion()
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const reset = () => { timers.current.forEach(clearTimeout); timers.current = []; setEvents([]); setActive(-1); setRunning(false) }
  const start = () => { if (running) return; const next = runBernoulliScenario(scenario); setEvents(next); setActive(reduced ? next.length - 1 : 0); setRunning(!reduced); if (!reduced) next.slice(1).forEach((_, index) => timers.current.push(setTimeout(() => setActive(index + 1), (index + 1) * 560))); if (!reduced) timers.current.push(setTimeout(() => setRunning(false), next.length * 560)) }
  const reached = (id: BernoulliStepId) => events.findIndex(event => event.id === id) <= active && events.some(event => event.id === id)
  const final = events.at(-1)
  return <section className="section container bl-section" aria-labelledby="bernoulli-lab-title"><div className="ad-heading"><div><span className="eyebrow"><span>04</span> LABORATÓRIO DE AUTOMAÇÕES</span><h2 id="bernoulli-lab-title" className="section-title">Valide antes de <span>desativar.</span></h2></div><p className="section-description">Uma simulação local do fluxo de cancelamento e acesso educacional. Nenhum dado real ou API externa é utilizada.</p></div><div className="bl-workbench"><div className="bl-controls"><label htmlFor="bernoulli-scenario">Cenário fictício</label><select id="bernoulli-scenario" value={scenario} disabled={running} onChange={event => { reset(); setScenario(event.target.value as BernoulliScenario) }}>{Object.entries(bernoulliScenarios).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select><p>{bernoulliScenarios[scenario].description}</p><button className="button button-primary" type="button" onClick={start} disabled={running}>{running ? 'Processando…' : <><Play size={16} />Iniciar simulação</>}</button><button className="bl-reset" type="button" onClick={reset} disabled={running}><RotateCcw size={14} />Reiniciar</button><a href={caseStudyHref('acessos-educacionais')}>Ver estudo de caso <ArrowRight size={15} /></a></div><div className="bl-panel"><div className="bl-flow" aria-label="Fluxo de cancelamento e desativação">{nodes.map((node, index) => <div className={`bl-node ${reached(node.id) ? 'bl-node--reached' : ''} ${events[active]?.id === node.id ? 'bl-node--active' : ''}`} key={node.id}><span>{reached(node.id) ? <Check size={13} /> : `0${index + 1}`}</span><strong>{node.title}</strong>{index < nodes.length - 1 && <ArrowRight aria-hidden="true" />}</div>)}</div><div className="bl-terminal" aria-live="polite"><div className="mono">EXECUÇÃO LOCAL / BERNOUILLI</div><AnimatePresence initial={false}>{events.slice(0, active + 1).map(event => <motion.p key={`${event.id}-${event.message}`} initial={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : -6 }} animate={{ opacity: 1, x: 0 }}><b>[{event.level}]</b> {event.message}</motion.p>)}</AnimatePresence>{!events.length && <p className="bl-terminal-empty">Aguardando cenário para simular.</p>}</div>{final && active === events.length - 1 && <div className={`bl-result bl-result--${final.level.toLowerCase()}`}><ShieldCheck size={18} />{final.message}</div>}</div></div></section>
}
