---
name: integration-testing
description: Testes de integração no KAIROS — casos de uso contra Postgres real, isolamento por transação, RLS, jobs e provedores externos falsos. Use ao testar caso de uso, repositório, migration ou multi-tenancy.
---

# Testes de integração

Testam o caso de uso de ponta a ponta no servidor: banco real, transação real, eventos
reais. É a camada que pega os defeitos que mais doem em ERP.

## Infraestrutura

Testcontainers com PostgreSQL 16, uma instância por execução da suíte, migrations
aplicadas uma vez no início.

```ts
beforeAll(async () => { container = await novoPostgres(); await migrar() })
beforeEach(async () => { tx = await abrirTransacaoDeTeste() })
afterEach(async () => { await tx.rollback() })
```

Cada teste roda em transação com rollback: isolamento sem truncar tabela e sem ordem de
execução importando. Quando o caso de uso abre a própria transação, use schema descartável
por teste em vez de transação aninhada.

## O que testar

- Caso de uso completo: confirmar pedido, faturar, baixar título, concluir OP.
- Efeito colateral: movimento de estoque criado, evento na outbox, auditoria gravada.
- Regras de concorrência: duas reservas simultâneas do mesmo lote, lock otimista.
- **Isolamento por tenant**: criar dado no tenant A e confirmar que o tenant B não vê.
  Esse teste é obrigatório em todo módulo novo (ver [multi-tenancy]).
- Migrations: aplicar do zero e aplicar sobre a versão anterior.
- Handlers de evento: idempotência com entrega dupla.

## Provedores externos

Nunca chame provedor real em teste. Duas técnicas:

1. **Fake** que implementa a porta com comportamento plausível (provedor fiscal que
   autoriza, rejeita ou demora, conforme o CNPJ do cenário).
2. **MSW** interceptando HTTP para testar o adapter de verdade, com respostas gravadas do
   provedor real.

Fake para testar o fluxo; MSW para testar o adapter. Os dois têm lugar.

## Fixtures

Funções componíveis (ver [data-seeding]), nunca dump compartilhado. Cada teste monta o
mínimo que precisa e o cenário fica legível:

```ts
const { pedido } = await cenario.pedidoConfirmado({ itens: 2, comLoteVencendo: true })
```

## Casos que valem ouro

- Faturar pedido sem saldo suficiente: nada é gravado, estoque intacto.
- Provedor fiscal fora do ar: nota fica pendente, estoque e títulos consistentes.
- Webhook de autorização chegando duas vezes: uma nota autorizada, um título.
- Estorno de baixa de título já conciliado.
- Fechamento contábil bloqueando lançamento retroativo.

## Desempenho da suíte

Alvo: abaixo de 3 minutos no CI. Acima disso, o time para de rodar localmente. Paralelize
por arquivo, com banco por worker.
