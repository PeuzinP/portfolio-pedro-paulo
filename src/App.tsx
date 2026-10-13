import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowDown, ArrowRight, ArrowUpRight, Braces, BriefcaseBusiness, Check, ChevronUp, Code2, Database, FileDown, Github, GraduationCap, Linkedin, Mail, MapPin, Menu, MessageCircle, Network, Terminal, Workflow, X } from 'lucide-react'
import { projects, siteConfig, skills } from './data/portfolio'
import type { Project } from './data/portfolio'
import FlowDiagram from './components/FlowDiagram'
import ProjectVisual from './components/ProjectVisual'
import ProjectDialog from './components/ProjectDialog'
import AutomationDemo from './components/AutomationDemo'

const navigation = [{ id: 'inicio', label: 'Início' }, { id: 'sobre', label: 'Sobre' }, { id: 'projetos', label: 'Projetos' }, { id: 'competencias', label: 'Competências' }, { id: 'contato', label: 'Contato' }]
const filters = ['Todos', 'Automação', 'Integrações', 'Desenvolvimento'] as const
const skillIcons = [Workflow, Code2, Database, Network, Terminal]

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={{ opacity: 0, y: reduced ? 0 : 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: reduced ? 0 : .5 }}>{children}</motion.div>
}

function Header() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('inicio')
  const toggle = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('main > section[id]')]
    const update = () => {
      const current = sections.filter(section => section.getBoundingClientRect().top < window.innerHeight * .4).at(-1)
      if (current) setActive(current.id === 'demonstracao' ? 'projetos' : current.id)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus() } }
    const outside = (event: PointerEvent) => { if (open && !header.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('keydown', dismiss)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', outside) }
  }, [open])
  return <header className="site-header" ref={header}><div className="container header-inner"><a className="brand" href="#inicio" aria-label="Pedro Paulo, início" onClick={() => setOpen(false)}><span className="brand-symbol">p<span>p</span><i /></span><span>Pedro Paulo<span className="brand-dot">.</span></span></a>
    <button className="mobile-toggle icon-button" ref={toggle} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? <X size={23} /> : <Menu size={23} />}</button>
    <nav id="main-navigation" className={open ? 'nav-open' : ''} aria-label="Navegação principal">{navigation.map(item => <a key={item.id} href={`#${item.id}`} className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'location' : undefined} onClick={() => setOpen(false)}>{item.label}{item.id === 'contato' && <ArrowUpRight size={14} />}</a>)}</nav>
  </div></header>
}

function ContactLinks() {
  const c = siteConfig.contacts
  const safeUrl = (url: string) => { try { return new URL(url).protocol === 'https:' ? url : '' } catch { return url.startsWith('/') && !url.startsWith('//') ? url : '' } }
  const links = [
    { label: 'E-mail', href: c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) ? `mailto:${c.email}` : '', icon: Mail },
    { label: 'LinkedIn', href: safeUrl(c.linkedin), icon: Linkedin },
    { label: 'GitHub', href: safeUrl(c.github), icon: Github },
    { label: 'WhatsApp', href: /^\+?[\d\s()-]{10,20}$/.test(c.whatsapp) ? `https://wa.me/${c.whatsapp.replace(/\D/g, '')}` : '', icon: MessageCircle },
    { label: 'Currículo', href: safeUrl(c.resume), icon: FileDown },
  ].filter(link => link.href)
  return links.length ? <div className="contact-links">{links.map(link => <a key={link.label} className="button button-secondary" href={link.href} target={link.href.startsWith('https:') ? '_blank' : undefined} rel={link.href.startsWith('https:') ? 'noopener noreferrer' : undefined}><link.icon size={18} />{link.label}<ArrowUpRight size={16} /></a>)}</div> : <p className="contact-pending"><span className="status-dot" /> Canais de contato disponíveis em breve.</p>
}

