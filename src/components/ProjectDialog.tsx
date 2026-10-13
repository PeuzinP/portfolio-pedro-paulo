import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowDown, ArrowUpRight, Lightbulb, X } from 'lucide-react'
import type { Project } from '../data/portfolio'

export default function ProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    const dialog = ref.current!
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus() }
  }, [])
  return <motion.dialog ref={ref} className="project-dialog" aria-labelledby="project-detail-title" initial={{ opacity: 0, y: reduced ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 16 }} transition={{ duration: reduced ? 0 : .22 }} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="dialog-inner"><div className="dialog-top"><span className="eyebrow">PROJETO {project.number} / {project.category}</span><button autoFocus type="button" className="icon-button" onClick={onClose} aria-label="Fechar detalhes do projeto"><X size={22} /></button></div>
      <div className="dialog-badges"><span className={`project-status ${project.kind === 'orchestrator' ? 'planned' : ''}`}><i />{project.status}</span>{project.featured && <span className="featured-label"><i /> Maior projeto</span>}</div>
      <h2 id="project-detail-title">{project.title}</h2><p className="dialog-intro">{project.shortTitle}</p>
      <div className="case-grid"><div><h3>01 / Contexto</h3><p>{project.context}</p></div><div><h3>02 / Problema</h3><p>{project.problem}</p></div></div>
      <div className="case-solution"><h3>03 / Solução{project.kind === 'orchestrator' ? ' proposta' : ''}</h3><p>{project.solution}</p></div>
      {project.highlights && <div className="case-highlights">{project.highlights.map(item => <div key={item.title}><h4>{item.title}</h4><p>{item.description}</p></div>)}</div>}
      <h3>04 / Fluxo</h3><ol className="case-flow">{project.flow.map((step, i) => <li key={step}><span className="mono">0{i + 1}</span>{step}{i < project.flow.length - 1 && <ArrowDown size={14} />}</li>)}</ol>
      <h3>05 / Tecnologias e conceitos</h3><div className="tag-list">{project.technologies.map(tech => <span key={tech}>{tech}</span>)}</div>
      <div className="benefit-box"><Lightbulb size={22} /><div><h3>06 / Benefício operacional{project.kind === 'orchestrator' ? ' esperado' : ''}</h3><p>{project.benefit}</p></div></div>
      <a href="#contato" className="text-link" onClick={onClose}>Vamos conversar sobre soluções <ArrowUpRight size={17} /></a>
    </div>
  </motion.dialog>
}
