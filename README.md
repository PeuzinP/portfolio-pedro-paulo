# Pedro Paulo — portfólio

Portfólio em português brasileiro, feito com React, TypeScript, Tailwind CSS, Motion e ícones Lucide. Site estático, sem backend. Fontes incluídas no projeto; não depende de Google Fonts ou serviços externos para funcionar.

## Executar

Requer Node.js 18.18+ e npm (preferencialmente uma versão LTS atual).

```bash
cd portfolio-pedro-paulo
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite (normalmente `http://127.0.0.1:5173`).

```bash
npm run build    # verifica TypeScript e gera dist/
npm run preview  # confere a versão de produção
npm run test:e2e # testes no Google Chrome instalado
```

## Personalizar

- **Conteúdo, projetos e competências:** `src/data/portfolio.ts`.
- **Avaliações de Experiência:** o registro `avaliacoes-experiencia` contém o status configurável, o escopo, a atuação e os benefícios esperados. Use `categories` para definir os filtros, `categoryLabel` para o texto do card e `validation.confirmedStages` somente para etapas cuja implementação e validação tenham sido confirmadas. O status atual é **Em aplicação**, para os ciclos de 30 e 90 dias. A demonstração utiliza exclusivamente dados fictícios.
- **Contatos:** preencha `siteConfig.contacts` no mesmo arquivo. Campos vazios não geram botões.
  - `email`: seu endereço de e-mail.
  - `linkedin` e `github`: URLs completas com `https://`.
  - `whatsapp`: número com DDI e DDD; a aplicação gera o link de conversa.
  - `resume`: URL HTTPS ou caminho local, como `/curriculo.pdf`. Nesse caso, adicione o arquivo real à pasta `public/`.
- **Endereço publicado:** atualize `siteConfig.siteUrl`. O build gera canonical, Open Graph e dados estruturados a partir dele.
- **Título e descrição para busca:** `index.html`. A imagem de compartilhamento está em `public/og-image.png` e seu original editável em `public/og-image.svg`.
- **Textos de apresentação e seções:** `src/App.tsx`. Cores, tipografia e responsividade em `src/styles.css`; a simulação tem seu CSS em `src/components/automation-demo.css`.

Depois de editar, execute `npm run build` novamente. Para outro provedor de hospedagem estática, publique o conteúdo de `dist/`. Não é necessário configurar API, banco de dados ou variáveis secretas. O registro do Sites em `.openai/hosting.json` identifica esta publicação específica.

## Interações e acessibilidade

O fluxo inicial apresenta cinco etapas, destaca conexões e permite pausar ou selecionar nós pelo teclado. Projetos podem ser filtrados e abertos em um diálogo nativo com foco contido, fechamento por Escape e retorno do foco ao botão de origem. O menu móvel fecha por Escape ou seleção de uma seção.

A demonstração possui seis cenários: três intenções combinadas com atendimento dentro ou fora do horário comercial. Todos os dados são fictícios, processados apenas em memória, sem requisições, armazenamento, disparos ou integração com plataformas externas. O projeto de orquestração educacional está identificado como **em planejamento**.

O projeto **Automação de Avaliações de Experiência** inclui uma segunda demonstração nos detalhes: escolha 30 ou 90 dias, simule a passagem pelas etapas e selecione os participantes para conhecer seus papéis. O painel usa um colaborador fictício e prazos relativos; os estados são ilustrativos. Essa simulação não registra avaliações, não envia e-mails e não acessa dados corporativos. Seu código fica em `src/components/ExperienceReviewDemo.tsx`.

As animações respeitam `prefers-reduced-motion`. Há foco visível, atalho para o conteúdo, navegação sem depender de hover, HTML semântico e resultado textual da simulação anunciado de forma acessível.

## Estrutura

