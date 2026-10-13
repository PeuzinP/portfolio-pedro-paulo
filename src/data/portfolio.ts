export const siteConfig = {
  name: 'Pedro Paulo',
  location: 'Teresina – PI',
  positioning: 'Automação, Integrações e Desenvolvimento',
  headline: 'Transformo processos manuais em soluções conectadas.',
  description:
    'Desenvolvo automações, integro sistemas e construo soluções web que organizam informações e tornam as operações mais eficientes. Minha atuação conecta tecnologia, processos e experiência do cliente.',
  contacts: {
    email: 'ppmendes1519@gmail.com',
    linkedin: 'https://www.linkedin.com/in/pedro-mendes-720830270/',
    github: '',
    whatsapp: '+55 (86) 98141-9738',
    resume: '',
  },
  siteUrl: 'https://portfolio-pedro-paulo-coral.vercel.app',
}

export type ProjectCategory = 'Automação' | 'Integrações' | 'Desenvolvimento'

export type Project = {
  id: string
  number: string
  title: string
  shortTitle: string
  category: ProjectCategory
  categories?: ProjectCategory[]
  categoryLabel?: string
  status: 'Em aplicação' | 'Aplicação prática' | 'Em planejamento' | 'Em desenvolvimento e homologação'
  description: string
  technologies: string[]
  context: string
  problem: string
  solution: string
  flow: string[]
  benefit: string
  kind: 'reading' | 'experience' | 'leads' | 'requests' | 'access' | 'orchestrator'
  featured?: boolean
  highlights?: { title: string; description: string }[]
  scope?: string[]
  validation?: { note: string; confirmedStages: string[] }
  contribution?: string
  expectedBenefits?: string[]
}

