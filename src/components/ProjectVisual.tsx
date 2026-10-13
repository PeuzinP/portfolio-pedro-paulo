import { ArrowDown, ArrowRight, CalendarClock, Check, ClipboardCheck, Code2, Database, FileText, GitBranch, GraduationCap, Mail, MessageCircle, ScanLine, ShieldCheck, Table2, Users, Webhook } from 'lucide-react'
import type { Project } from '../data/portfolio'

export default function ProjectVisual({ kind }: { kind: Project['kind'] }) {
  return <div className={`project-visual visual-${kind}`} aria-hidden="true">
    <span className="visual-caption mono">{kind === 'orchestrator' ? 'ARQUITETURA CONCEITUAL' : 'FLUXO ILUSTRATIVO'}</span>
    {kind === 'experience' && <div className="experience-visual"><span className="experience-periods mono">30 DIAS <i /> 90 DIAS</span><div className="experience-mini-flow">{[
      { label: 'Base de colaboradores', icon: Users },
      { label: 'Controle de prazos', icon: CalendarClock },
      { label: 'Avaliador', icon: ClipboardCheck },
      { label: 'Resposta', icon: FileText },
      { label: 'Diretoria', icon: ShieldCheck },
      { label: 'DP / Gente & Gestão', icon: Users },
    ].map((step, i) => <div key={step.label}><span className="experience-mini-index mono">0{i + 1}</span><step.icon size={17} /><strong>{step.label}</strong>{i < 5 && <ArrowRight className="experience-mini-arrow" size={12} />}</div>)}</div></div>}
    {kind === 'reading' && <div className="reading-visual">
      <div className="reading-architecture mono"><span><Code2 size={13} /> React</span><i /><span><Webhook size={13} /> FastAPI</span><i /><span><Database size={13} /> MySQL</span></div>
      <div className="reading-pipeline"><div className="reading-sheet"><span className="sheet-heading"><FileText size={14} /> FOLHA-RESPOSTA</span><span className="sheet-subtitle">Modelo ilustrativo</span><div className="omr-rows">{[2, 0, 3, 1, 2].map((answer, row) => <div key={row}><small>0{row + 1}</small>{[0, 1, 2, 3].map(col => <i key={col} className={col === answer ? 'marked' : ''} />)}</div>)}</div><div className="sheet-barcode" /></div>
        <span className="reading-connector"><ArrowRight size={18} /></span><div className="reading-stages"><div><ScanLine size={19} /><span><strong>Leitura OMR</strong><small>Marcações + código de barras</small></span></div><ArrowDown size={15} /><div><ShieldCheck size={19} /><span><strong>Correção e validação</strong><small>Revisão por lote</small></span></div><ArrowDown size={15} /><div><Webhook size={19} /><span><strong>Integração KeepEdu</strong><small>Avaliações + frequência</small></span></div></div>
      </div><div className="reading-footer mono"><span>Painel</span><span>Kanban</span><span>Histórico</span></div>
    </div>}
    {kind === 'leads' && <div className="mini-leads"><div className="mini-node"><MessageCircle size={20} /><span>Novo contato</span></div><span className="mini-line" /><div className="mini-node central-node"><GitBranch size={20} /><span>Identificar intenção</span></div><div className="branch-lines" /><div className="mini-stack"><span><i /> Comercial</span><span><i /> Financeiro</span><span><i /> Suporte</span></div></div>}
    {kind === 'requests' && <div className="mini-requests"><div className="mini-form"><span><FileText size={15} /> Nova solicitação</span><i /><i /><div><Check size={11} /> Dados validados</div></div><div className="visual-link"><ArrowRight size={17} /><small>Apps Script</small></div><div className="mini-stack"><span><Table2 size={15} /> Registro</span><span><Mail size={15} /> Notificação</span></div></div>}
    {kind === 'access' && <div className="mini-access"><div className="mini-node"><Table2 size={21} /><span>Consultar RA</span></div><span className="mini-line" /><div className="mini-node central-node"><ShieldCheck size={23} /><span>Validar acesso</span></div><span className="mini-line" /><div className="mini-node"><GraduationCap size={23} /><span>Bernoulli</span></div><span className="mini-result"><Check size={12} /> Resultado registrado</span></div>}
    {kind === 'orchestrator' && <div className="mini-orchestrator"><span className="source-node">TOTVS <small>fonte principal</small></span><ArrowDown size={17} /><div className="orchestrator-hub"><Webhook size={19} /> Orquestrador <span>fila + logs</span></div><div className="system-row">{['Google', 'KeepEdu', 'Bernoulli', 'Rubeus'].map(x => <span key={x}>{x}</span>)}</div></div>}
    <span className="illustration-note">Demonstração visual</span>
  </div>
}
