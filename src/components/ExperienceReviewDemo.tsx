import { useEffect, useId, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowDown, CalendarClock, Check, ClipboardCheck, Database,
  GitBranch, Landmark, Play, RotateCcw, ShieldCheck, UserRound, Users,
} from 'lucide-react'
import './experience-review-demo.css'

const states = ['Programada', 'Aguardando avaliação', 'Respondida', 'Aguardando ciência', 'Encaminhada'] as const
const stages = [
  { title: 'Base de colaboradores', subtitle: 'Dados organizados', icon: Database, state: 0, responsible: 'Equipe de Gente & Gestão', role: 'Reúne colaborador, unidade, cargo, setor e avaliador para organizar o início do acompanhamento.' },
  { title: 'Controle de prazos', subtitle: 'Ciclo de 30 ou 90 dias', icon: CalendarClock, state: 0, responsible: 'Equipe de Gente & Gestão', role: 'Relaciona a data de admissão ao período escolhido e sinaliza quando a avaliação deve ser encaminhada.' },
  { title: 'Avaliador', subtitle: 'Formulário e notificação', icon: UserRound, state: 1, responsible: 'Avaliador responsável', role: 'Recebe o formulário e o contexto da avaliação. Neste exemplo, o envio é apenas representado na tela.' },
  { title: 'Resposta', subtitle: 'Informações consolidadas', icon: ClipboardCheck, state: 2, responsible: 'Avaliador responsável', role: 'Representa a coleta das respostas e a identificação por e-mail verificado prevista no fluxo, sem coletar respostas ou e-mails nesta demonstração.' },
  { title: 'Diretoria', subtitle: 'Ciência e decisão', icon: Landmark, state: 3, responsible: 'Diretoria', role: 'Consulta a avaliação por um acesso individual e participa da etapa de ciência e decisão. Nenhuma decisão real é registrada aqui.' },
  { title: 'DP / Gente & Gestão', subtitle: 'Continuidade do processo', icon: Users, state: 4, responsible: 'DP / Gente & Gestão', role: 'Recebe o encaminhamento das informações para acompanhar pendências e os próximos passos internos.' },
] as const

const stepDuration = 860

