---
name: permissions-matrix
description: Catálogo de permissões do KAIROS e matriz perfil x permissão. Use ao criar ação nova, definir quem pode aprovar algo, ou revisar segregação de funções.
---

# Matriz de permissões

Fonte única em `src/shared/auth/permissoes.ts`, tipada como `const` e usada tanto no
seed quanto na verificação. Permissão que não está lá não existe.

```ts
export const PERMISSOES = {
  'vendas.pedido.ler': 'Visualizar pedidos',
  'vendas.pedido.criar': 'Criar pedido',
  'vendas.pedido.confirmar': 'Confirmar pedido',
  'vendas.pedido.aprovar_desconto': 'Aprovar desconto acima do limite',
  'vendas.pedido.cancelar': 'Cancelar pedido',
  // ...
} as const
export type Permissao = keyof typeof PERMISSOES
```

## Convenção

`<modulo>.<recurso>.<acao>`. Ações padrão: `ler`, `criar`, `alterar`, `excluir`.
Ações específicas ganham verbo próprio: `confirmar`, `faturar`, `cancelar`, `baixar`,
`conciliar`, `aprovar`, `emitir`, `estornar`, `exportar`.

Permissão de leitura nunca implica escrita. Não existe curinga `*` em perfil comum:
só o perfil Administrador do tenant tem `admin.total`.

## Matriz por perfil (padrão do seed)

| Permissão | Admin | Financeiro | Vendas | Produção | Estoque | Fiscal | Leitura |
|---|---|---|---|---|---|---|---|
| `cadastros.produto.*` | x | ler | ler | ler | ler | ler | ler |
| `cadastros.parceiro.criar/alterar` | x | x | x | | | | |
| `vendas.pedido.criar/confirmar` | x | | x | | | | |
| `vendas.pedido.aprovar_desconto` | x | x | | | | | |
| `vendas.tabela_preco.alterar` | x | x | | | | | |
| `faturamento.faturar` | x | x | | | | x | |
| `fiscal.nfe.emitir` | x | | | | | x | |
| `fiscal.nfe.cancelar` | x | | | | | x | |
| `estoque.movimento.ajustar` | x | | | | x | | |
| `estoque.inventario.fechar` | x | | | | x | | |
| `producao.op.criar/apontar/concluir` | x | | | x | | | |
| `producao.formula.alterar` | x | | | x | | | |
| `compras.pedido.aprovar` | x | x | | | | | |
| `financeiro.titulo.baixar` | x | x | | | | | |
| `financeiro.titulo.estornar` | x | x | | | | | |
| `financeiro.remessa.gerar` | x | x | | | | | |
| `relatorios.dre.ler` | x | x | | | | | x |
| `admin.usuario.*` | x | | | | | | |

x = permitido. Célula vazia = negado.

## Segregação de funções

Combinações que a tela de perfis deve alertar antes de salvar:

- criar fornecedor + aprovar compra + baixar título a pagar (fraude clássica);
- alterar cadastro bancário de parceiro + gerar remessa CNAB;
- ajustar estoque + fechar inventário sem segunda aprovação.

Alerta, não bloqueio: empresa pequena às vezes precisa acumular. O que não pode é
acontecer sem ninguém saber — por isso tudo cai em [audit-trail].

## Ao criar uma ação nova

1. Registre a permissão em `permissoes.ts` com descrição em português.
2. Atualize a matriz do seed e esta tabela.
3. Chame `ctx.exigirPermissao(...)` no caso de uso.
4. Esconda ou desabilite o controle na UI com o mesmo identificador.
5. Cubra com teste: um perfil autorizado passa, um não autorizado recebe 403.
