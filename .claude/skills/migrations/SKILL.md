---
name: migrations
description: Fluxo de migrations do KAIROS com Prisma Migrate — criar, revisar, aplicar em produção, expand/contract e migração de dados. Use ao alterar schema, renomear coluna ou preparar deploy que muda o banco.
---

# Migrations

Prisma Migrate com migration SQL versionada em `prisma/migrations/`. Nada de
`db push` fora do protótipo descartável.

## Comandos

```bash
pnpm prisma migrate dev --name adiciona_lote_validade   # desenvolvimento
pnpm prisma migrate deploy                              # produção (no deploy, antes do app)
pnpm prisma migrate status                              # diagnóstico
```

Migration entra no mesmo PR da mudança de código. Nunca edite migration já aplicada em
produção: crie outra.

## Regra de ouro: migration compatível com a versão anterior do app

Durante o deploy as duas versões coexistem. Toda mudança destrutiva usa expand/contract:

| Fase | PR | Ação |
|---|---|---|
| Expand | 1 | cria coluna nova, nullable, com backfill; app escreve nas duas |
| Migrate | 2 | app lê da nova; backfill concluído e verificado |
| Contract | 3 | remove coluna antiga e a escrita dupla |

Renomear coluna direto é proibido: o app antigo ainda referencia o nome velho.

## Cuidados no PostgreSQL

- `add column ... default <valor>` é rápido a partir do PG 11. `not null` sem default em
  tabela grande exige preencher antes.
- Criar índice em tabela quente: `create index concurrently` em migration própria,
  fora de transação (`-- prisma-migrate: no-transaction`).
- `alter table ... type` reescreve a tabela e trava. Prefira coluna nova mais backfill.
- Backfill de tabela grande roda em lotes (10k linhas) dentro de job, não na migration.

## Numeração de documentos

Número de pedido, NF e OP é por tenant e não pode ter buraco quando houver exigência
fiscal. Use tabela de contador com lock:

```sql
update documento_contador
   set proximo = proximo + 1
 where tenant_id = $1 and serie = $2
returning proximo - 1 as numero;
```

Isso serializa apenas as emissões daquele tenant e série. Não use `sequence` do Postgres
para número fiscal: sequence não faz rollback e cria buraco.

## RLS na migration

Toda tabela nova recebe, na mesma migration:

```sql
alter table <tabela> enable row level security;
alter table <tabela> force row level security;
create policy tenant_isolation on <tabela>
  using (tenant_id = current_setting('app.tenant_id', true)::uuid)
  with check (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

O CI falha se existir tabela com `tenant_id` sem policy (script `scripts/check-rls.ts`).

## Checklist antes do merge

- [ ] SQL gerado lido linha a linha, não só o `schema.prisma`.
- [ ] Nenhum `drop column` ou `rename` sem as três fases.
- [ ] Índice novo criado com `concurrently` se a tabela já tem volume.
- [ ] Policy de RLS criada.
- [ ] Rollback pensado: se não houver, a migration precisa ser trivialmente reversível.
- [ ] Rodou contra dump de produção anonimizado e mediu o tempo.
