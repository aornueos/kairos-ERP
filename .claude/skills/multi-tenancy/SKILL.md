---
name: multi-tenancy
description: Isolamento por tenant no KAIROS com tenant_id e Row Level Security no Postgres. Use ao criar tabela, escrever query, abrir job em background ou revisar qualquer código que toque dados de mais de uma empresa.
---

# Multi-tenancy

Modelo escolhido: base única, `tenant_id` em toda tabela de negócio, Row Level Security
no Postgres. A Pure.us é o tenant inicial; filiais e futuros clientes entram como tenants
novos sem migração estrutural.

## Regras

1. Toda tabela de negócio tem `tenant_id uuid not null`.
2. Índices compostos sempre começam por `tenant_id`.
3. Unicidade é sempre por tenant: `@@unique([tenantId, sku])`, nunca `@@unique([sku])`.
4. Tabelas globais (sem tenant): `tenant`, `usuario`, `municipio`, `ncm`, `cfop`, `banco`.
5. Nenhuma query confia apenas no `where tenantId` da aplicação. A RLS é a rede de segurança.

## RLS

```sql
alter table produto enable row level security;
alter table produto force row level security;

create policy tenant_isolation on produto
  using (tenant_id = current_setting('app.tenant_id', true)::uuid)
  with check (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

`force row level security` é obrigatório: sem ele o dono da tabela ignora a policy.
A role da aplicação nunca é superuser nem dona das tabelas.

## Contexto de tenant no Prisma

```ts
// src/shared/db/tenant-client.ts
export function prismaFor(tenantId: string) {
  return prisma.$extends({
    query: {
      async $allOperations({ args, query }) {
        return prisma.$transaction(async (tx) => {
          await tx.$executeRaw`select set_config('app.tenant_id', ${tenantId}, true)`
          return query(args)
        })
      },
    },
  })
}
```

O terceiro argumento `true` de `set_config` torna o valor local à transação: não vaza
entre requisições que compartilham conexão do pool.

## Jobs e tenant

Todo payload de job carrega `tenantId`. O worker abre o contexto antes de qualquer
acesso. Job sem `tenantId` no payload é bug; falhe cedo:

```ts
if (!job.data.tenantId) throw new Error(`Job ${job.name} sem tenantId`)
```

## Checklist de revisão

- [ ] Migration criou a policy junto com a tabela.
- [ ] `@@unique` e `@@index` começam por `tenantId`.
- [ ] Seed e scripts administrativos setam `app.tenant_id`.
- [ ] Nenhum `$queryRawUnsafe` com tenant interpolado por string.
- [ ] Teste de integração que tenta ler dado de outro tenant e recebe vazio.