export const projects: Project[] = [
  {
    id: 'reading-keepedu',
    number: '01',
    title: 'Reading KeepEdu — processamento e gestão de avaliações',
    shortTitle: 'Da folha-resposta ao acompanhamento da avaliação.',
    category: 'Desenvolvimento',
    status: 'Aplicação prática',
    featured: true,
    description:
      'Aplicação web com frontend React e backend Python/FastAPI para processar cartões OMR, revisar lotes e conectar avaliações, alunos, folhas-resposta e frequência à KeepEdu.',
    technologies: ['React', 'Python', 'FastAPI', 'MySQL', 'Vite', 'APIs REST', 'zxing-cpp'],
    context:
      'O Reading KeepEdu reúne as etapas de processamento e acompanhamento de avaliações em uma aplicação com frontend e backend separados. É o maior projeto do meu portfólio, conectando desenvolvimento de interface, regras de negócio, leitura de cartões e integração com uma plataforma educacional.',
    problem:
      'Organizar o percurso entre o recebimento das folhas-resposta, a leitura das marcações, a correção e validação por lote e o envio das informações à KeepEdu, mantendo visibilidade sobre o processamento e seu histórico.',
    solution:
      'Frontend em React/Vite com painel, Kanban, histórico e telas de processamento, correção e validação por lote. O backend em Python/FastAPI processa cartões OMR (leitura óptica de marcações), utiliza zxing-cpp para ler códigos de barras e integra avaliações, alunos, folhas-resposta e frequência com a API KeepEdu. A arquitetura contempla autenticação por login KeepEdu ou SSO, sessões e persistência em MySQL quando habilitada, além de armazenamento em arquivos para desenvolvimento local.',
    flow: [
      'Recebimento das folhas-resposta e organização do lote',
      'Leitura OMR e identificação por código de barras',
      'Correção e validação do lote na interface',
      'Envio das informações pela integração KeepEdu',
      'Acompanhamento no painel, Kanban e histórico',
    ],
    benefit:
      'Reúne processamento, revisão e acompanhamento em um mesmo fluxo, com organização por lotes e integração das informações à KeepEdu. O painel, o Kanban e o histórico dão visibilidade à operação e às etapas que precisam de atenção.',
    highlights: [
      { title: 'Interface e operação', description: 'React/Vite com painel, Kanban, histórico e telas dedicadas ao processamento, à correção e à validação por lote.' },
      { title: 'Processamento e integração', description: 'API em Python/FastAPI, leitura OMR, identificação por código de barras e comunicação com a KeepEdu.' },
      { title: 'Dados e autenticação', description: 'MySQL para lotes, Kanban, histórico e sessões quando habilitado; acesso por login KeepEdu ou SSO.' },
      { title: 'Ciclo de vida dos arquivos', description: 'Uploads temporários e remoção de imagens originais e PDFs de frequência após a confirmação do envio à KeepEdu.' },
    ],
    kind: 'reading',
  },
  {
    id: 'avaliacoes-experiencia',
    number: '02',
    title: 'Automação de Avaliações de Experiência',
    shortTitle: 'Prazos, responsáveis e decisões conectados em um só fluxo.',
    category: 'Automação',
    categories: ['Automação', 'Integrações'],
    categoryLabel: 'Automação de Processos · RH · Integrações',
    status: 'Em aplicação',
    description:
      'Automação do acompanhamento de avaliações de colaboradores no período de experiência, com etapas de 30 e 90 dias, controle de prazos, formulários, notificações e encaminhamento para ciência e decisão da Diretoria.',
    technologies: ['JavaScript', 'Google Apps Script', 'Google Sheets', 'Google Forms', 'Gmail API', 'Google Drive', 'HTML', 'CSS'],
    context:
      'O processo de avaliação de experiência envolve dados dos colaboradores, datas, responsáveis e participação de diferentes áreas. O ciclo contempla avaliações de 30 e 90 dias, com a participação de avaliadores, Diretoria, Departamento Pessoal e Gente & Gestão.',
    problem:
      'O acompanhamento manual exige conferências frequentes e pode gerar atrasos, informações dispersas e dificuldade para identificar pendências.',
    solution:
      'Desenvolvimento de uma solução integrada ao ecossistema Google para organizar o ciclo das avaliações, conectando base de colaboradores, planilha de controle, formulários, notificações por e-mail e uma interface web para consulta e registro de ciência.',
    scope: [
      'Sincronização de informações da base de colaboradores com o controle das avaliações.',
      'Organização de colaborador, unidade, cargo, setor, avaliador e datas.',
      'Acompanhamento dos prazos de avaliação.',
      'Encaminhamento de formulários aos responsáveis.',
      'Coleta de respostas e identificação do respondente por e-mail verificado.',
      'Notificações por e-mail nas etapas do processo.',
      'Links individuais para visualizar a avaliação e registrar ciência.',
      'Registro de status e acompanhamento de pendências.',
      'Encaminhamento das informações para ciência e decisão da Diretoria.',
      'Separação entre ambientes de homologação e produção para apoiar os testes.',
    ],
    validation: {
      note: 'Solução em aplicação no acompanhamento das avaliações de experiência de 30 e 90 dias.',
      confirmedStages: [],
    },
    contribution:
      'Estruturei o fluxo do processo e desenvolvi automações em JavaScript e Google Apps Script, integrando planilhas, formulários, e-mails e uma interface web. Trabalhei nas regras de negócio, no controle de responsáveis e prazos e na organização das informações necessárias para acompanhar cada avaliação.',
    flow: ['Base de colaboradores', 'Controle de prazos', 'Avaliador', 'Resposta', 'Diretoria', 'DP / Gente & Gestão'],
    benefit: 'Objetivos da solução, apresentados como benefícios esperados:',
    expectedBenefits: [
      'Reduzir controles manuais e cobranças repetitivas.',
      'Centralizar informações e facilitar a consulta.',
      'Dar visibilidade aos responsáveis e às pendências.',
      'Padronizar o encaminhamento das avaliações.',
      'Melhorar a rastreabilidade das etapas.',
    ],
    kind: 'experience',
  },
  {
    id: 'atendimento-leads',
    number: '03',
    title: 'Automação de atendimento e qualificação de leads',
    shortTitle: 'Do primeiro contato à equipe certa.',
    category: 'Automação',
    status: 'Aplicação prática',
    description:
      'Fluxos de atendimento que identificam a intenção do contato, respeitam o horário comercial e conectam a conversa ao CRM.',
    technologies: ['Blip', 'JavaScript', 'APIs REST', 'Webhooks', 'CRM', 'Google Sheets'],
    context:
      'O atendimento reúne contatos com diferentes intenções e exige organização para que cada demanda chegue à equipe responsável.',
    problem:
      'Encaminhar contatos de acordo com a intenção, manter os dados organizados e preparar o retorno de quem chega fora do horário comercial.',
    solution:
      'Fluxos no Blip com identificação de intenção e direcionamento de filas, integrados ao CRM por requisições HTTP. No horário comercial, o contato segue para a equipe adequada. Fora do horário, os dados são coletados em planilha para retorno posterior. O fluxo também contempla disparos de WhatsApp e e-mail relacionados a processos abertos.',
    flow: [
      'Contato recebido',
      'Identificação da intenção',
      'Validação do horário',
      'Encaminhamento ou coleta de dados',
      'Registro e acompanhamento',
    ],
    benefit:
      'Organização do atendimento e continuidade do contato, com informações disponíveis para a equipe responsável pelo próximo passo.',
    kind: 'leads',
  },
  {
    id: 'solicitacoes-cancelamento',
    number: '04',
    title: 'Gestão de solicitações de cancelamento',
    shortTitle: 'Solicitações organizadas, do início ao fim.',
    category: 'Desenvolvimento',
    status: 'Aplicação prática',
    description:
      'Formulário web conectado a planilhas para registrar solicitações, aplicar regras de negócio e acompanhar cada etapa.',
    technologies: ['HTML', 'CSS', 'JavaScript', 'Google Apps Script', 'Google Sheets'],
    context:
      'Solicitações de cancelamento precisam reunir informações consistentes e permitir o acompanhamento das etapas do processo.',
    problem:
      'Estruturar o registro das solicitações e organizar as informações necessárias para que as áreas envolvidas acompanhem o andamento.',
    solution:
      'Formulário web integrado ao Google Apps Script para registrar dados em Google Sheets, aplicar regras de negócio, acompanhar etapas e enviar as informações por e-mail.',
    flow: [
      'Preenchimento do formulário',
      'Validação dos dados',
      'Registro na planilha',
      'Envio de informações por e-mail',
      'Acompanhamento das etapas',
    ],
    benefit:
      'Informações centralizadas e um processo mais claro para registrar, consultar e acompanhar solicitações.',
    kind: 'requests',
  },
  {
    id: 'acessos-educacionais',
    number: '05',
    title: 'Automação de acessos em plataforma educacional',
    shortTitle: 'Acessos tratados com validação e rastreabilidade.',
    category: 'Automação',
    status: 'Aplicação prática',
    description:
      'Rotina integrada à planilha para consultar estudantes por RA, validar os resultados e desativar acessos no Bernoulli.',
    technologies: ['Google Apps Script', 'APIs', 'Google Sheets'],
    context:
      'A gestão de acessos educacionais exige identificar corretamente o estudante e registrar o resultado de cada operação.',
    problem:
      'Executar desativações com critérios claros, tratando consultas sem resultado, identificações ambíguas e situações em que a ação não se aplica.',
    solution:
      'Rotina em Google Apps Script conectada à planilha e a APIs para consultar estudantes por RA, validar as respostas e executar a desativação de acesso no Bernoulli quando aplicável. Cada caso recebe um registro de status, incluindo aluno não encontrado, resultado ambíguo e situação não aplicável.',
    flow: [
      'Leitura do RA na planilha',
      'Consulta do estudante',
      'Validação do resultado',
      'Desativação quando aplicável',
      'Registro de status',
    ],
    benefit:
      'Padronização da rotina de acessos, com validações antes da ação e visibilidade sobre o resultado de cada registro.',
    kind: 'access',
  },
  {
    id: 'orquestrador-educacional',
    number: '06',
    title: 'Orquestrador de integrações educacionais',
    shortTitle: 'Uma arquitetura para conectar o ecossistema.',
    category: 'Integrações',
    status: 'Em planejamento',
    description:
      'Proposta de sincronização entre TOTVS, Google, KeepEdu, Bernoulli e Rubeus, com validação, filas e acompanhamento.',
    technologies: ['TOTVS', 'Google', 'KeepEdu', 'Bernoulli', 'Rubeus', 'APIs', 'Filas', 'Logs'],
    context:
      'Projeto em planejamento para conectar plataformas de um ecossistema educacional a partir de uma fonte principal de dados.',
    problem:
      'Planejar uma forma consistente de distribuir informações entre sistemas e acompanhar o que foi sincronizado ou precisa de atenção.',
    solution:
      'Proposta de um orquestrador entre TOTVS, Google, KeepEdu, Bernoulli e Rubeus. O conceito considera fonte principal de dados, validação antes do envio, filas de processamento, logs e acompanhamento das sincronizações. A solução está em planejamento; não representa um sistema entregue ou em produção.',
    flow: [
      'Fonte principal de dados',
      'Validação e preparação',
      'Fila de processamento',
      'Sincronização entre plataformas',
      'Logs e acompanhamento',
    ],
    benefit:
      'Benefício esperado: organizar a troca de dados entre plataformas e facilitar a identificação de pendências de sincronização.',
    kind: 'orchestrator',
  },
]