export default function App() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todos')
  const [project, setProject] = useState<Project | null>(null)
  const reduced = useReducedMotion()
  const hero = useRef<HTMLElement>(null)
  const shownProjects = projects.filter(item => filter === 'Todos' || item.category === filter)
  const headlineWords = siteConfig.headline.replace(/\.$/, '').split(' ')
  useEffect(() => {
    if (reduced || !window.matchMedia('(min-width: 900px)').matches) return
    let raf = 0
    const update = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => hero.current?.style.setProperty('--decor-y', `${Math.min(window.scrollY * .035, 22)}px`)) }
    window.addEventListener('scroll', update, { passive: true })
    return () => { window.removeEventListener('scroll', update); cancelAnimationFrame(raf) }
  }, [reduced])
  const entrance = (delay: number) => ({ initial: { opacity: 0, y: reduced ? 0 : 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduced ? 0 : .65, delay: reduced ? 0 : delay } })
  return <><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><Header /><main id="conteudo">
    <section id="inicio" className="hero" ref={hero}><div className="hero-decoration" aria-hidden="true" /><div className="container hero-grid"><div className="hero-copy">
      <motion.div {...entrance(.05)} className="hero-availability"><span className="status-dot" /> TECNOLOGIA COM PROPÓSITO <span className="availability-line" /></motion.div>
      <motion.p {...entrance(.12)} className="hero-position">{siteConfig.positioning}</motion.p>
      <motion.h1 {...entrance(.2)}>{headlineWords.slice(0, -2).join(' ')} <span>{headlineWords.slice(-2).join(' ')}<span className="title-dot">.</span></span></motion.h1>
      <motion.p {...entrance(.28)} className="hero-description">{siteConfig.description}</motion.p>
      <motion.div {...entrance(.36)} className="hero-buttons"><a href="#projetos" className="button button-primary">Conheça meus projetos <ArrowUpRight size={18} /></a><a href="#contato" className="button button-quiet">Vamos conversar <ArrowRight size={17} /></a></motion.div>
      <motion.div {...entrance(.43)} className="hero-location"><MapPin size={14} /><span>{siteConfig.location}</span><i /><span>Conectando tecnologia e processos</span></motion.div>
    </div><motion.div {...entrance(.3)} className="hero-diagram"><div className="diagram-overline"><span className="mono">01 / A LÓGICA POR TRÁS</span><span className="little-cross">+</span></div><FlowDiagram /><div className="diagram-under"><span className="mono"><span className="code-brace">{'{ }'}</span> Menos tarefas repetitivas. Mais possibilidades.</span></div></motion.div></div>
      <div className="container hero-bottom"><a href="#sobre"><ArrowDown size={16} /> Explore as conexões</a><span className="mono">PESSOAS. PROCESSOS. TECNOLOGIA.</span></div>
    </section>
    <div className="expertise-strip"><div className="container">{[{ icon: Workflow, text: 'Automação de processos' }, { icon: Braces, text: 'Integração de sistemas' }, { icon: Network, text: 'CRM & jornada do cliente' }, { icon: Code2, text: 'Soluções web' }].map(item => <span key={item.text}><item.icon size={19} />{item.text}</span>)}</div></div>
    <section id="sobre" className="section container"><Reveal className="about-grid"><div><p className="eyebrow"><span>01</span> SOBRE MIM</p><h2 className="section-title">Antes do código,<br />entender o <span>processo.</span></h2><p className="about-lead">Tecnologia faz sentido quando<br className="desktop-break" /> resolve uma necessidade real.</p><div className="about-signature"><span className="signature-line" /><span className="mono">Pedro Paulo / Teresina, PI</span></div></div><div className="about-story"><p>Minha trajetória une suporte tecnológico, desenvolvimento e automação. Como <strong>Assistente de Tecnologia e Suporte</strong>, atuo em automações e integrações que aproximam as necessidades da operação das possibilidades da tecnologia.</p><p>Entre CRM, jornada do cliente, funil comercial e qualificação de leads, aprendi a olhar além de uma tarefa isolada. Entendo o contexto, organizo as informações e transformo a necessidade em uma solução técnica.</p><div className="education"><GraduationCap size={22} /><div><strong>Análise e Desenvolvimento de Sistemas</strong><span>Formação superior</span><strong>Engenharia de Software</strong><span>Pós-graduação em andamento</span></div></div><div className="collaboration"><BriefcaseBusiness size={17} /><span>Em colaboração com Comercial, Marketing, Financeiro e Tecnologia.</span></div></div></Reveal></section>
    <section id="projetos" className="section projects-section"><div className="container"><Reveal><div className="section-heading"><div><p className="eyebrow"><span>02</span> PROJETOS EM DESTAQUE</p><h2 className="section-title">Conexões que viram <span>soluções.</span></h2></div><p className="section-description">Do atendimento à operação.<br />Explore o problema, a lógica e a solução.</p></div><div className="project-filters" role="group" aria-label="Filtrar projetos por categoria">{filters.map(item => <button type="button" key={item} className={filter === item ? 'selected' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}{item === 'Todos' && <span>04</span>}</button>)}<span className="project-count mono" aria-live="polite">{shownProjects.length} {shownProjects.length === 1 ? 'projeto' : 'projetos'}</span></div></Reveal>
      <motion.div layout={!reduced} className="projects-grid"><AnimatePresence mode="popLayout">{shownProjects.map(item => <motion.article layout={!reduced} key={item.id} className="project-card" initial={{ opacity: 0, y: reduced ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: reduced ? 1 : .97 }} transition={{ duration: reduced ? 0 : .25 }}><ProjectVisual kind={item.kind} /><div className="project-card-body"><div className="project-meta"><span>{item.category}</span>{item.kind === 'orchestrator' ? <span className="planning-label"><i /> Em planejamento</span> : <span className="mono">/{item.number}</span>}</div><h3>{item.title}</h3><p>{item.description}</p><div className="tag-list">{item.technologies.slice(0, 4).map(tech => <span key={tech}>{tech}</span>)}{item.technologies.length > 4 && <span aria-label={`${item.technologies.length - 4} outras tecnologias nos detalhes`}>+{item.technologies.length - 4}</span>}</div><button type="button" className="explore-project" onClick={() => setProject(item)}>Explorar projeto <span><ArrowUpRight size={20} /></span></button></div></motion.article>)}</AnimatePresence></motion.div>
    </div></section>
    <AutomationDemo />
    <section id="competencias" className="section skills-section"><div className="container"><Reveal><div className="section-heading"><div><p className="eyebrow"><span>04</span> COMPETÊNCIAS</p><h2 className="section-title">As ferramentas mudam.<br />O foco é <span>resolver.</span></h2></div><p className="section-description">Tecnologias organizadas pelo que permitem construir, conectar e melhorar.</p></div><div className="skills-list">{skills.map((skill, i) => { const Icon = skillIcons[i]; return <div className="skill-row" key={skill.title}><span className="skill-index mono">0{i + 1}</span><div className="skill-title"><Icon size={22} /><div><h3>{skill.title}</h3><p>{skill.description}</p></div></div><div className="skill-tags">{skill.items.map(item => <span key={item}>{item}</span>)}</div></div> })}</div></Reveal></div></section>
    <section id="contato" className="section container contact-section"><Reveal><div className="contact-top"><p className="eyebrow"><span>05</span> PRÓXIMA CONEXÃO</p><span className="contact-location"><MapPin size={14} /> Teresina — PI</span></div><div className="contact-content"><div><h2>Vamos conectar tecnologia à sua <span>próxima solução?</span></h2><p>Estou aberto a oportunidades em automação, integrações, desenvolvimento e melhoria de processos.</p><ContactLinks /></div><div className="contact-art" aria-hidden="true"><div className="contact-orbit" /><span className="contact-icon"><ArrowUpRight size={59} strokeWidth={1.3} /></span><span className="orbit-point" /><span className="contact-art-label mono">a próxima conexão<br />começa com uma conversa.</span></div></div><div className="contact-bottom"><span><Check size={15} /> Processos mais claros. Sistemas mais conectados.</span><a href="#inicio">Voltar ao início <ChevronUp size={16} /></a></div></Reveal></section>
  </main><footer className="site-footer"><div className="container"><a className="footer-name" href="#inicio">Pedro Paulo<span>.</span></a><p>Conectando sistemas, automatizando processos.</p><span className="mono">Feito com intenção e código.</span></div></footer><AnimatePresence>{project && <ProjectDialog key={project.id} project={project} onClose={() => setProject(null)} />}</AnimatePresence></>
}
