# Visitas e boas-vindas

## Ativar o banco na Vercel

O frontend é React/Vite. A função Node em `api/visits.ts` atende `GET` e `POST /api/visits`. O banco é Upstash Redis persistente, acessado pelo servidor via REST; nenhuma credencial entra no bundle do navegador. Sem configuração, o site mostra **Estatísticas indisponíveis no momento**, nunca números demonstrativos.

1. Abra o [console Upstash](https://console.upstash.com/) e crie um banco Redis. Escolha uma região próxima à função Vercel. Também é possível conectar Upstash pelo [Marketplace da Vercel](https://upstash.com/docs/redis/howto/vercelintegration). Use um banco persistente e mantenha a expulsão automática de chaves (*eviction*) desativada para preservar os agregados.
2. Na área de conexão do banco, copie **REST URL** e **REST Token** com permissão de escrita. Não use o token somente leitura. [Documentação REST](https://upstash.com/docs/redis/features/restapi).
3. No projeto da Vercel, em **Settings → Environment Variables**, configure as variáveis abaixo para Production. Se usar a integração do Marketplace e receber variáveis com outro prefixo, copie os valores para os nomes exatos desta tabela. Não envie tokens pelo chat nem os coloque no Git.

| Variável | Valor |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | URL HTTPS do banco, terminando em `.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST de leitura e escrita |
| `ANALYTICS_SECRET` | Segredo aleatório com pelo menos 32 caracteres; gerar uma vez e manter entre deploys |
| `ANALYTICS_KEY_PREFIX` | Opcional. Namespace Redis estável para este portfólio |

Gere o segredo no seu terminal e copie apenas para a configuração de ambiente:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

4. A raiz do projeto Vercel deve ser a pasta que contém `package.json`, `api/` e `vercel.json`. Use preset **Vite**, build **npm run build**, saída **dist**, runtime Node.js 24 e **Fluid compute** habilitado para o handler Web Standard. A [documentação de funções Node da Vercel](https://vercel.com/docs/functions/runtimes/node-js) descreve essa exportação. Não configure um rewrite global que transforme `/api/visits` em `index.html`.
5. Faça um novo deploy após salvar as variáveis. Abra `https://SEU-DOMINIO/api/visits`: a resposta deve conter `available: true`, `views`, `uniqueVisitors`, `estimated: true` e `consentOnly: true`. Zero é válido somente quando retornado pelo banco vazio.

O namespace padrão é `portfolio:production:v1` em produção, `portfolio:preview:v1` em Preview e `portfolio:development:v1` localmente. Para outro site no mesmo banco, defina um prefixo exclusivo. Prefira bancos separados para produção e testes. Não mude o prefixo entre deploys: um prefixo novo começa uma série separada. Alterar o segredo muda os hashes de reconhecimento e pode aumentar a estimativa de únicos.

Para desenvolvimento local, copie `.env.example` para `.env.local`, preencha os três valores e rode `npm run dev`. O plugin de desenvolvimento do Vite executa **o mesmo handler** da função serverless. Não há banco fictício ou fallback em memória no site. `vite preview` serve apenas arquivos estáticos; use Vite dev ou a implantação Vercel para testar a API.

## Política de contagem e privacidade

- A medição e o reconhecimento dependem de autorização explícita. Antes de permitir ou após recusar, nenhuma visualização é enviada e nenhum identificador de reconhecimento é criado. O rodapé ainda pode consultar os totais públicos; a saudação genérica funciona normalmente.
- Cada documento carregado gera, após consentimento, **um evento aleatório em memória**. Re-renderizações, Strict Mode e troca de `#seção` não criam eventos. Atualizar a página cria outro documento e outra visualização. Retomar uma página do cache de navegação não cria um evento novo.
- O navegador autorizado mantém um UUID aleatório em `localStorage`, junto com primeira/última visita, visualizações e sessões locais. Nenhum contador local é enviado como autoridade ao servidor. A contagem local inclui acessos autorizados mesmo quando a API está indisponível; por isso pode divergir dos totais globais.
- Uma sessão segue a vida da aba por `sessionStorage`. Recarregar mantém a sessão e não repete o toast; nova aba normalmente inicia outra sessão e mantém o UUID do navegador. Abas duplicadas e sessões restauradas podem herdar `sessionStorage`, conforme o navegador. Sem armazenamento, o reconhecimento e a medição ficam desativados; a saudação pode reaparecer após recarregar.
- O toast é marcado como exibido **quando aparece**, e não ao iniciar um efeito React. Há um único store por documento. Web Locks serializa as atualizações locais entre abas. Em navegadores antigos sem Web Locks, a atualização local é de melhor esforço; o backend permanece atômico.
- A preferência vale 180 dias. Ao expirar, o reconhecimento local é apagado e uma nova escolha é solicitada. Revogar apaga o registro local, cancela requisições pendentes quando possível e impede novos envios. Uma requisição que já chegou ao servidor pode ter sido computada; agregados anteriores permanecem.
- Redis armazena um contador persistente e um HyperLogLog de hashes HMAC para estimar visitantes únicos, sem guardar uma lista de pessoas, IPs ou identificadores brutos. O HyperLogLog é probabilístico; pessoas em dispositivos diferentes, dados apagados e bots não detectados afetam a estimativa. Os números representam **acessos autorizados registrados**, não todo o tráfego nem pessoas identificadas.
- Os UUIDs de eventos são transformados em hashes e guardados por 24 horas apenas para deduplicação. O payload expira em 15 minutos. Uma repetição causada por timeout reutiliza o mesmo UUID e não incrementa de novo. Não há replay persistente de visitas antigas/offline.
- Para proteção contra abuso, somente o header de rede controlado pela Vercel alimenta um HMAC que muda a cada minuto, retido no Redis por até 120 segundos. O IP original não é salvo e não determina visitantes únicos. User-Agent é usado em memória para filtrar bots conhecidos, sem ser armazenado. A infraestrutura Vercel/Upstash pode manter seus próprios logs operacionais; essa configuração não os controla.
- Limites por minuto: 600 escritas globais, 30 por rede e 12 por UUID; 1.200 leituras globais e 120 por rede. Ajuste os limites nos scripts Lua conforme tráfego legítimo. São proteções básicas: ataques distribuídos exigem também controles de firewall/bots na Vercel.

Chaves locais: `pp:visits:consent:v1` (preferência e data), `pp:visits:browser:v1` (somente após autorização), `pp:visits:session:v1` (saudação e sessão da aba). O site oferece a mesma possibilidade de aceitar e recusar, detalhes antes da escolha e revogação no rodapé. A abordagem segue transparência e controle de preferências descritos no [guia de cookies da ANPD](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais); a configuração técnica não substitui a avaliação jurídica do controlador.

## Interface e ajustes

- `src/components/PortfolioStats.tsx`: números do backend no rodapé, animação de 1,15 segundo ao entrar na viewport, estado indisponível e dados locais do navegador.
- `src/components/WelcomeToast.tsx`: entrada após 1.250ms, duração de 6.000ms, pausa por hover/foco/aba oculta, fechamento manual e barra de progresso. Ajuste `DELAY`, `DURATION` e o tempo CSS de `welcome-countdown` em conjunto.
- `src/components/VisitPrivacy.tsx`: preferência opcional, descrição dos dados e revogação.
- `src/components/visits.css`: aparência responsiva independente do avatar; toast abaixo do cabeçalho, safe areas e botões acessíveis.
- `src/hooks/useVisits.ts` e `src/lib/visits.ts`: estado compartilhado, consentimento, sessão e envio único por documento. `useMotionPreference.ts` acompanha mudanças na preferência de movimento em tempo real.
- `server/visits.ts` valida método, origem, bot, corpo e configurações; `server/visits-store.ts` executa a deduplicação, os limites e os incrementos em scripts Lua atômicos. Segredos ficam somente no servidor.

## Validação

Mapa dos arquivos desta implementação:

| Grupo | Arquivos criados |
| --- | --- |
| Interface | `src/components/PortfolioStats.tsx`, `WelcomeToast.tsx`, `VisitPrivacy.tsx`, `visits.css` |
| Estado e hooks | `src/lib/visits.ts`, `src/hooks/useVisits.ts`, `src/hooks/useMotionPreference.ts` |
| API e contrato | `api/visits.ts`, `server/visits.ts`, `server/visits-store.ts`, `shared/visits.ts` |
| Configuração | `.env.example`, `vercel.json`, `tsconfig.server.json`, `scripts/visits-dev-plugin.ts` |
| Testes | `tests/visits.spec.ts`, `tests/server/visits.test.ts`, `scripts/check-visits-redis.ts`, `scripts/check-visits-deployment.mjs` |
| Documentação | `docs/visits.md` |

Arquivos existentes modificados: `src/App.tsx` (integração), `vite.config.ts` (API local), `package.json` e `package-lock.json` (tipos Node e comandos), `playwright.config.ts` (separação dos testes Node), `README.md` (guia). Os componentes, estilos, imagem e lógica do avatar permanecem intactos. Nenhuma dependência de runtime foi adicionada; apenas `@types/node` em desenvolvimento.

Use Node.js 24 para executar todos os scripts locais.

```powershell
npm run test:server
npm run test:e2e
npm run build
```

Os testes de servidor usam respostas controladas de transporte para verificar validação, proteção e falhas. Os testes de interface usam uma API interceptada **somente nos testes** para reproduzir primeiro acesso, recarga, retorno, duas abas simultâneas, outro navegador, indisponibilidade, armazenamento bloqueado, revogação, hover/foco, duração e larguras 320/375/768/1024/1440px. Esses testes não comprovam uma conexão real com Upstash.

Com um banco real configurado em `.env.local`:

```powershell
npm run test:redis
```

Esse script usa um namespace de teste aleatório, executa chamadas concorrentes reais, verifica deduplicação, visitantes únicos, persistência entre clientes e TTL dos agregados. Ao terminar, remove somente as chaves que ele próprio criou. Sem credenciais, informa **NOT RUN** e encerra com código 2, sem simular sucesso.

Após o deploy:

```powershell
npm run test:deployment -- https://SEU-DOMINIO.vercel.app
```

Esse smoke test consulta o endpoint real sem adicionar tráfego artificial. Complete a validação funcional no navegador:

1. Abra o site com os dados locais limpos. A saudação inicial aparece após ~1,25s e ainda não há `POST /api/visits`.
2. Clique em **Permitir**. Confira um POST no painel Network e os números reais no rodapé. Anote o UUID local (não publique esse código).
3. Recarregue: há outro POST com **novo eventId**, mesmo visitorId, uma visualização a mais e a mesma quantidade de sessões. O toast não reaparece.
4. Feche a aba e abra outra pelo endereço: aparece a mensagem de retorno, com o mesmo visitorId e outra sessão.
5. Abra em outro navegador: só após permitir ele recebe outro visitorId. Navegar pelas seções não envia POST.
6. No rodapé, use **Gerenciar autorização → Revogar autorização**. O registro local é removido; novas recargas não registram visitas.

Para repetir o primeiro acesso durante desenvolvimento, limpe as três chaves `pp:visits:*` no painel Application/Storage e recarregue. Para simular apenas uma nova sessão, limpe `pp:visits:session:v1` do sessionStorage e mantenha localStorage; depois recarregue. Não apague as chaves Redis de produção para testar o frontend.

O projeto não possui configuração de lint. O build verifica TypeScript tanto no frontend como no backend. Credenciais e uma implantação configurada são pré-requisitos para os testes de Redis real e pós-deploy; a ausência deles não deve ser relatada como teste aprovado.

## Mapa de países (outubro de 2026)

O mapa e o ranking usam **visualizações autorizadas acumuladas**, exatamente o contador `views` já mostrado no rodapé. `uniqueVisitors` continua sendo uma estimativa global por HyperLogLog, não um total de visualizações nem de sessões. Não há filtros de 7 dias, 30 dias ou 12 meses: o banco atual não conserva séries temporais para esses períodos.

O mesmo script Lua que deduplica o evento e incrementa `views` incrementa o hash `<prefix>:countries`, apenas no primeiro registro daquele evento. GET e POST retornam um snapshot atômico com `countries`, `unknownViews` e `period: "all"`. A soma dos países mais `unknownViews` é igual a `views`. Registros anteriores a esta mudança não permitem reconstruir país: entram em **Localização não identificada**. Não expire nem apague o hash de países isoladamente se quiser preservar a série.

O país vem somente de `x-vercel-ip-country` quando `VERCEL=1`, usando a geolocalização da infraestrutura Vercel: https://vercel.com/docs/headers/request-headers#x-vercel-ip-country . Nenhum país é aceito do payload do navegador. Fora da Vercel, ou sem o cabeçalho, a localização permanece não identificada. Não há GPS, consulta externa por IP, armazenamento de IP para geografia ou exposição de localização individual. A política de consentimento existente permanece aplicada antes de qualquer registro.

**Configuração externa:** manter `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` e `ANALYTICS_SECRET` no servidor Vercel e fazer novo deploy para ativar a nova agregação. Não é necessária uma chave de API de mapas nem um novo serviço de analytics. Não altere o namespace Redis existente. O ambiente local não emula país por cabeçalhos do cliente. Sem credenciais, a interface mostra indisponibilidade e permite tentar novamente; não usa dados simulados. A ativação e a conexão com Redis real precisam ser verificadas no ambiente implantado.

Os arquivos geográficos são servidos localmente em `public/geo/countries.json` e carregados junto com o componente somente ao aproximar a seção da viewport. A origem e a regeneração estão em `public/geo/README.md`. A projeção é equiretangular; limites são geometrias reais simplificadas. O ranking permite selecionar também territórios pequenos. Não há listener de roda do mouse nem captura da rolagem na visão mundial; quando ampliado, o arraste por toque fica restrito ao mapa. Os controles e países aceitam teclado, Enter/Espaço selecionam, setas movem a região ampliada e Esc restaura. A preferência de movimento reduzido desativa a interpolação de zoom.

O link de visualização **Currículo** nos contatos mantém `/curriculo-pedro-paulo.pdf`, agora com `target="_blank"`, `rel="noopener noreferrer"` e nome acessível indicando a nova aba. O botão de download da página de recrutamento permanece separado. O projeto não configurava cabeçalho de download forçado; preferências do navegador ainda podem determinar como PDFs são abertos.

## Estados brasileiros ao explorar o mapa

Selecione o Brasil no mapa ou use **Explorar estados do Brasil**. Passe o mouse sobre uma unidade da federação para exibir seu nome e sigla em um tooltip junto ao ponteiro; a descrição abaixo do mapa também informa as visualizações registradas e a participação nos acessos do Brasil. Clicar/tocar ou usar Enter/Espaço seleciona o estado e amplia sua região. A lista **Explorar um estado** torna acessíveis também estados pequenos e o Distrito Federal. **Ver todo o Brasil**, **Visão mundial** e Esc permitem retornar.

A camada usa as 27 geometrias oficiais simplificadas da API de Malhas do IBGE, armazenadas em `public/geo/brazil-states.json` (~79 KB) e carregadas somente após selecionar o Brasil. O ranking de países continua disponível. Limites e nomes dos estados não dependem de analytics configurado; a seção mantém o tratamento existente de indisponibilidade da fonte.

Novas visualizações autorizadas com país `BR` e um `x-vercel-ip-country-region` válido incrementam o hash Redis `<prefix>:brazil-states`, no mesmo script Lua e com a mesma deduplicação das visualizações globais. Apenas siglas oficiais brasileiras são aceitas, somente da infraestrutura Vercel. O navegador não envia estado como autoridade. Os campos públicos são `brazilStates` e `unknownBrazilStateViews`; a soma deles corresponde às visualizações do país Brasil. O percentual estadual usa esse total brasileiro, explicitamente identificado no tooltip.

Acessos brasileiros anteriores à ativação ou sem região válida ficam em **Estado não identificado**, sem atribuição fictícia. Se a API implantada ainda não enviar os campos novos, a interface mostra os nomes dos estados e informa **Contagem por estado ainda indisponível**, sem supor zero. A localização é aproximada pela rede, pode ser afetada por VPN e não equivale a GPS. Municípios não são coletados nem exibidos nesta alteração.

Não é necessária nova credencial: fazer novo deploy na Vercel mantendo o banco, namespace e segredos existentes ativa a agregação estadual para novos eventos. Os testes locais usam respostas controladas; a verificação com Redis real continua dependendo das credenciais externas.
