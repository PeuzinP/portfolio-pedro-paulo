import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowDown, ArrowRight, ArrowUpRight, Braces, BriefcaseBusiness, Check, ChevronUp, Code2, Database, FileDown, Github, GraduationCap, Instagram, Linkedin, Mail, MapPin, Menu, MessageCircle, Network, Terminal, Workflow, X } from 'lucide-react'
import { projects, siteConfig, skills, technicalEducation } from './data/portfolio'
import { caseStudyHref } from './data/caseStudies'
import FlowDiagram from './components/FlowDiagram'
import ProjectVisual from './components/ProjectVisual'
import CaseStudyPage from './components/CaseStudyPage'
import AutomationDemo from './components/AutomationDemo'
import BernoulliLab from './components/BernoulliLab'
import PixelAvatar from './components/PixelAvatar'
import PortfolioStats from './components/PortfolioStats'
import WelcomeToast from './components/WelcomeToast'
import VisitPrivacy from './components/VisitPrivacy'

const navigation = [{ id: 'inicio', label: 'Início' }, { id: 'sobre', label: 'Sobre' }, { id: 'projetos', label: 'Projetos' }, { id: 'demonstracao', label: 'Laboratório' }, { id: 'competencias', label: 'Competências' }, { id: 'contato', label: 'Contato' }]
const filters = ['Todos', 'Automação', 'Integrações', 'Desenvolvimento'] as const
const skillIcons = [Workflow, Code2, Database, Network, Terminal]

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={{ opacity: 0, y: reduced ? 0 : 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: reduced ? 0 : .5 }}>{children}</motion.div>
}

function Header() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('inicio')
  const isCaseStudy = window.location.pathname.startsWith('/projetos/')
  const toggle = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('main > section[id]')]
    const update = () => {
      const current = sections.filter(section => section.getBoundingClientRect().top < window.innerHeight * .4).at(-1)
      if (current) setActive(current.id)
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
  return <header className="site-header" ref={header}><div className="container header-inner"><a className="brand" href={isCaseStudy ? '/#inicio' : '#inicio'} aria-label="Pedro Paulo, início" onClick={() => setOpen(false)}><span className="brand-symbol">p<span>p</span><i /></span><span>Pedro Paulo<span className="brand-dot">.</span></span></a>
    <button className="mobile-toggle icon-button" ref={toggle} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? <X size={23} /> : <Menu size={23} />}</button>
    <nav id="main-navigation" className={open ? 'nav-open' : ''} aria-label="Navegação principal">{navigation.map(item => <a key={item.id} href={`${isCaseStudy ? '/' : ''}#${item.id}`} className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'location' : undefined} onClick={() => setOpen(false)}>{item.label}{item.id === 'contato' && <ArrowUpRight size={14} />}</a>)}</nav>
  </div></header>
}

function ContactLinks() {
  const c = siteConfig.contacts
  const safeUrl = (url: string) => { try { return new URL(url).protocol === 'https:' ? url : '' } catch { return url.startsWith('/') && !url.startsWith('//') ? url : '' } }
  const links = [
    { label: 'E-mail', href: c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) ? `mailto:${c.email}` : '', icon: Mail },
    { label: 'LinkedIn', href: safeUrl(c.linkedin), icon: Linkedin },
    { label: 'Instagram', href: safeUrl(c.instagram), icon: Instagram },
    { label: 'GitHub', href: safeUrl(c.github), icon: Github },
    { label: 'WhatsApp', href: /^\+?[\d\s()-]{10,20}$/.test(c.whatsapp) ? `https://wa.me/${c.whatsapp.replace(/\D/g, '')}` : '', icon: MessageCircle },
    { label: 'Currículo', href: safeUrl(c.resume), icon: FileDown },
  ].filter(link => link.href)
  return links.length ? <div className="contact-links">{links.map(link => <a key={link.label} className="button button-secondary" href={link.href} target={link.href.startsWith('https:') ? '_blank' : undefined} rel={link.href.startsWith('https:') ? 'noopener noreferrer' : undefined}><link.icon size={18} />{link.label}<ArrowUpRight size={16} /></a>)}</div> : <p className="contact-pending"><span className="status-dot" /> Canais de contato disponíveis em breve.</p>
}

