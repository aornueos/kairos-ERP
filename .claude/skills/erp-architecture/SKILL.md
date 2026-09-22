---
name: erp-architecture
description: Visão arquitetural do KAIROS ERP (Pure.us). Use ao criar um módulo novo, decidir onde um comportamento mora, avaliar acoplamento entre contextos ou revisar um PR que cruza mais de um módulo.
---

# Arquitetura do KAIROS

ERP de fabricante de cosméticos capilares (Pure.us). Produz e vende: o fluxo completo é
compra de insumo -> produção -> estoque com lote -> venda -> faturamento -> fiscal -> financeiro.

## Stack fixado

| Camada | Escolha |
|---|---|
| Runtime | Node 22 LTS, TypeScript strict |
| App | Next.js 15 (App Router), Server Actions para mutações internas |
| ORM | Prisma 6 + PostgreSQL 16 |
| UI | Tailwind + shadcn/ui, React Hook Form + Zod |
| Auth | Auth.js v5 (credentials), RBAC em banco |
| Jobs | pg-boss (fila no próprio Postgres) |
| Arquivos | S3-compatível (MinIO local, R2/S3 em produção) |
| Observabilidade | Pino + OpenTelemetry + Sentry |

Sem microsserviços. Sem Redis na fase 1. Sem GraphQL.

## Contextos delimitados

`identidade` `cadastros` `estoque` `compras` `producao` `vendas` `faturamento`
`fiscal` `financeiro` `contabil` `crm` `logistica` `bi`

Cada contexto vive em `src/modules/<contexto>` com quatro camadas:

```
src/modules/estoque/
  domain/        entidades, value objects, invariantes, eventos (sem import de infra)
  application/   casos de uso, portas, DTOs Zod
  infra/         repositórios Prisma, adapters, jobs
  ui/            componentes e telas do módulo
```

## Regras de dependência

1. `domain` não importa nada fora de si mesmo.
2. `application` importa `domain`; nunca importa Prisma direto, só portas.
3. `infra` implementa portas de `application`.
4. Um módulo nunca importa `domain`/`infra` de outro módulo. A comunicação é por:
   - chamada ao caso de uso público exposto em `src/modules/<ctx>/index.ts`; ou
   - evento de domínio via outbox (ver [event-driven]).
5. Leitura entre contextos pode usar view de leitura dedicada; escrita nunca.

## Onde cada coisa mora

- Regra de negócio invariante ("lote vencido não pode ser reservado") -> `domain`.
- Orquestração e transação -> `application`.
- SQL, HTTP, fila, arquivo -> `infra`.
- Formatação, máscara, i18n -> `ui`.

## Checklist ao abrir um módulo novo

- [ ] Contexto declarado no mapa acima e no ADR correspondente.
- [ ] Tabelas com `tenant_id` e RLS ativa.
- [ ] Caso de uso com validação Zod na fronteira.
- [ ] Evento de domínio publicado pela outbox se outro contexto reage.
- [ ] Permissões registradas na matriz (ver [permissions-matrix]).
- [ ] Teste de integração do caso de uso principal.

## Armadilhas conhecidas

- Import cruzado de Prisma entre módulos mata a fronteira em silêncio. Barre no ESLint
  com `no-restricted-imports` por path.
- Server Action que faz trabalho longo (emitir NF, gerar SPED) precisa virar job.
- Cálculo fiscal dentro de `vendas` é erro: pertence a `fiscal`, chamado por porta.