export const skills: { title: string; description: string; items: string[] }[] = [
  {
    title: 'Automação e integrações',
    description: 'Conectar plataformas e transformar regras de negócio em fluxos.',
    items: ['APIs REST', 'Webhooks', 'Google Apps Script', 'Blip', 'Rubeus'],
  },
  {
    title: 'Desenvolvimento',
    description: 'Construir interfaces, scripts e soluções para necessidades reais.',
    items: ['JavaScript', 'Python', 'PHP', 'HTML', 'CSS'],
  },
  {
    title: 'Dados',
    description: 'Organizar, consultar e preparar informações para a operação.',
    items: ['SQL', 'MySQL', 'Google Sheets', 'Excel'],
  },
  {
    title: 'Processos e relacionamento',
    description: 'Entender jornadas e automatizar processos internos de RH, com gestão de prazos, aprovações, notificações e integração entre áreas.',
    items: ['CRM', 'Jornada do cliente', 'Qualificação de leads', 'Melhoria de processos', 'Processos de RH'],
  },
  {
    title: 'Ferramentas',
    description: 'Versionar o trabalho e colaborar na construção das soluções.',
    items: ['Git', 'GitHub', 'Microsoft 365'],
  },
]

export const technicalEducation = {
  title: 'Técnico em Desenvolvimento de Sistemas',
  institution: 'IFPI — Instituto Federal do Piauí',
  status: 'Concluído',
  symbol: '/if-symbol.svg',
}
