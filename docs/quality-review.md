# Revisão do portfólio — 17/10/2026

## Situação da entrega

Correções disponíveis no código local e no build `dist`. Nenhum deploy ou push foi feito nesta conclusão. A inspeção do site público serve como referência; não comprova que a versão local já esteja publicada.

## Problemas tratados, por prioridade

1. **Navegação e carregamento:** a troca de páginas monta o destino antes de restaurar foco/rolagem; URLs limpas e âncoras legítimas são preservadas, incluindo conversão dos links antigos `/#/`. Metadados da navegação React e do HTML compartilhável usam a mesma definição. O HTML de SEO só é revelado sem JavaScript; com JavaScript, o marcador de pré-renderização é removido depois da montagem React, antes da pintura, evitando o flash sem atraso artificial.
2. **Celular e rolagem:** retiradas as alturas estimadas com `content-visibility` das seções que deslocavam os destinos das âncoras. Na entrada sem âncora, a restauração não aguarda os laboratórios carregarem para então sobrescrever a rolagem do usuário. Alvos de toque ampliados, contatos ajustados e arquitetura horizontal com indicação e acesso por teclado.
3. **Mapa, dados e acessibilidade:** pontos mantêm dimensão visual durante o zoom; o foco estadual usa contorno separado, sem a mancha branca ampliada. Tooltip limitado às bordas do mapa, ranking e seleção sincronizados, geometrias reais, estados brasileiros identificados, tentativas de recarga e estados vazios preservados. Dados não identificados continuam no total. Credenciais permanecem no servidor.
4. **Conteúdo e consistência:** estudos de caso exibem o status do projeto e os conteúdos existentes de contribuição, escopo e validação. O orquestrador continua identificado como planejamento, com solução proposta e benefícios esperados. Corrigidos textos dos laboratórios; reinicialização e movimento reduzido preservados. Link de visualização do currículo nativo em nova aba; botão separado de download mantido.

O servidor de desenvolvimento também passou a ignorar artefatos do Playwright: snapshots HTML estavam provocando recargas durante os testes. Os testes de mapa agora fecham explicitamente as boas-vindas e reposicionam o mapa antes de enviar coordenadas; o arraste móvel usa eventos reais de toque emulados. O teste de histórico foi corrigido para transmitir a posição salva ao contexto do navegador.

## Páginas e fluxos verificados

- Home, perfil do recrutador e os seis estudos de caso: Reading KeepEdu, Avaliações de Experiência, Atendimento de Leads, Solicitações de Cancelamento, Acessos Educacionais e Orquestrador Educacional.
- 40 combinações por versão: oito páginas em 360, 390, 768, 1024 e 1440 px. Site público e build final: HTTP 200 em todas, sem erros JavaScript não tratados, imagens quebradas ou transbordamento horizontal da página. Capturas em 390 e 1440 px; diagramas têm rolagem interna intencional.
- Entrada direta, recarga, títulos/descrições/canonical, links de estudos de caso, retorno a projetos/contato, voltar/avançar com posição de leitura, menu móvel, Escape, foco e link para pular ao conteúdo.
- Filtros de projetos, cenários de atendimento, avaliação de experiência de 30/90 dias, laboratório Bernoulli, reinicialização e execução com/sem movimento reduzido.
- Mapa: hover estadual em ponto geográfico conhecido, clique, seleção por ranking, teclado, toque e arraste via eventos de toque, zoom, restauração, limites de tooltip nas cinco larguras, pontos/contorno no zoom estadual, erro e nova tentativa, ausência de dados e resposta antiga sem contagem estadual.
- Currículo: nova aba, PDF acessível, portfólio preservado; destinos dos contatos conferidos contra a configuração existente.

## Evidências e reprodução

- `npm run build`: TypeScript do frontend/backend, Vite e HTML de SEO.
- `npm run test:server`: 14 testes aprovados, incluindo consistência geográfica, deduplicação e proteção dos dados.
- `node node_modules/@playwright/test/cli.js test`: 88 cenários funcionais validados. A última rodada completa aprovou 87 e revelou um problema no gesto sintético do teste móvel: o Chrome recebia pointerdown/up, mas suprimia o clique seguinte ao arraste instantâneo. O teste passou a usar `Input.synthesizeScrollGesture`, com velocidade definida e sem impulso final; o cenário restante passou em quatro repetições consecutivas. Não foi necessário alterar o mapa para contornar a emulação. Evidências: `artifacts/final-validated.json` e `artifacts/touch-verified`.
- `node node_modules/@playwright/test/cli.js test --config=playwright.production.config.ts`: 7 testes aprovados no build final. JavaScript atrasado em home/recrutador/estudo de caso, 390 e 1440 px, mais HTML legível sem JavaScript.
- `node scripts/review-portfolio.mjs http://127.0.0.1:5176 final`: auditoria responsiva do build servido com `npm run preview -- --port 5176 --strictPort`.
- Artefatos locais ignorados pelo Git: `artifacts/review-public`, `artifacts/review-final`, capturas do mapa e relatórios Playwright. São evidências de teste, não dados para alimentar a interface.

## Analytics e limites da validação

Em 17/10/2026, `GET https://pedropaulo-dev.vercel.app/api/visits` respondeu 200 e `available: true`: 91 visualizações, soma de países mais localização não identificada igual a 91; estados mais estado não identificado iguais às 10 visualizações brasileiras. É um snapshot daquele momento, não um número fixo do portfólio. Nenhum POST de teste foi enviado à produção.

O PDF público respondeu 200, `Content-Type: application/pdf` e `Content-Disposition: inline`. A preferência do navegador ainda pode provocar download.

Produção já possui analytics funcional. Para executar o Redis real localmente, faltam as credenciais locais `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` e `ANALYTICS_SECRET`, conforme [visits.md](visits.md). A verificação de gravação no Redis real não foi executada nesta revisão; backend e frontend foram testados com respostas controladas. Não é necessária chave de mapa adicional. Não há séries temporais para filtros de 7/30 dias ou 12 meses, nem agregação municipal.

Testes realizados no Chrome de desktop e emulação móvel com toque. Safari/iOS, Firefox, aparelhos físicos e avaliação completa com leitor de tela não foram executados. Destinos sociais foram conferidos no código; disponibilidade de contas e aplicativos externos não é garantida pelos testes. Não existe comando de lint no projeto.
