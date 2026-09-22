---
name: event-driven
description: Eventos de domínio e padrão outbox no KAIROS. Use quando uma ação em um módulo precisa disparar efeito em outro (faturar e baixar estoque, autorizar NF-e e gerar título) ou ao criar um handler assíncrono.
---

# Eventos de domínio e outbox

Comunicação entre contextos é por evento, com entrega garantida via tabela outbox e
pg-boss. Nada de chamada direta entre `infra` de módulos diferentes.

## Tabela outbox

```prisma
model EventoOutbox {
  id          String    @id @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  tipo        String
  versao      Int       @default(1)
  agregadoId  String    @map("agregado_id") @db.Uuid
  payload     Json
  ocorridoEm  DateTime  @map("ocorrido_em")
  publicadoEm DateTime? @map("publicado_em")
  tentativas  Int       @default(0)

  @@index([publicadoEm, ocorridoEm])
  @@map("evento_outbox")
}
```

O evento é gravado na mesma transação da mudança de estado. Um publisher lê o que está
com `publicadoEm` nulo e enfileira no pg-boss.

## Catálogo de eventos

| Evento | Produtor | Consumidores |
|---|---|---|
| `compra.recebida` | compras | estoque (entrada de lote) |
| `producao.concluida` | producao | estoque (baixa insumo, entrada acabado), contabil |
| `pedido.confirmado` | vendas | estoque (reserva), crm |
| `pedido.faturado` | faturamento | fiscal (emitir NF-e), financeiro (gerar títulos), estoque (baixa) |
| `nfe.autorizada` | fiscal | logistica (etiqueta), vendas (notificar cliente) |
| `nfe.rejeitada` | fiscal | faturamento (reabrir), notificacoes |
| `titulo.baixado` | financeiro | contabil, bi |

Nome do evento: `<agregado>.<fato no passado>`. Nunca imperativo — `emitirNfe` é comando,
não evento.

## Handler

```ts
export const onPedidoFaturado = handler('pedido.faturado', async (ev, ctx) => {
  await ctx.financeiro.gerarTitulosReceber(ev.payload)
})
```

Regras do handler:

- idempotente, com chave `(tipo, agregadoId, consumidor)` na tabela `evento_consumo`;
- não lança para erro de negócio esperado — registra e encerra;
- lança para falha transitória (rede, timeout) e deixa o pg-boss repetir;
- máximo 5 tentativas com backoff exponencial, depois dead letter e alerta.

## Versionamento de payload

Payload é contrato. Só adicione campos opcionais. Mudança incompatível cria
`pedido.faturado` versão 2, com os dois handlers vivos até a migração terminar.

## Armadilhas

- Publicar evento fora da transação gera efeito fantasma quando a transação falha.
- Handler que reage a evento do próprio módulo é acoplamento disfarçado: chame o caso de uso.
- Ordem entre eventos não é garantida. Se a ordem importa, ela é invariante do agregado.