export default function ExperienceReviewDemo() {
  const id = useId()
  const reducedMotion = useReducedMotion()
  const [period, setPeriod] = useState<30 | 90>(30)
  const [selectedStage, setSelectedStage] = useState(0)
  const [activeStage, setActiveStage] = useState(-1)
  const [running, setRunning] = useState(false)
  const [complete, setComplete] = useState(false)
  const [runId, setRunId] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (reducedMotion && running) {
      clearTimers()
      setActiveStage(stages.length - 1)
      setComplete(true)
      setRunning(false)
    }
  }, [reducedMotion, running])

  const reset = () => {
    clearTimers()
    setActiveStage(-1)
    setRunning(false)
    setComplete(false)
  }

  const simulate = () => {
    clearTimers()
    setRunId(value => value + 1)
    setActiveStage(reducedMotion ? stages.length - 1 : 0)
    setRunning(!reducedMotion)
    setComplete(Boolean(reducedMotion))
    if (reducedMotion) return
    stages.slice(1).forEach((_, index) => {
      timers.current.push(setTimeout(() => setActiveStage(index + 1), (index + 1) * stepDuration))
    })
    timers.current.push(setTimeout(() => {
      setRunning(false)
      setComplete(true)
      timers.current = []
    }, stages.length * stepDuration))
  }

  const currentStage = stages[Math.max(activeStage, 0)]
  const currentState = currentStage.state
  const selected = stages[selectedStage]
  const result = complete
    ? `Simulação de ${period} dias concluída: informações encaminhadas a DP / Gente & Gestão.`
    : running
      ? `Simulação de ${period} dias: ${states[currentState].toLocaleLowerCase('pt-BR')}.`
      : 'Escolha um período e simule o fluxo. Selecione uma etapa para conhecer seu papel.'

  return (
    <section className="hr-demo" aria-labelledby={`${id}-title`}>
      <div className="hd-heading">
        <span className="hd-overline"><GitBranch size={14} aria-hidden="true" /> PROCESSO EM MOVIMENTO</span>
        <h3 id={`${id}-title`} className="hd-title">Simule o ciclo de avaliação</h3>
        <p className="hd-demo-label"><ShieldCheck size={15} aria-hidden="true" /> Demonstração com dados fictícios</p>
      </div>

      <div className="hd-controls">
        <fieldset className="hd-period">
          <legend>Período da avaliação</legend>
          <div className="hd-period-options">
            {([30, 90] as const).map(value => (
              <label key={value} className={`hd-period-option ${period === value ? 'hd-period-option--selected' : ''}`}>
                <input type="radio" name={`${id}-period`} value={value} checked={period === value} onChange={() => { reset(); setPeriod(value) }} />
                <span>{value} dias</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="hd-actions">
          <button type="button" className="button button-primary hd-run" onClick={simulate} disabled={running}>
            <Play size={15} aria-hidden="true" />{running ? 'Simulando…' : 'Simular fluxo'}
          </button>
          <button type="button" className="hd-reset" onClick={reset} disabled={activeStage < 0} aria-label="Reiniciar demonstração" title="Reiniciar demonstração">
            <RotateCcw size={17} aria-hidden="true" /><span>Reiniciar</span>
          </button>
        </div>
      </div>

      <div className="hd-workbench">
        <div className="hd-diagram">
          <div className="hd-panel-caption"><span>FLUXO ILUSTRATIVO</span><span>{activeStage < 0 ? '00' : String(activeStage + 1).padStart(2, '0')} / 06</span></div>
          <ol className="hd-flow" aria-label="Etapas do ciclo de avaliação">
            {stages.map((stage, index) => {
              const Icon = stage.icon
              const reached = activeStage >= index
              const active = running && activeStage === index
              const done = reached && (!active || complete)
              const connected = selectedStage === index || selectedStage === index + 1
              return (
                <li key={stage.title} className="hd-step">
                  <button type="button" className={`hd-node ${selectedStage === index ? 'hd-node--selected' : ''} ${active ? 'hd-node--active' : ''} ${done ? 'hd-node--done' : ''}`} aria-pressed={selectedStage === index} aria-controls={`${id}-stage-role`} onClick={() => setSelectedStage(index)}>
                    <span className="hd-node-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.6} /></span>
                    <span className="hd-node-copy"><strong>{stage.title}</strong><small>{stage.subtitle}</small></span>
                    <span className="hd-node-number" aria-hidden="true">{done ? <Check size={13} /> : String(index + 1).padStart(2, '0')}</span>
                  </button>
                  {index < stages.length - 1 && (
                    <span className={`hd-connector ${activeStage > index ? 'hd-connector--done' : ''} ${connected ? 'hd-connector--selected' : ''}`} aria-hidden="true">
                      <ArrowDown size={12} />
                      {active && !reducedMotion && <motion.i key={`${runId}-${index}`} initial={{ y: -8, opacity: 0 }} animate={{ y: [-8, 3, 14], opacity: [0, 1, 0] }} transition={{ duration: stepDuration / 1000, ease: 'linear' }} />}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        <div className="hd-inspector">
          <div id={`${id}-stage-role`} className="hd-role" aria-label="Papel da etapa selecionada">
            <span className="hd-panel-caption">ETAPA {String(selectedStage + 1).padStart(2, '0')} / PAPEL NO PROCESSO</span>
            <h4>{selected.title}</h4>
            <p>{selected.role}</p>
          </div>

          <div className="hd-record">
            <div className="hd-person"><span aria-hidden="true">A</span><div><strong>Alex</strong><small>Colaborador fictício</small></div><span className="hd-sample-tag">EXEMPLO</span></div>
            <dl className="hd-record-fields">
              <div><dt>Período</dt><dd>{period} dias</dd></div>
              <div><dt>Responsável</dt><dd>{currentStage.responsible}</dd></div>
              <div><dt>Prazo</dt><dd>{period}º dia após admissão</dd></div>
              <div><dt>Status</dt><dd className="hd-status-value"><span aria-hidden="true" />{states[currentState]}</dd></div>
            </dl>
            <div className="hd-progress" role="progressbar" aria-label="Progresso da simulação" aria-valuemin={0} aria-valuemax={6} aria-valuenow={activeStage < 0 ? 0 : activeStage + 1} aria-valuetext={`${activeStage < 0 ? 0 : activeStage + 1} de 6 etapas: ${states[currentState]}`}>
              <motion.span animate={{ scaleX: activeStage < 0 ? 0 : (activeStage + 1) / stages.length }} transition={{ duration: reducedMotion ? 0 : 0.2 }} />
            </div>
          </div>

          <ol className="hd-states" aria-label="Estados ilustrativos da avaliação">
            {states.map((state, index) => (
              <li key={state} className={`${currentState === index ? 'hd-state--current' : ''} ${index < currentState || complete ? 'hd-state--done' : ''}`} aria-current={currentState === index ? 'step' : undefined}>
                <span aria-hidden="true">{index < currentState || complete ? <Check size={11} /> : String(index + 1)}</span>{state}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className={`hd-result ${complete ? 'hd-result--complete' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        <span className="hd-result-dot" aria-hidden="true" /><p>{result}</p>
      </div>
      <p className="hd-disclaimer">Simulação local: não envia e-mails, registra avaliações reais ou acessa dados corporativos. Os estados e o fluxo são ilustrativos e não reproduzem dados ou operações reais do sistema em aplicação.</p>
    </section>
  )
}
