---
name: backend-conventions
description: Convenções de backend do KAIROS (Next.js 15 Server Actions, casos de uso, transações, dinheiro, datas, IDs). Use ao escrever qualquer caso de uso, Server Action ou repositório.
---

# Convenções de backend

## Forma de um caso de uso

```ts
// src/modules/vendas/application/confirmar-pedido.ts
export const confirmarPedidoInput = z.object({
  pedidoId: z.uuid(),
  observacao: z.string().max(500).optional(),
})

export async function confirmarPedido(
  input: z.infer<typeof confirmarPedidoInput>,
  ctx: Contexto,
): Promise<Resultado<PedidoConfirmadoDTO>> {
  ctx.exigirPermissao('vendas.pedido.confirmar')
  const dados = confirmarPedidoInput.parse(input)
  return ctx.db.transacao(async (tx) => {
    const pedido = await tx.pedidos.porId(dados.pedidoId)
    if (!pedido) throw new NaoEncontradoError('Pedido', dados.pedidoId)
    pedido.confirmar(ctx.agora())
    await tx.pedidos.salvar(pedido)
    await tx.eventos.publicar(pedido.eventos)
    return ok(toDTO(pedido))
  })
}
```

Todo caso de uso: entrada validada, permissão verificada, transação explícita, eventos
publicados na mesma transação, DTO na saída. Nunca devolva entidade de domínio para a UI.

## Contexto (`ctx`)

Carrega `tenantId`, `usuario`, `permissoes`, `db`, `agora()`, `logger`.
`agora()` é injetado para o teste controlar o tempo — proibido `new Date()` em domínio
ou caso de uso.

## Server Action

```ts
'use server'
export async function acaoConfirmarPedido(formData: FormData) {
  const ctx = await contextoDaRequisicao()
  const r = await confirmarPedido(parseForm(formData), ctx)
  revalidatePath('/vendas/pedidos')
  return r
}
```

A Server Action só adapta: autentica, converte entrada, chama o caso de uso, revalida
cache. Zero regra de negócio. Toda Server Action é um endpoint público: valide sempre,
mesmo que o botão esteja escondido na UI.

## Dinheiro

`Decimal` do Prisma (`decimal.js`) em todo o caminho. Nunca `number` para valor.
Arredondamento apenas no final do cálculo, com `ROUND_HALF_UP` e 2 casas para dinheiro.
Em rateio (frete, desconto no item), distribua a diferença de centavos no último item e
valide que a soma bate com o total.

## Datas

`timestamptz` em UTC no banco. `America/Sao_Paulo` só na apresentação e nos limites de
período dos relatórios. Competência contábil e validade de lote são `date`, sem hora.

## IDs

UUID v7 gerado na aplicação com `uuidv7()`. Nunca exponha id sequencial.

## Nomes

Arquivo em kebab-case, função em camelCase, classe em PascalCase. Casos de uso são verbos
no infinitivo (`confirmarPedido`, `gerarTitulos`). Repositórios são substantivos no plural
(`pedidos.porId`, `pedidos.salvar`).

## Proibições

- `any`, `as unknown as`, `@ts-expect-error` sem comentário justificando.
- `console.log` fora de script; use o logger estruturado (ver [observability-logs]).
- Acesso ao Prisma fora de `infra/`.
- Chamada HTTP externa sem timeout (ver [error-handling]).
