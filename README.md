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
- **Avaliações de Experiência:** o registro `avaliacoes-experiencia` contém o status configurável, o escopo, a atuação e os benefícios esperados. Use `categories` para definir os filtros, `categoryLabel` para o texto do card e `validation.confirmedStages` somente para etapas cuja implementação e validação tenham sido confirmadas. A lista começa vazia; o ciclo completo não é apresentado como validado em produção.
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
