export type LeadIntent = 'Matrícula' | 'Financeiro' | 'Suporte'
export type ServiceWindow = 'open' | 'closed'
export type LeadStepId = 'contact' | 'intent' | 'hours' | 'team' | 'forward' | 'collect' | 'return'
export type LeadLog = { level: 'INFO' | 'PROCESS' | 'SUCCESS' | 'ROUTE'; message: string }
export type LeadStep = { id: LeadStepId; message: string; log: LeadLog }

export const leadScenarios: Record<LeadIntent, { team: string; qualification: string }> = {
  Matrícula: { team: 'Comercial', qualification: 'Interesse em matrícula identificado.' },
  Financeiro: { team: 'Financeiro', qualification: 'Solicitação financeira identificada.' },
  Suporte: { team: 'Suporte', qualification: 'Problema de acesso identificado.' },
}

export function createLeadSimulation(intent: LeadIntent, window: ServiceWindow): LeadStep[] {
  const scenario = leadScenarios[intent]
  const common: LeadStep[] = [
    { id: 'contact', message: 'Solicitação de demonstração recebida.', log: { level: 'INFO', message: 'Solicitação recebida (dados fictícios).' } },
    { id: 'intent', message: scenario.qualification, log: { level: 'PROCESS', message: `Classificando intenção: ${intent}.` } },
    { id: 'hours', message: window === 'open' ? 'Horário comercial disponível.' : 'Fora do horário comercial.', log: { level: 'SUCCESS', message: window === 'open' ? 'Disponibilidade comercial confirmada.' : 'Expediente encerrado; aplicar coleta segura.' } },
  ]
  return window === 'open'
    ? [...common, { id: 'team', message: `Destino definido: ${scenario.team}.`, log: { level: 'ROUTE', message: `Encaminhamento simulado para ${scenario.team}.` } }, { id: 'forward', message: 'Contexto preparado para a equipe.', log: { level: 'SUCCESS', message: 'Resultado: encaminhamento concluído.' } }]
    : [...common, { id: 'collect', message: 'Dados fictícios preparados para retorno.', log: { level: 'PROCESS', message: 'Coleta local simulada; nenhuma integração externa acionada.' } }, { id: 'return', message: `Registro criado para retorno de ${scenario.team}.`, log: { level: 'ROUTE', message: `Resultado: contato registrado para retorno do time ${scenario.team}.` } }]
}
