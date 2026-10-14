import { useEffect, useRef, useState } from 'react'
import { Activity, ArrowDownToLine, Check, CheckCheck, GitBranch, Pause, Play, Webhook, Zap } from 'lucide-react'
import { useInView, useReducedMotion } from 'motion/react'

const nodes = [
  { name: 'Entrada de dados', type: 'webhook · evento recebido', icon: ArrowDownToLine, description: 'Tudo começa com uma informação: um contato, um formulário ou um evento.' },
  { name: 'Validação', type: 'regras · dados consistentes', icon: CheckCheck, description: 'As regras de negócio verificam se os dados estão prontos para seguir.' },
  { name: 'Integração', type: 'api · sistemas conectados', icon: Webhook, description: 'APIs conectam plataformas e levam a informação ao lugar certo.' },
  { name: 'Ação', type: 'processo · próximo passo', icon: Zap, description: 'Uma ação transforma dados em andamento: encaminhar, registrar ou atualizar.' },
  { name: 'Monitoramento', type: 'logs · rastreabilidade', icon: Activity, description: 'O registro de status dá visibilidade ao que aconteceu em cada etapa.' },
]

export default function FlowDiagram() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: .2 })
  const reduced = useReducedMotion()
  const [running, setRunning] = useState(true)
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  useEffect(() => {
    if (reduced || !running || !inView) return
    const timer = window.setInterval(() => setStep(value => (value + 1) % nodes.length), 1400)
    return () => window.clearInterval(timer)
  }, [inView, reduced, running])
  const active = hovered ?? selected ?? (reduced ? 0 : step)
  return <div className="flow-shell" ref={ref}>
    <div className="flow-toolbar"><span><GitBranch size={14} /> processo.conectado</span><span className="flow-demo-label"><i className="status-dot" /> Demonstração</span></div>
    <div className="flow-canvas">
      <div className="flow-canvas-label mono">EVENTO → RESULTADO</div>
      <svg className="flow-connections" viewBox="0 0 500 425" fill="none" aria-hidden="true">
        {['M215 96H280', 'M372.5 127V199', 'M280 230H215', 'M122.5 261V333'].map((d, i) => <g key={d}><path d={d} stroke="#2b3b43" strokeWidth="1.5" /><path className={active === i || active === i + 1 ? 'connection-lit' : ''} d={d} stroke="#67dcd9" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.15" /></g>)}
        {!reduced && running && inView && <circle r="3.5" fill="#a7ffef"><animateMotion dur="7s" repeatCount="indefinite" path="M122.5 96H372.5V230H122.5V364" calcMode="linear" keyPoints="0;0.326;0.5;0.826;1;1" keyTimes="0;0.2;0.4;0.6;0.8;1" /></circle>}
        <path d="M215 364H257" stroke="#2b3b43" strokeWidth="1.5" strokeDasharray="3 5" />
      </svg>
      {nodes.map((node, i) => <button key={node.name} type="button" className={`flow-node node-${i} ${active === i ? 'is-active' : ''}`} aria-pressed={selected === i} onClick={() => { setSelected(i); setRunning(false) }} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(i)} onBlur={() => setHovered(null)}>
        <span className="node-icon"><node.icon size={18} /></span><span><strong>{node.name}</strong><small>{node.type}</small></span><span className="node-port" />
      </button>)}
      <div className="flow-success"><span><Check size={13} /> Sistemas conectados.</span><small>Processos que avançam.</small></div>
      <span className="canvas-corner top-left" /><span className="canvas-corner bottom-right" />
    </div>
    <div className="flow-footer"><span className="flow-caption">{nodes[active].description}</span><button type="button" className="icon-button" aria-label={running ? 'Pausar animação do fluxo' : 'Reproduzir animação do fluxo'} onClick={() => { setRunning(!running); setSelected(null); setStep(0) }} disabled={!!reduced}>{running && !reduced ? <Pause size={14} /> : <Play size={14} />}</button></div>
  </div>
}
