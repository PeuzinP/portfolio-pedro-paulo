import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  CheckCheck,
  Clock3,
  Database,
  GitBranch,
  Inbox,
  ListChecks,
  MessageSquare,
  Moon,
  Play,
  RotateCcw,
  ShieldCheck,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react'
import './automation-demo.css'

type Intention = 'Matrícula' | 'Financeiro' | 'Suporte'
type BusinessHours = 'open' | 'closed'
type StepId = 'contact' | 'intent' | 'hours' | 'team' | 'forward' | 'collect' | 'return'
type SimulationStep = { id: StepId; message: string }

const teams: Record<Intention, string> = {
  Matrícula: 'Equipe de matrículas',
  Financeiro: 'Equipe financeira',
  Suporte: 'Equipe de suporte',
}

function FlowNode({
  icon: Icon,
  title,
  detail,
  state,
  tone = 'cyan',
}: {
  icon: LucideIcon
  title: string
  detail: string
  state: 'idle' | 'active' | 'complete'
  tone?: 'cyan' | 'violet'
}) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={`ad-node ad-node--${state} ad-node--${tone}`}
      animate={{ scale: state === 'active' && !reducedMotion ? 1.025 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
    >
      <span className="ad-node-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.7} /></span>
      <span className="ad-node-copy"><strong>{title}</strong><span>{detail}</span></span>
      <span className="ad-node-marker" aria-hidden="true">
        {state === 'complete' ? <Check size={12} /> : <span />}
      </span>
    </motion.div>
  )
}

