export type BernoulliScenario = 'found' | 'missing' | 'ambiguous' | 'completed' | 'not-applicable' | 'invalid'
export type BernoulliStepId = 'request' | 'validate' | 'lookup' | 'decision' | 'deactivate' | 'status'
export type BernoulliEvent = { id: BernoulliStepId; level: 'INFO' | 'PROCESS' | 'SUCCESS' | 'BLOCKED' | 'ERROR'; message: string }

export const bernoulliScenarios: Record<BernoulliScenario, { label: string; description: string }> = {
  found: { label: 'Aluno encontrado', description: 'Dados fictícios válidos; desativação permitida.' },
  missing: { label: 'Aluno não encontrado', description: 'A busca não retorna estudante correspondente.' },
  ambiguous: { label: 'Mais de um resultado', description: 'Processo interrompido para evitar operação incorreta.' },
  completed: { label: 'Processo já concluído', description: 'Ação duplicada é bloqueada.' },
  'not-applicable': { label: 'Segmento não aplicável', description: 'Nenhuma desativação deve ser realizada.' },
  invalid: { label: 'Dados obrigatórios ausentes', description: 'RA ou nome fictício não foram informados.' },
}

export function runBernoulliScenario(scenario: BernoulliScenario): BernoulliEvent[] {
  const common: BernoulliEvent[] = [{ id: 'request', level: 'INFO', message: 'Solicitação fictícia de cancelamento recebida.' }]
  if (scenario === 'invalid') return [...common, { id: 'validate', level: 'ERROR', message: 'Validação falhou: RA e nome são obrigatórios.' }, { id: 'status', level: 'ERROR', message: 'Status final: erro de validação.' }]
  const validated: BernoulliEvent[] = [...common, { id: 'validate', level: 'SUCCESS', message: 'RA e nome fictícios validados.' }, { id: 'lookup', level: 'PROCESS', message: 'Consulta simulada ao Bernoulli em execução.' }]
  if (scenario === 'found') return [...validated, { id: 'decision', level: 'SUCCESS', message: 'Um aluno correspondente encontrado.' }, { id: 'deactivate', level: 'PROCESS', message: 'Desativação simulada autorizada.' }, { id: 'status', level: 'SUCCESS', message: 'Status final: acesso desativado.' }]
  const outcomes: Record<Exclude<BernoulliScenario, 'found' | 'invalid'>, BernoulliEvent> = {
    missing: { id: 'status', level: 'BLOCKED', message: 'Status final: não encontrado.' },
    ambiguous: { id: 'decision', level: 'BLOCKED', message: 'Mais de um resultado; operação interrompida.' },
    completed: { id: 'status', level: 'BLOCKED', message: 'Status final: processo já concluído; duplicidade bloqueada.' },
    'not-applicable': { id: 'decision', level: 'BLOCKED', message: 'Status final: não se aplica ao segmento informado.' },
  }
  return [...validated, outcomes[scenario]]
}
