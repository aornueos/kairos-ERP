# 0001 — Stack Next.js 15, Prisma e PostgreSQL

- Status: aceito
- Data: 2026-09-22
- Revisado: 2026-09-22 (versões ajustadas ao que foi efetivamente instalado)
- Decisores: Raul (produto e engenharia)

## Contexto

O KAIROS é o ERP da Pure.us, indústria de cosméticos capilares que fabrica e vende.
A equipe de desenvolvimento é pequena (um a dois desenvolvedores no início), o orçamento
de infraestrutura é limitado e o sistema precisa cobrir estoque com lote, produção,
vendas, faturamento fiscal e financeiro.

Restrições reais: pouca gente para manter, necessidade de entregar valor em meses e não
em anos, e exigência de correção em cálculo financeiro e fiscal.

## Decisão

A stack do KAIROS é:

- Node 22 ou superior com TypeScript em modo estrito;
- Next.js (App Router) servindo interface e backend, com Server Actions para mutações
  internas e Route Handlers para API externa;
- Prisma sobre PostgreSQL 16;
- Tailwind, React Hook Form e Zod na interface;
- Auth.js v5 com credenciais e RBAC em banco;
- pg-boss para filas, no próprio PostgreSQL;
- armazenamento S3-compatível (MinIO local, R2 ou S3 em produção);
- Pino, OpenTelemetry e Sentry para observabilidade;
- Vitest, Testcontainers e Playwright para testes;
- Docker com GitHub Actions para build e deploy.

### Versões instaladas na fase 0

A primeira redação deste ADR citava Next.js 15 e Prisma 6. Na instalação, as versões
estáveis correntes eram outras, e projeto novo não tem motivo para nascer num major
antigo:

| Pacote | Versão | Observação |
|---|---|---|
| Node | 24.21 (mínimo declarado: 22) | a máquina de desenvolvimento roda 24 |
| Next.js | 16.3 | `middleware.ts` passou a se chamar `proxy.ts`; a opção `eslint` saiu de `next.config` |
| React | 19.3 | |
| Prisma | 7.10 | gerador `prisma-client`, config em `prisma7.config.ts` e **driver adapter obrigatório** (`@prisma/adapter-pg`) |
| PostgreSQL | 16.11 | |
| pg-boss | 12.33 | `createQueue` antes de enfileirar; opções em segundos |
| Zod | 4.6 | validadores no topo (`z.url()`, `z.uuid()`) |
| Tailwind | 4.3 | configuração por `@theme` no CSS, sem `tailwind.config` |
| TypeScript | **6.0** | ver abaixo |
| ESLint | **9** | ver abaixo |

Dois pacotes ficaram deliberadamente atrás do `latest`:

- **TypeScript 6, não 7.** O `tsc` 7 compila o projeto sem erro, mas o
  `typescript-eslint` ainda não suporta a API do 7 e o lint não roda. Lint é gate
  obrigatório do CI; vale mais que estar no major mais novo. Revisar quando o
  `typescript-eslint` anunciar suporte.
- **ESLint 9, não 10.** O `typescript-eslint` 8 declara compatibilidade com ESLint 10 no
  `peerDependencies`, mas quebra em tempo de execução
  (`scopeManager.addGlobals is not a function`). Revisar junto com o item acima.

Também ficou de fora a regra `@typescript-eslint/consistent-type-imports`, que exige
linting com informação de tipos e conflita com o parser do `eslint-config-next`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| NestJS com React separado | dois deploys e mais cerimônia, sem ganho no porte atual |
| Laravel com Inertia | ecossistema fiscal maduro, mas a equipe é mais forte em TypeScript e a tipagem ponta a ponta pesa mais |
| FastAPI com React | bom para análise de dados, fraco em compartilhar tipos e validação entre front e back |
| Redis para filas e cache | mais um serviço para operar; o PostgreSQL atende o volume atual |

## Consequências

Positivas: um repositório, um deploy, um modelo de tipos compartilhado entre interface e
domínio. Validação Zod única entre formulário e caso de uso. Filas sem infraestrutura
adicional, dentro do mesmo backup do banco.

Negativas: acoplamento ao ciclo de vida do Next.js, que muda rápido; Server Actions
exigem disciplina para não virar depósito de regra de negócio; pg-boss não escala como
um broker dedicado, e será limitante se o volume crescer muito.

Reverter significa reescrever a camada de aplicação e interface. O domínio, por não
depender de framework, migraria com custo moderado.

## Revisão

Revisitar se a operação passar de 50 usuários simultâneos, se a fila ultrapassar cinco
mil jobs por dia, ou se houver necessidade de aplicativo móvel nativo com API dedicada.
