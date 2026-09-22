---
name: audit-trail
description: Trilha de auditoria do KAIROS — o que registrar, formato, retenção e consulta. Use ao criar operação que altera dado sensível, financeiro ou fiscal, e ao investigar "quem mudou isso".
---

# Trilha de auditoria

ERP sem auditoria confiável é indefensável em discussão fiscal, trabalhista ou de fraude
interna. Toda alteração relevante é registrada com ator, momento, antes e depois.

## Tabela

```prisma
model Auditoria {
  id         String   @id @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  entidade   String                    // "Pedido", "Titulo", "Produto"
  entidadeId String   @map("entidade_id") @db.Uuid
  acao       String                    // criou | alterou | excluiu | aprovou | cancelou
  atorId     String?  @map("ator_id") @db.Uuid
  atorTipo   String   @map("ator_tipo")  // usuario | token_api | job | importacao
  origem     String?                     // ip ou nome do job
  antes      Json?
  depois     Json?
  ocorridoEm DateTime @map("ocorrido_em")

  @@index([tenantId, entidade, entidadeId, ocorridoEm])
  @@index([tenantId, atorId, ocorridoEm])
  @@map("auditoria")
}
```

`antes`/`depois` guardam apenas os campos alterados, não o objeto inteiro.

## Captura

Prisma Client Extension intercepta `create`, `update`, `updateMany` e `delete` das
entidades marcadas como auditáveis. O ator vem do contexto de requisição
(`AsyncLocalStorage`), não de parâmetro passado manualmente — parâmetro alguém esquece.

Auditar tudo gera ruído e custo. Lista de auditadas: parceiro, produto, preço, pedido,
nota fiscal, título, baixa, movimento de estoque, ordem de produção, usuário, perfil,
permissão, parâmetro fiscal e configuração de integração.

## Sempre auditar, sem exceção

- Alteração de preço, desconto acima do limite e liberação de crédito.
- Cancelamento de nota, estorno de baixa e ajuste manual de estoque.
- Mudança de permissão, criação e desativação de usuário, troca de senha.
- Alteração de dados bancários de fornecedor (vetor clássico de fraude).
- Login com falha e sucesso, e geração de token de API.

## Nunca gravar

Senha, hash de senha, token, certificado digital, chave de API, número completo de
cartão. Se o campo é sensível, registre apenas `{ "senha": "[alterada]" }`.

## Imutabilidade e retenção

- A tabela não tem `update` nem `delete` pela aplicação: revogue os privilégios na role.
- Retenção mínima de 5 anos para auditoria fiscal e financeira, alinhada a [lgpd].
- Particionamento mensal por `ocorrido_em` quando passar de 50 milhões de linhas.

## Consulta

Toda tela de documento tem aba "Histórico" lendo por `(entidade, entidadeId)`.
A listagem mostra campo, valor anterior, valor novo e quem alterou, com rótulos em
português vindos do mesmo dicionário de labels da UI.