```text
src/
  App.tsx                    Seções, navegação e filtros
  data/portfolio.ts          Configuração, contatos e conteúdo dos projetos
  components/
    FlowDiagram.tsx          Fluxo animado inicial
    ProjectVisual.tsx        Diagramas ilustrativos dos projetos
    ProjectDialog.tsx        Detalhes acessíveis dos casos
    AutomationDemo.tsx       Simulador local de atendimento
  styles.css                 Sistema visual e breakpoints
public/                      Favicon e imagem de compartilhamento
tests/portfolio.spec.ts      Testes das jornadas principais
```

Para gerar novamente a imagem de compartilhamento e as capturas de conferência, mantenha o servidor local na porta 5173 e execute `node scripts/preview-capture.mjs` (Google Chrome necessário).

## Visitas e boas-vindas

O rodapé consulta métricas persistentes em Upstash Redis por uma função Vercel. O reconhecimento e o registro de visitas são opcionais, com consentimento e revogação. O toast funciona mesmo sem API. Configure `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` e `ANALYTICS_SECRET` no servidor; sem banco, a interface mostra indisponibilidade, sem números fictícios. Veja o [guia completo de configuração, privacidade e testes](docs/visits.md). As funcionalidades são independentes do avatar.

## Avatar Pixel Art

O avatar permanece após a assinatura da coluna esquerda de Sobre mim. `src/components/PixelAvatar.tsx` organiza a composição, o parallax com springs do Motion e a observação de viewport/visibilidade da aba. `src/components/avatar/usePixelMaterialization.ts` reconstrói a imagem real em Canvas 2D, com fragmentos deslocados, pixels cianos e uma varredura. Após 2,2 segundos de tempo visível, a imagem original assume a renderização. A entrada ocorre apenas uma vez por montagem do componente; sair da viewport pausa o progresso.

A respiração usa uma cópia da imagem com máscara restrita à região dos ombros/camiseta. O rosto mantém seus pixels originais, sem piscadas artificiais. A preferência de movimento reduzido é observada também durante a navegação: exibe a imagem completa e interrompe todos os efeitos. Touch recebe apenas animação ambiente. O Canvas reduz fragmentos/partículas em telas pequenas e dispositivos com poucos recursos; o DPR é limitado a 2 e o ambiente a 30 fps (24 em dispositivos limitados).

Para ajustar:

- **Velocidade de entrada:** `AVATAR_MOTION.duration` no hook (milissegundos; padrão `2200`).
- **Interação:** `tilt` (graus, padrão `2.4`), `parallax` (pixels, padrão `3`) e `spring` (rigidez, amortecimento e massa) no mesmo objeto.
- **Densidade/desempenho:** `tiles`, `particles`, `idleFps`, `lowPowerFps` e `maxDpr`. `tiles` indica o número de fragmentos por eixo.
- **Dimensões:** regras `.pixel-avatar` em `src/components/pixel-avatar.css`, com `min()`/`clamp()` e limites fluidos de 380–460px no desktop, 300–380px no tablet e 260–320px no mobile, sempre limitados à coluna disponível.
- **Ambiente:** variáveis CSS `--avatar-breath-duration`, `--avatar-ambient-duration` e `--avatar-accent`. As amplitudes da respiração ficam em `@keyframes avatar-breathe`.
- **Imagem:** `public/pedro-pixel-avatar.png`. A máscara dos ombros foi ajustada a esse retrato; ao trocar a composição da imagem, revisar o início da máscara.

Validação: `npm run test:e2e -- tests/avatar-motion.spec.ts`. Com Vite iniciado, `node scripts/check-avatar.mjs` gera capturas e relatório em `artifacts/avatar-motion/` nas larguras 320, 375, 430, 768, 1024, 1440 e 1920px. A URL padrão é `http://127.0.0.1:5173`; pode ser alterada pela variável `AVATAR_BASE_URL`. O projeto não possui tarefa de lint; `npm run build` inclui a checagem TypeScript.

## Logos das instituições

Logos locais em `public/anhanguera.png` e `public/estacio.svg`, exibidas apenas para identificar as formações.
Fontes: [Anhanguera / Brandlogos](https://brandlogos.net/anhanguera-educacional-111817.html) e [Estácio — site institucional](https://estacio.br).
