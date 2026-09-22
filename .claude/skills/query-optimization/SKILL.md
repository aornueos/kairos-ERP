---
name: query-optimization
description: Diagnóstico e correção de consultas lentas no KAIROS (Prisma + PostgreSQL) — índices, N+1, paginação, agregações de estoque e relatórios. Use quando uma tela demora, um job estoura tempo ou antes de subir listagem nova.
---

# Otimização de consultas

Meça antes de mexer. Sem `explain (analyze, buffers)` não há otimização, só palpite.

## Diagnóstico

```sql
explain (analyze, buffers, format text) <query>;
```

Sinais de problema: `Seq Scan` em tabela grande, `Rows Removed by Filter` alto,
estimativa de linhas muito distante do real, `Nested Loop` com milhares de iterações.

Em desenvolvimento, ligue o log do Prisma:

```ts
new PrismaClient({ log: [{ level: 'query', emit: 'event' }] })
```

`pg_stat_statements` habilitado em produção; revisar top 20 por tempo total toda sprint.

## Índices no KAIROS

- Sempre `(tenant_id, ...)` como prefixo. Índice sem `tenant_id` é quase sempre inútil
  porque a RLS já filtra por ele.
- Listagem padrão de documento: `(tenant_id, status, emitido_em desc, id desc)`.
- Busca por parceiro: `(tenant_id, parceiro_id, emitido_em desc)`.
- Estoque: `(tenant_id, produto_id, deposito_id, lote_id)` no movimento.
- Busca textual de produto: `pg_trgm` com índice GIN em `nome` e `sku`, não `ilike '%x%'` puro.
- Índice parcial quando a consulta sempre filtra o mesmo valor:
  `where deleted_at is null`, `where status = 'ABERTO'`.

Índice custa escrita. Antes de criar, verifique se um existente pode ser estendido.

## N+1

O padrão que mais aparece: listar pedidos e buscar itens ou parceiro por pedido.
Use `include`/`select` do Prisma, que gera uma consulta adicional por relação, não por linha.
Para listagem grande com agregação, prefira uma consulta SQL única com `join lateral`.

## Paginação

Cursor em `(emitido_em, id)` com `where (emitido_em, id) < ($1, $2)`. `offset` alto lê e
descarta tudo que veio antes; proibido em listagem transacional.

## Saldo de estoque

Não some `movimento_estoque` inteiro a cada consulta. Mantenha `saldo_lote` atualizado
na mesma transação do movimento (ver [estoque]) e use a soma bruta só na conferência
noturna. Se divergir, o job de conciliação alerta.

## Relatórios e BI

Relatório pesado (DRE, curva ABC, giro de estoque) lê de view materializada atualizada
por job, nunca da tela do usuário em tempo real. Ver [relatorios-bi].

## Limites operacionais

- Consulta de tela: alvo abaixo de 200 ms no p95.
- Timeout de statement da aplicação: 15 s; do worker de relatório: 120 s.
- Toda consulta de tela tem `take` obrigatório. Sem `take`, o code review reprova.
