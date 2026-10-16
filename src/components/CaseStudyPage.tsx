import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Lightbulb,
  Play,
  Workflow,
} from "lucide-react";
import { projects, type Project } from "../data/portfolio";
import { caseStudies } from "../data/caseStudies";
import ExperienceReviewDemo from "./ExperienceReviewDemo";
import AutomationDemo from "./AutomationDemo";

function Architecture({
  items,
}: {
  items: { label: string; detail: string }[];
}) {
  return (
    <div className="case-architecture" role="region" tabIndex={0} aria-label="Arquitetura do projeto — use as setas para explorar">
      {items.map((item, index) => (
        <div className="case-architecture-item" key={item.label}>
          <span className="mono">0{index + 1}</span>
          <Code2 size={18} aria-hidden="true" />
          <strong>{item.label}</strong>
          <small>{item.detail}</small>
          {index < items.length - 1 && (
            <ArrowRight
              className="case-architecture-arrow"
              size={16}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ProjectCase({ project }: { project: Project }) {
  const reduced = useReducedMotion();
  const detail = caseStudies[project.id];
  const planned = project.status === "Em planejamento";
  const expected = planned || Boolean(project.expectedBenefits);
  const intro = {
    initial: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.45 },
  };
  return (
    <main id="conteudo" className="case-page" tabIndex={-1}>
      <section className="case-hero">
        <div className="container">
          <motion.div {...intro}>
            <a className="case-back" href="/#projetos" data-section="projetos">
              <ArrowLeft size={17} />
              Voltar aos projetos
            </a>
            <p className="eyebrow">
              <span>{project.number}</span> ESTUDO DE CASO / {project.category}
            </p>
            <h1>{project.title}</h1>
            <p className="case-lead">{project.shortTitle}</p>
            <span className={`project-status ${planned ? "planned" : project.status === "Em desenvolvimento e homologação" ? "development" : ""}`}>
              <i aria-hidden="true" />{project.status}
            </span>
            <div className="case-tech-summary">
              {project.technologies.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      <section className="case-section container">
        <div className="case-section-heading">
          <span className="mono">01 / VISÃO GERAL</span>
          <h2>
            Contexto e <span>propósito.</span>
          </h2>
        </div>
        <p className="case-body-copy">{project.context}</p>
        {project.validation && (
          <div className={`case-validation${project.status === "Em aplicação" ? " case-validation-applied" : ""}`}>
            <h3>Estágio do projeto</h3>
            <p className="case-body-copy">{project.validation.note}</p>
            {project.validation.confirmedStages.length > 0 && (
              <>
                <h4>Etapas com implementação e validação confirmadas</h4>
                <ul>{project.validation.confirmedStages.map((stage) => <li key={stage}>{stage}</li>)}</ul>
              </>
            )}
          </div>
        )}
      </section>
      <section className="case-section case-split container">
        <div>
          <span className="mono">02 / O DESAFIO</span>
          <h2>{project.problem}</h2>
        </div>
        <div>
          <span className="mono">03 / {planned ? "SOLUÇÃO PROPOSTA" : "A SOLUÇÃO"}</span>
          <p className="case-body-copy">{project.solution}</p>
          {project.contribution && (
            <div className="case-contribution">
              <h3>Minha atuação</h3>
              <p className="case-body-copy">{project.contribution}</p>
            </div>
          )}
        </div>
      </section>
      {(project.highlights || project.scope) && (
        <section className="case-section container" aria-label="Detalhes da implementação">
          {project.highlights && (
            <div className="case-highlights">
              {project.highlights.map((item) => (
                <div key={item.title}><h3>{item.title}</h3><p className="case-body-copy">{item.description}</p></div>
              ))}
            </div>
          )}
          {project.scope && (
            <div className="case-scope">
              <h2>Funcionalidades contempladas no escopo</h2>
              <ul>{project.scope.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}
        </section>
      )}
      {detail && (
        <section className="case-section case-architecture-section">
          <div className="container">
            <div className="case-section-heading">
              <span className="mono">04 / ARQUITETURA</span>
              <h2>
                Componentes que <span>se conectam.</span>
              </h2>
            </div>
            <Architecture items={detail.architecture} />
            <p className="case-architecture-hint">Deslize para os lados ou use as setas para explorar a arquitetura.</p>
            {detail.notes?.map((note) => (
              <p className="case-note" key={note}>
                {note}
              </p>
            ))}
          </div>
        </section>
      )}
      <section className="case-section container">
        <div className="case-section-heading">
          <span className="mono">05 / FUNCIONAMENTO</span>
          <h2>
            Do início ao <span>próximo passo.</span>
          </h2>
        </div>
        <ol className="case-steps">
          {project.flow.map((step, index) => (
            <li key={step}>
              <span className="mono">0{index + 1}</span>
              <strong>{step}</strong>
              {index < project.flow.length - 1 && (
                <ArrowRight size={17} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </section>
      <section className="case-section container case-results">
        <div>
          <span className="mono">06 / {expected ? "BENEFÍCIOS ESPERADOS" : "BENEFÍCIOS"}</span>
          <h2>
            {expected ? "Benefícios esperados para a " : "Benefícios para a "}<span>operação.</span>
          </h2>
        </div>
        <div>
          <p className="case-body-copy">{project.benefit}</p>
          {project.expectedBenefits && (
            <ul>
              {project.expectedBenefits.map((item) => (
                <li key={item}>
                  <Check size={16} />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className="case-section container">
        <div className="case-section-heading">
          <span className="mono">07 / TECNOLOGIAS</span>
          <h2>
            Base técnica <span>{planned ? "proposta." : "utilizada."}</span>
          </h2>
        </div>
        <div className="case-tech-grid">
          {project.technologies.map((tech, index) => (
            <div key={tech}>
              <span className="mono">0{index + 1}</span>
              <Workflow size={18} />
              <strong>{tech}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="case-section container case-demo">
        <div className="case-section-heading">
          <span className="mono">08 / DEMONSTRAÇÃO</span>
          <h2>
            {detail?.demonstration ? <>Explore uma <span>simulação.</span></> : <>Disponibilidade da <span>demonstração.</span></>}
          </h2>
        </div>
        {detail?.demonstration === "experience" ? (
          <ExperienceReviewDemo />
        ) : detail?.demonstration === "leads" ? (
          <AutomationDemo />
        ) : (
          <div className="case-demo-placeholder">
            <Play size={20} />
            <div>
              <strong>Demonstração indisponível neste momento</strong>
              <p>
                Esta página apresenta o fluxo documentado. Uma simulação pública
                pode ser adicionada quando houver um cenário seguro para
                publicação.
              </p>
            </div>
          </div>
        )}
      </section>
      <section className="case-cta container">
        <Lightbulb size={22} />
        <p>
          Quer conversar sobre automação, integrações ou uma solução parecida?
        </p>
        <a href="/#contato" data-section="contato">
          Entrar em contato <ArrowRight size={17} />
        </a>
      </section>
    </main>
  );
}

export default function CaseStudyPage({ projectId }: { projectId: string }) {
  const project = projects.find((item) => item.id === projectId);
  if (!project || !caseStudies[project.id])
    return (
      <main id="conteudo" className="case-not-found container" tabIndex={-1}>
        <h1>Estudo de caso não encontrado.</h1>
        <a href="/#projetos" data-section="projetos">Voltar aos projetos</a>
      </main>
    );
  return <ProjectCase project={project} />;
}
