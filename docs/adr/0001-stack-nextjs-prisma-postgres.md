# 0001 — Stack Next.js 15, Prisma e PostgreSQL

- Status: aceito
- Data: 2026-09-22
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

- Node 22 LTS com TypeScript em modo estrito;
- Next.js 15 (App Router) servindo interface e backend, com Server Actions para mutações
  internas e Route Handlers para API externa;
- Prisma 6 sobre PostgreSQL 16;
- Tailwind com shadcn/ui, React Hook Form e Zod na interface;
- Auth.js v5 com credenciais e RBAC em banco;
- pg-boss para filas, no próprio PostgreSQL;
- armazenamento S3-compatível (MinIO local, R2 ou S3 em produção);
- Pino, OpenTelemetry e Sentry para observabilidade;
- Vitest, Testcontainers e Playwright para testes;
- Docker com GitHub Actions para build e deploy.

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
