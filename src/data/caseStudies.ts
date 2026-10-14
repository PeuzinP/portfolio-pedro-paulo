import type { Project } from './portfolio'

export type CaseStudy = {
  architecture: { label: string; detail: string }[]
  demonstration?: 'experience' | 'leads'
  notes?: string[]
}

export const caseStudies: Partial<Record<Project['id'], CaseStudy>> = {
  'reading-keepedu': {
    architecture: [
      { label: 'Folhas-resposta', detail: 'Lotes recebidos para processamento.' },
      { label: 'React / Vite', detail: 'Painel, Kanban, revisão e validação.' },
      { label: 'FastAPI', detail: 'Regras, processamento OMR e integração.' },
      { label: 'KeepEdu', detail: 'Avaliações, alunos e frequência.' },
      { label: 'MySQL', detail: 'Persistência quando habilitada.' },
    ],
  },
  'avaliacoes-experiencia': {
    architecture: [
      { label: 'Base de colaboradores', detail: 'Dados e datas do ciclo.' },
      { label: 'Google Sheets', detail: 'Controle operacional e status.' },
      { label: 'Apps Script', detail: 'Regras, prazos e automações.' },
      { label: 'Forms e Gmail', detail: 'Coleta de respostas e notificações.' },
      { label: 'Diretoria e RH', detail: 'Ciência, decisão e acompanhamento.' },
    ],
    demonstration: 'experience',
  },
  'atendimento-leads': {
    architecture: [
      { label: 'Contato', detail: 'Entrada do atendimento.' },
      { label: 'Blip', detail: 'Fluxo e identificação de intenção.' },
      { label: 'Regras de horário', detail: 'Encaminhamento ou coleta.' },
      { label: 'CRM / planilha', detail: 'Registro para acompanhamento.' },
      { label: 'Equipe responsável', detail: 'Próximo passo da jornada.' },
    ],
    demonstration: 'leads',
  },
  'solicitacoes-cancelamento': {
    architecture: [
      { label: 'Formulário web', detail: 'Entrada padronizada da solicitação.' },
      { label: 'Apps Script', detail: 'Validações e regras de negócio.' },
      { label: 'Google Sheets', detail: 'Registro e acompanhamento.' },
      { label: 'E-mail', detail: 'Encaminhamento das informações.' },
    ],
  },
  'acessos-educacionais': {
    architecture: [
      { label: 'Google Sheets', detail: 'Leitura do RA e status.' },
      { label: 'Apps Script', detail: 'Orquestra a rotina.' },
      { label: 'APIs', detail: 'Consulta e validação do estudante.' },
      { label: 'Bernoulli', detail: 'Desativação quando aplicável.' },
      { label: 'Status', detail: 'Resultado rastreável por registro.' },
    ],
  },
  'orquestrador-educacional': {
    architecture: [
      { label: 'TOTVS', detail: 'Fonte principal proposta.' },
      { label: 'Validação', detail: 'Preparação antes do envio.' },
      { label: 'Fila', detail: 'Processamento previsto.' },
      { label: 'Plataformas', detail: 'Google, KeepEdu, Bernoulli e Rubeus.' },
      { label: 'Logs', detail: 'Acompanhamento planejado.' },
    ],
    notes: ['Este é um estudo de arquitetura em planejamento; fluxos e benefícios descritos são propostos, não uma entrega em produção.'],
  },
}

export const caseStudyHref = (id: Project['id']) => `/projetos/${id}`
