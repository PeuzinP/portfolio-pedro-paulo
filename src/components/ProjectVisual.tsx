import { ArrowDown, ArrowRight, Check, FileText, GitBranch, GraduationCap, Mail, MessageCircle, ShieldCheck, Table2, Webhook } from 'lucide-react'
import type { Project } from '../data/portfolio'

export default function ProjectVisual({ kind }: { kind: Project['kind'] }) {
  return <div className={`project-visual visual-${kind}`} aria-hidden="true">
    <span className="visual-caption mono">{kind === 'orchestrator' ? 'ARQUITETURA CONCEITUAL' : 'FLUXO ILUSTRATIVO'}</span>
    {kind === 'leads' && <div className="mini-leads"><div className="mini-node"><MessageCircle size={20} /><span>Novo contato</span></div><span className="mini-line" /><div className="mini-node central-node"><GitBranch size={20} /><span>Identificar intenção</span></div><div className="branch-lines" /><div className="mini-stack"><span><i /> Comercial</span><span><i /> Financeiro</span><span><i /> Suporte</span></div></div>}
    {kind === 'requests' && <div className="mini-requests"><div className="mini-form"><span><FileText size={15} /> Nova solicitação</span><i /><i /><div><Check size={11} /> Dados validados</div></div><div className="visual-link"><ArrowRight size={17} /><small>Apps Script</small></div><div className="mini-stack"><span><Table2 size={15} /> Registro</span><span><Mail size={15} /> Notificação</span></div></div>}
    {kind === 'access' && <div className="mini-access"><div className="mini-node"><Table2 size={21} /><span>Consultar RA</span></div><span className="mini-line" /><div className="mini-node central-node"><ShieldCheck size={23} /><span>Validar acesso</span></div><span className="mini-line" /><div className="mini-node"><GraduationCap size={23} /><span>Bernoulli</span></div><span className="mini-result"><Check size={12} /> Resultado registrado</span></div>}
    {kind === 'orchestrator' && <div className="mini-orchestrator"><span className="source-node">TOTVS <small>fonte principal</small></span><ArrowDown size={17} /><div className="orchestrator-hub"><Webhook size={19} /> Orquestrador <span>fila + logs</span></div><div className="system-row">{['Google', 'KeepEdu', 'Bernoulli', 'Rubeus'].map(x => <span key={x}>{x}</span>)}</div></div>}
    <span className="illustration-note">Demonstração visual</span>
  </div>
}
