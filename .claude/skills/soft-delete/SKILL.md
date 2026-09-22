---
name: soft-delete
description: Política de exclusão no KAIROS — o que pode ser apagado, o que só é inativado e o que nunca some. Use ao implementar botão de excluir, modelar tabela nova ou tratar pedido de remoção de dado.
---

# Exclusão de dados

Três categorias. Escolha explicitamente em qual a entidade se encaixa antes de criar a
tela.

## 1. Inativação (maioria dos cadastros)

Produto, parceiro, usuário, depósito, forma de pagamento, centro de custo.
Nunca somem: têm histórico apontando para eles.

```prisma
ativo       Boolean   @default(true)
inativadoEm DateTime? @map("inativado_em")
inativadoPor String?  @map("inativado_por") @db.Uuid
```

Inativo não aparece em combo de novo documento, mas continua visível em documento
antigo, relatório e filtro "incluir inativos".

## 2. Soft delete (rascunho e cadastro auxiliar)

Só onde faz sentido "desfazer": rascunho de pedido, orçamento, anexo, tarefa de CRM.

```prisma
deletedAt DateTime? @map("deleted_at")
```

- Unicidade convive com soft delete por índice parcial:
  `create unique index ... on parceiro (tenant_id, cnpj) where deleted_at is null;`
- Filtro aplicado por extensão do Prisma, não por `where` espalhado no código.
- Expurgo definitivo após 90 dias por job, com registro em [audit-trail].

## 3. Imutável (nunca apaga, nem soft)

Movimento de estoque, lançamento financeiro, baixa, nota fiscal, apontamento de produção,
registro contábil, auditoria.

Correção é por lançamento de estorno que referencia o original:

```
movimento_estoque.estorna_id -> movimento_estoque.id
```

Se a UI precisa de um botão "excluir" aqui, ele cancela ou estorna, e o texto diz isso.
Botão que promete exclusão e faz estorno confunde o usuário no momento errado.

## Interação com LGPD

Pedido de eliminação de dado pessoal não apaga nota fiscal nem título: há base legal e
obrigação de guarda. O tratamento é anonimização dos campos pessoais do parceiro,
preservando os documentos. Ver [lgpd].

## Armadilhas

- `deleted_at` sem índice parcial de unicidade permite dois CNPJs iguais ativos.
- Relatório que esquece o filtro de soft delete infla faturamento e engana a diretoria.
- `on delete cascade` para uma tabela imutável é bug grave: use `restrict`.