export default function AutomationDemo() {
  const [businessHours, setBusinessHours] = useState<BusinessHours>('open')
  const [intention, setIntention] = useState<Intention>('Matrícula')
  const [steps, setSteps] = useState<SimulationStep[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [running, setRunning] = useState(false)
  const [complete, setComplete] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const reducedMotion = useReducedMotion()
  const team = teams[intention]

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const reset = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setActiveIndex(-1)
    setSteps([])
    setRunning(false)
    setComplete(false)
  }

  const simulate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (running) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    const nextSteps: SimulationStep[] = [
      { id: 'contact', message: 'Contato de demonstração recebido.' },
      { id: 'intent', message: `Intenção identificada: ${intention}.` },
      { id: 'hours', message: businessHours === 'open' ? 'Horário comercial: atendimento disponível.' : 'Fora do horário: preparar retorno posterior.' },
      ...(businessHours === 'open'
        ? [
            { id: 'team' as const, message: `${team} selecionada.` },
            { id: 'forward' as const, message: 'Encaminhamento simulado. A equipe recebe o contexto da conversa.' },
          ]
        : [
            { id: 'collect' as const, message: 'Dados fictícios preparados para a coleta.' },
            { id: 'return' as const, message: `Registro local simulado para retorno sobre ${intention.toLocaleLowerCase('pt-BR')}.` },
          ]),
    ]
    setSteps(nextSteps)
    setComplete(Boolean(reducedMotion))
    setRunning(!reducedMotion)
    setActiveIndex(reducedMotion ? nextSteps.length - 1 : 0)

    if (reducedMotion) return

    nextSteps.slice(1).forEach((_, index) => {
      timers.current.push(setTimeout(() => setActiveIndex(index + 1), (index + 1) * 640))
    })
    timers.current.push(setTimeout(() => {
      setComplete(true)
      setRunning(false)
      timers.current = []
    }, nextSteps.length * 640))
  }

  const nodeState = (id: StepId): 'idle' | 'active' | 'complete' => {
    const index = steps.findIndex((step) => step.id === id)
    if (index < 0 || index > activeIndex) return 'idle'
    if (complete || index < activeIndex) return 'complete'
    return 'active'
  }
  const branchReached = activeIndex >= 3
  const statusText = complete
    ? businessHours === 'open'
      ? `Simulação concluída: contato encaminhado para a ${team.toLocaleLowerCase('pt-BR')}.`
      : `Simulação concluída: contato registrado para retorno sobre ${intention.toLocaleLowerCase('pt-BR')}.`
    : running
      ? steps[activeIndex]?.message
      : 'Escolha um cenário e acompanhe o caminho do contato.'

  return (
    <section id="demonstracao" className="section container demo-section" aria-labelledby="demo-title">
      <div className="ad-heading">
        <div>
          <span className="eyebrow"><span>03</span> DO CONCEITO À PRÁTICA</span>
          <h2 id="demo-title" className="section-title">Veja uma automação<br className="ad-heading-break" /> <span>acontecer.</span></h2>
        </div>
        <p className="section-description">Uma entrada, regras claras e o próximo passo certo. Altere o cenário e veja como o fluxo se adapta.</p>
      </div>

      <div className="ad-workbench">
        <form className="ad-controls" onSubmit={simulate}>
          <div className="ad-panel-label mono"><span className="ad-tiny-square" /> CONFIGURE O CENÁRIO <span>01</span></div>
          <fieldset className="ad-fieldset" disabled={running}>
            <legend>Quando o contato chega?</legend>
            <label className={`ad-radio ${businessHours === 'open' ? 'ad-radio--selected' : ''}`}>
              <input
                type="radio"
                name="business-hours"
                value="open"
                checked={businessHours === 'open'}
                onChange={() => { reset(); setBusinessHours('open') }}
              />
              <Sun size={18} aria-hidden="true" />
              <span><strong>Horário comercial</strong><small>Equipe disponível</small></span>
              <span className="ad-radio-dot" aria-hidden="true" />
            </label>
            <label className={`ad-radio ${businessHours === 'closed' ? 'ad-radio--selected' : ''}`}>
              <input
                type="radio"
                name="business-hours"
                value="closed"
                checked={businessHours === 'closed'}
                onChange={() => { reset(); setBusinessHours('closed') }}
              />
              <Moon size={18} aria-hidden="true" />
              <span><strong>Fora do horário</strong><small>Preparar retorno</small></span>
              <span className="ad-radio-dot" aria-hidden="true" />
            </label>
          </fieldset>
          <label className="ad-select-label" htmlFor="demo-intention">Qual é a intenção?</label>
          <div className="ad-select-wrap">
            <select
              id="demo-intention"
              value={intention}
              disabled={running}
              onChange={(event) => { reset(); setIntention(event.target.value as Intention) }}
            >
              <option>Matrícula</option>
              <option>Financeiro</option>
              <option>Suporte</option>
            </select>
            <ArrowDown size={15} aria-hidden="true" />
          </div>
          <button className="button button-primary ad-simulate" type="submit" disabled={running}>
            {running ? <span className="ad-loading-dot" aria-hidden="true" /> : complete ? <RotateCcw size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {running ? 'Simulando atendimento…' : 'Simular atendimento'}
            {!running && <ArrowUpRight size={16} aria-hidden="true" />}
          </button>
          <p className="ad-local-note"><ShieldCheck size={15} aria-hidden="true" /><span>Simulação local com dados fictícios. Sem disparos reais ou conexão com plataformas externas.</span></p>
        </form>

        <div className="ad-flow-panel">
          <div className="ad-flow-toolbar">
            <span className="mono"><GitBranch size={14} aria-hidden="true" /> FLUXO DE ATENDIMENTO</span>
            <span className={`ad-execution-label ${running ? 'ad-execution-label--running' : ''}`}><i />{running ? 'Em execução' : complete ? 'Concluído' : 'Pronto para simular'}</span>
          </div>
          <div className="ad-flow-canvas" aria-label="Diagrama dos dois percursos possíveis do atendimento">
            <div className="ad-common-path">
              <FlowNode icon={MessageSquare} title="Contato" detail="Entrada da conversa" state={nodeState('contact')} />
              <span className={`ad-connector ${activeIndex >= 1 ? 'ad-connector--lit' : ''}`} aria-hidden="true"><i /></span>
              <FlowNode icon={ListChecks} title="Intenção" detail={intention} state={nodeState('intent')} />
              <span className={`ad-connector ${activeIndex >= 2 ? 'ad-connector--lit' : ''}`} aria-hidden="true"><i /></span>
              <FlowNode icon={Clock3} title="Horário" detail="Aplicação da regra" state={nodeState('hours')} />
            </div>
            <div className="ad-fork" aria-hidden="true"><span className={activeIndex >= 2 ? 'ad-fork--lit' : ''} /></div>
            <div className="ad-branches">
              <div className={`ad-branch ${branchReached && businessHours === 'open' ? 'ad-branch--selected' : ''}`}>
                <div className="ad-branch-label mono"><Sun size={12} aria-hidden="true" /> HORÁRIO COMERCIAL{branchReached && businessHours === 'open' && <Check size={12} aria-hidden="true" />}</div>
                <FlowNode icon={Users} title="Equipe responsável" detail={team} state={nodeState('team')} />
                <span className={`ad-vertical-connector ${nodeState('forward') !== 'idle' ? 'ad-vertical-connector--lit' : ''}`} aria-hidden="true"><i /></span>
                <FlowNode icon={Inbox} title="Encaminhamento" detail="Conversa com contexto" state={nodeState('forward')} />
              </div>
              <div className={`ad-branch ad-branch--violet ${branchReached && businessHours === 'closed' ? 'ad-branch--selected' : ''}`}>
                <div className="ad-branch-label mono"><Moon size={12} aria-hidden="true" /> FORA DO HORÁRIO{branchReached && businessHours === 'closed' && <Check size={12} aria-hidden="true" />}</div>
                <FlowNode icon={ListChecks} title="Coleta de dados" detail="Contato de demonstração" state={nodeState('collect')} tone="violet" />
                <span className={`ad-vertical-connector ${nodeState('return') !== 'idle' ? 'ad-vertical-connector--lit' : ''}`} aria-hidden="true"><i /></span>
                <FlowNode icon={Database} title="Registro para retorno" detail="Informações organizadas" state={nodeState('return')} tone="violet" />
              </div>
            </div>
          </div>
          <div className={`ad-log ${complete ? 'ad-log--complete' : ''}`}>
            <div className="ad-log-label mono">{complete ? <CheckCheck size={15} aria-hidden="true" /> : <span className="ad-log-caret" aria-hidden="true">›</span>}<span>EXECUÇÃO LOCAL</span><span>{activeIndex >= 0 ? `${String(activeIndex + 1).padStart(2, '0')} / 05` : 'EM ESPERA'}</span></div>
            <div className="ad-status" role="status" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={`${activeIndex}-${complete}-${businessHours}-${intention}`}
                  initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : -4 }}
                  transition={{ duration: reducedMotion ? 0 : 0.15 }}
                >{statusText}</motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