export default function App() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todos')
  const reduced = useReducedMotion()
  const hero = useRef<HTMLElement>(null)
  const shownProjects = projects.filter(item => filter === 'Todos' || (item.categories ?? [item.category]).includes(filter))
  const headlineWords = siteConfig.headline.replace(/\.$/, '').split(' ')
  useEffect(() => {
    if (reduced || !window.matchMedia('(min-width: 900px)').matches) return
    let raf = 0
    const update = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => hero.current?.style.setProperty('--decor-y', `${Math.min(window.scrollY * .035, 22)}px`)) }
    window.addEventListener('scroll', update, { passive: true })
    return () => { window.removeEventListener('scroll', update); cancelAnimationFrame(raf) }
  }, [reduced])
  const entrance = (delay: number) => ({ initial: { opacity: 0, y: reduced ? 0 : 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduced ? 0 : .65, delay: reduced ? 0 : delay } })
  const caseStudyId = window.location.pathname.match(/^\/projetos\/([^/]+)\/?$/)?.[1]
  if (caseStudyId) return <><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><Header /><CaseStudyPage projectId={caseStudyId} /><footer className="site-footer"><div className="container"><a className="footer-name" href="/#inicio">Pedro Paulo<span>.</span></a><p>Conectando sistemas, automatizando processos.</p></div></footer></>
  return <><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><Header /><main id="conteudo">
    <section id="inicio" className="hero" ref={hero}><div className="hero-decoration" aria-hidden="true" /><div className="container hero-grid"><div className="hero-copy">
      <motion.div {...entrance(.05)} className="hero-availability"><span className="status-dot" /> TECNOLOGIA COM PROPÓSITO <span className="availability-line" /></motion.div>
      <motion.p {...entrance(.12)} className="hero-position">{siteConfig.positioning}</motion.p>
      <motion.h1 {...entrance(.2)}>{headlineWords.slice(0, -2).join(' ')} <span>{headlineWords.slice(-2).join(' ')}<span className="title-dot">.</span></span></motion.h1>
      <motion.p {...entrance(.24)} className="hero-description"><strong>{siteConfig.introduction}</strong></motion.p>
      <motion.p {...entrance(.28)} className="hero-description">{siteConfig.description}</motion.p>
      <motion.div {...entrance(.36)} className="hero-buttons"><a href="#projetos" className="button button-primary">Conheça meus projetos <ArrowUpRight size={18} /></a><a href="#contato" className="button button-quiet">Vamos conversar <ArrowRight size={17} /></a></motion.div>
      <motion.div {...entrance(.43)} className="hero-location"><MapPin size={14} /><span>{siteConfig.location}</span><i /><span>Conectando tecnologia e processos</span></motion.div>
    </div><motion.div {...entrance(.3)} className="hero-diagram"><div className="diagram-overline"><span className="mono">01 / A LÓGICA POR TRÁS</span><span className="little-cross">+</span></div><FlowDiagram /><div className="diagram-under"><span className="mono"><span className="code-brace">{'{ }'}</span> Menos tarefas repetitivas. Mais possibilidades.</span></div></motion.div></div>
      <div className="container hero-bottom"><a href="#sobre"><ArrowDown size={16} /> Explore as conexões</a><span className="mono">PESSOAS. PROCESSOS. TECNOLOGIA.</span></div>
    </section>
    <div className="expertise-strip"><div className="container">{[{ icon: Workflow, text: 'Automação de processos' }, { icon: Braces, text: 'Integração de sistemas' }, { icon: Network, text: 'CRM & jornada do cliente' }, { icon: Code2, text: 'Soluções web' }].map(item => <span key={item.text}><item.icon size={19} />{item.text}</span>)}</div></div>
    <section id="sobre" className="section container">
      <Reveal className="about-grid">
        <div>
          <p className="eyebrow"><span>01</span> SOBRE MIM</p>
          <h2 className="section-title">Transformando processos em <span>soluções inteligentes.</span></h2>
          <p className="about-lead"><strong>Tecnologia não é apenas escrever código. É entender problemas, conectar sistemas e criar soluções que geram resultados.</strong></p>
          <div className="about-signature"><span className="signature-line" /><span className="mono">Pedro Paulo / Teresina, PI</span></div>
          <PixelAvatar />
        </div>
        <div className="about-story">
          <p>Sou um profissional de tecnologia com atuação em desenvolvimento de sistemas, automação de processos e integração de plataformas. Meu trabalho combina conhecimento técnico, pensamento analítico e visão de negócio para transformar necessidades operacionais em soluções eficientes e escaláveis.</p>
          <p>Tenho experiência com <strong>APIs REST, Webhooks, JavaScript, Python, PHP, SQL e automações</strong>, além de soluções envolvendo CRM, jornada do cliente, qualificação de leads e integração de dados.</p>
          <p>Na prática, desenvolvo fluxos automatizados, sistemas de apoio à operação e integrações que conectam diferentes plataformas, reduzem tarefas manuais e melhoram a comunicação entre equipes. Entre minhas entregas estão automações de atendimento, disparos inteligentes via WhatsApp e e-mail e ferramentas para gestão de processos internos.</p>
          <p><strong>Meu diferencial está em compreender o processo antes de desenvolver a solução</strong>, conectando tecnologia, dados e pessoas para gerar eficiência, confiabilidade e resultados reais.</p>
          <div className="education"><GraduationCap size={22} /><div><div className="technical-education"><img src={technicalEducation.symbol} width="30" height="40" alt="Símbolo do Instituto Federal" loading="lazy" /><div><strong>{technicalEducation.title}</strong><span>{technicalEducation.institution}</span><span className="education-completed">{technicalEducation.status}</span></div></div><div className="university-education"><div className="university-logo"><div className="university-symbol"><img src="/anhanguera.png" alt="Símbolo da Anhanguera" loading="lazy" /></div></div><div><strong>Análise e Desenvolvimento de Sistemas - Superior</strong><span>Anhanguera</span><span className="education-completed">Concluído</span></div></div><div className="university-education"><div className="university-logo"><div className="university-symbol"><img src="/estacio.svg" alt="Símbolo da Estácio de Sá" loading="lazy" /></div></div><div><strong>Engenharia de Software - Pós-graduação</strong><span>Estácio de Sá</span><span>Em Andamento</span></div></div></div></div>
          <div className="collaboration"><BriefcaseBusiness size={17} /><span>Em colaboração com Comercial, Marketing, Financeiro e Tecnologia.</span></div>
        </div>
      </Reveal>
    </section>
    <section id="projetos" className="section projects-section"><div className="container"><Reveal><div className="section-heading"><div><p className="eyebrow"><span>02</span> PROJETOS EM DESTAQUE</p><h2 className="section-title">Conexões que viram <span>soluções.</span></h2></div><p className="section-description">Do atendimento à operação.<br />Explore o problema, a lógica e a solução.</p></div><div className="project-filters" role="group" aria-label="Filtrar projetos por categoria">{filters.map(item => <button type="button" key={item} className={filter === item ? 'selected' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}{item === 'Todos' && <span>{String(projects.length).padStart(2, '0')}</span>}</button>)}<span className="project-count mono" aria-live="polite">{shownProjects.length} {shownProjects.length === 1 ? 'projeto' : 'projetos'}</span></div></Reveal>
      <motion.div layout={!reduced} className="projects-grid">
        <AnimatePresence mode="popLayout">{shownProjects.map(item => {
          const visibleTechnologies = item.featured || item.kind === 'experience' ? item.technologies : item.technologies.slice(0, 4)
          return <motion.article layout={!reduced} key={item.id} className={`project-card${item.featured ? ' project-card-featured' : ''}`} initial={{ opacity: 0, y: reduced ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: reduced ? 1 : .97 }} transition={{ duration: reduced ? 0 : .25 }}>
            <ProjectVisual kind={item.kind} />
            <div className="project-card-body">
              <div className={`project-meta${item.categoryLabel ? ' project-meta-stacked' : ''}`}><span>{item.categoryLabel ?? item.category}</span>{item.featured ? <span className="featured-label"><i /> Maior projeto</span> : item.status !== 'Aplicação prática' ? <span className={`planning-label${item.status === 'Em desenvolvimento e homologação' ? ' development-label' : item.status === 'Em aplicação' ? ' applied-label' : ''}`}><i /> {item.status}</span> : <span className="mono">/{item.number}</span>}</div>
              <h3>{item.title}</h3>
              {item.featured && <span className="featured-subtitle">{item.shortTitle}</span>}
              <p>{item.description}</p>
              <div className="tag-list">{visibleTechnologies.map(tech => <span key={tech}>{tech}</span>)}{item.technologies.length > visibleTechnologies.length && <span aria-label={`${item.technologies.length - visibleTechnologies.length} outras tecnologias nos detalhes`}>+{item.technologies.length - visibleTechnologies.length}</span>}</div>
              <a className="explore-project" href={caseStudyHref(item.id)}>Ver estudo de caso <span><ArrowUpRight size={20} /></span></a>
            </div>
          </motion.article>
        })}</AnimatePresence>
      </motion.div>
    </div></section>
    <AutomationDemo />
    <BernoulliLab />
    <section id="competencias" className="section skills-section"><div className="container"><Reveal><div className="section-heading"><div><p className="eyebrow"><span>04</span> COMPETÊNCIAS</p><h2 className="section-title">As ferramentas mudam.<br />O foco é <span>resolver.</span></h2></div><p className="section-description">Tecnologias organizadas pelo que permitem construir, conectar e melhorar.</p></div><div className="skills-list">{skills.map((skill, i) => { const Icon = skillIcons[i]; return <div className="skill-row" key={skill.title}><span className="skill-index mono">0{i + 1}</span><div className="skill-title"><Icon size={22} /><div><h3>{skill.title}</h3><p>{skill.description}</p></div></div><div className="skill-tags">{skill.items.map(item => <span key={item}>{item}</span>)}</div></div> })}</div></Reveal></div></section>
    <section id="contato" className="section container contact-section"><Reveal><div className="contact-top"><p className="eyebrow"><span>05</span> PRÓXIMA CONEXÃO</p><span className="contact-location"><MapPin size={14} /> Teresina — PI</span></div><div className="contact-content"><div><h2>Vamos conectar tecnologia à sua <span>próxima solução?</span></h2><p>Estou aberto a oportunidades em automação, integrações, desenvolvimento e melhoria de processos.</p><ContactLinks /></div><div className="contact-art" aria-hidden="true"><div className="contact-orbit" /><span className="contact-icon"><ArrowUpRight size={59} strokeWidth={1.3} /></span><span className="orbit-point" /><span className="contact-art-label mono">a próxima conexão<br />começa com uma conversa.</span></div></div><div className="contact-bottom"><span><Check size={15} /> Processos mais claros. Sistemas mais conectados.</span><a href="#inicio">Voltar ao início <ChevronUp size={16} /></a></div></Reveal></section>
  </main><footer className="site-footer"><PortfolioStats /><div className="container"><a className="footer-name" href="#inicio">Pedro Paulo<span>.</span></a><p>Conectando sistemas, automatizando processos.</p><span className="mono">Feito com intenção e código.</span></div><VisitPrivacy /></footer><WelcomeToast /></>
}
