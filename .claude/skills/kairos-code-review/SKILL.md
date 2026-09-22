---
name: kairos-code-review
description: Checklist de revisão de código específico do KAIROS — tenant, dinheiro, transação, fiscal, permissão e migration. Use ao revisar PR ou antes de abrir um.
---

# Revisão de código do KAIROS

> Para a revisão genérica de defeitos, use o comando `/code-review`. Esta skill é o
> checklist do domínio: o que só quebra neste projeto.

## Bloqueadores (reprovam o PR)

- [ ] Query ou tabela sem `tenant_id`, ou migration sem policy de RLS.
- [ ] `@@unique` ou `@@index` sem `tenantId` no prefixo.
- [ ] Valor monetário em `number` ou `float` em qualquer ponto do caminho.
- [ ] Caso de uso sem `ctx.exigirPermissao(...)`.
- [ ] Server Action sem validação de entrada.
- [ ] Chamada HTTP externa dentro de `prisma.$transaction`.
- [ ] `catch` vazio, ou que devolve sucesso depois de falhar.
- [ ] Import cruzando a fronteira de módulo (fora do `index.ts`).
- [ ] Segredo, token ou certificado em código, log ou banco em texto puro.
- [ ] Dado pessoal em log ou em mensagem de erro.
- [ ] Movimento de estoque ou financeiro sendo alterado ou apagado em vez de estornado.

## Verificações por tema

**Dinheiro e quantidade**: `Decimal` ponta a ponta; arredondamento só no final; rateio
com sobra no último item; soma conferida contra o total.

**Transação**: uma transação por caso de uso; efeito em outro contexto por evento na
outbox; nada de I/O externo dentro dela.

**Fiscal**: cálculo só no módulo `fiscal`; regra buscada pela data da operação, não pela
data atual; nenhuma alíquota cravada no código.

**Estoque**: saldo nunca negativo; lote obrigatório quando o produto exige; FEFO na
sugestão; reserva liberada em todo caminho de cancelamento.

**Datas**: `timestamptz` em UTC; conversão para `America/Sao_Paulo` só na borda; período
de relatório fechando no fuso certo.

**Concorrência**: lock otimista por `versao` em documento editável; lock de linha no
saldo; idempotência em job e webhook.

**UI**: estados de carregando, vazio e erro; totais no rodapé de lista financeira;
formatação por componente, não por `toFixed`.

**Migration**: SQL lido linha a linha; nada de `drop`/`rename` sem expand/contract;
índice com `concurrently` em tabela com volume; rollback pensado.

## Perguntas ao revisor

1. Se isso rodar duas vezes, o que acontece?
2. Se o provedor externo não responder no meio, o banco fica consistente?
3. Um usuário de outro tenant consegue ver ou alterar isso?
4. O contador conseguiria explicar esse número em uma fiscalização?
5. O que este PR torna mais difícil de mudar depois?

## Postura

Revisão aponta defeito e risco, não preferência estética. Comentário sobre estilo que o
lint não pega é sugestão, e deve vir marcado como tal. Divergência de arquitetura vira
ADR, não briga no PR.
