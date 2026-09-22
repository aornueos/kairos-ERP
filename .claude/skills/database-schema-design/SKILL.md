---
name: database-schema-design
description: Convenções de modelagem do banco do KAIROS (PostgreSQL + Prisma) — nomes, tipos, chaves, dinheiro, quantidade, enums e integridade. Use ao criar ou alterar tabela, escolher tipo de coluna ou modelar relacionamento.
---

# Modelagem de banco

PostgreSQL 16, Prisma como ORM e fonte do schema. Schema dividido por módulo em
`prisma/schema/<contexto>.prisma` (`prismaSchemaFolder`).

## Nomes

- Tabela e coluna em `snake_case` e singular: `pedido_item`, `data_emissao`.
- Modelo Prisma em `PascalCase` com `@@map` e `@map` para o nome físico.
- Chave estrangeira: `<entidade>_id`.
- Booleano sempre afirmativo: `ativo`, `bloqueado`. Nunca `nao_ativo`.
- Nada de prefixo `tb_` nem sufixo `_tbl`.

## Chaves

- PK: `id uuid` gerado com UUID v7 na aplicação (`uuidv7()`), não `gen_random_uuid()`.
  A ordenação temporal do v7 evita fragmentação de índice e serve de cursor.
- Número visível ao usuário (pedido, NF, OP) é coluna separada `numero`, sequencial por
  tenant, gerada com sequência dedicada (ver [migrations], seção de numeração).
- Toda tabela de negócio: `tenant_id uuid not null` (ver [multi-tenancy]).

## Tipos

| Dado | Tipo | Prisma |
|---|---|---|
| Dinheiro | `numeric(14,2)` | `Decimal @db.Decimal(14,2)` |
| Preço unitário | `numeric(14,4)` | `Decimal @db.Decimal(14,4)` |
| Quantidade | `numeric(14,4)` | `Decimal @db.Decimal(14,4)` |
| Alíquota | `numeric(7,4)` | `Decimal @db.Decimal(7,4)` |
| Data e hora | `timestamptz` | `DateTime @db.Timestamptz(3)` |
| Data pura (competência, validade) | `date` | `DateTime @db.Date` |
| Texto livre | `text` | `String` |
| Código fixo (NCM, CFOP, CST) | `varchar(n)` | `String @db.VarChar(8)` |
| Documento fiscal XML | `text` + arquivo no S3 | `String` |

Nunca `float`/`double` para valor ou quantidade. Nunca `timestamp` sem timezone.
Todo `timestamptz` é gravado em UTC; a conversão para `America/Sao_Paulo` é na UI.

## Enums

Enum nativo do Postgres para conjunto fechado e estável (`StatusPedido`, `TipoMovimento`).
Tabela de domínio quando o usuário pode cadastrar valores (motivo de perda, condição de
pagamento). Remover valor de enum é migração dolorosa: pense antes.

## Integridade no banco, não só na aplicação

- `not null` sempre que a regra disser obrigatório.
- `check` para invariante simples: `check (quantidade > 0)`,
  `check (valor_total = valor_produtos + valor_frete - valor_desconto)`.
- FK com `on delete restrict` por padrão. `cascade` só de agregado para seus itens
  (`pedido -> pedido_item`).
- `unique` parcial para soft delete: `create unique index ... where deleted_at is null`.

## Colunas de controle em toda tabela de negócio

```
criado_em     timestamptz not null default now()
criado_por    uuid null
atualizado_em timestamptz not null
atualizado_por uuid null
versao        integer not null default 1   -- lock otimista
```

`versao` incrementa em todo update; update que não casa a versão esperada falha com
conflito 409.

## Armadilhas

- Guardar CNPJ com máscara. Guarde só dígitos, formate na UI.
- Reaproveitar `produto.preco` como preço de venda: preço mora em tabela de preço com
  vigência.
- Apagar linha de movimentação de estoque ou financeira. Movimento é imutável; corrija
  com lançamento de estorno.
