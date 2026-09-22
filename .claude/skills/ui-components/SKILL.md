---
name: ui-components
description: Biblioteca de componentes do KAIROS — inventário, padrões de estado, layout de tela e regras de composição. Use ao criar tela ou componente novo, ou antes de instalar qualquer dependência de UI.
---

# Componentes de UI

Base shadcn/ui + Tailwind, encapsulada em `src/shared/ui`. Antes de criar componente
novo, procure aqui: ERP com dez variações de botão vira ERP ilegível.

## Inventário

| Componente | Observação |
|---|---|
| `Botao` | variantes: primario, secundario, sutil, perigo. Estado `carregando` bloqueia duplo clique |
| `CampoTexto`, `CampoNumero`, `CampoMoeda`, `CampoData`, `CampoPercentual` | máscara e formatação pt-BR embutidas |
| `Seletor`, `SeletorBusca` | busca assíncrona com debounce de 300 ms |
| `SeletorParceiro`, `SeletorProduto`, `SeletorLote` | busca por código, nome, CNPJ ou SKU, com atalho de cadastro rápido |
| `Tabela` | ver [data-tables] |
| `Formulario` | ver [forms-builder] |
| `Dialogo`, `Gaveta` | gaveta para edição rápida sem perder o contexto da lista |
| `Badge` | estado de documento, cor + rótulo |
| `MoedaTexto`, `QuantidadeTexto`, `DataTexto` | formatação consistente, sempre |
| `Vazio`, `Carregando`, `Erro` | os três estados, obrigatórios em toda lista |
| `Passos` | fluxos longos: faturamento, inventário, importação |
| `HistoricoAuditoria` | aba padrão de documento (ver [audit-trail]) |

## Layout de tela padrão

```
AppShell
  Barra lateral (módulos, colapsável, com busca por atalho)
  Topo (tenant, busca global Ctrl+K, notificações, usuário)
  Conteúdo
    Cabecalho (título, migalhas, ações primárias à direita)
    Filtros (linha única, com chips do que está aplicado)
    Corpo (tabela, formulário ou dashboard)
```

Três tipos de tela, e só três: **lista**, **documento** (formulário com itens e abas) e
**painel**. Fluxo novo deve caber em um deles; se não couber, discuta antes de inventar
um quarto.

## Estados obrigatórios

Toda tela que busca dado trata: carregando (skeleton com a forma do conteúdo real),
vazio (com ação de saída: "Nenhum pedido no período. Limpar filtros."), erro (mensagem,
`errorId` e botão de tentar novamente) e sem permissão.

## Regras

- Componente de `shared/ui` não conhece domínio. Componente com regra de negócio mora em
  `modules/<ctx>/ui`.
- Server Component por padrão; `'use client'` só onde há interação de estado.
- Ação destrutiva pede confirmação com o nome do que será afetado, e o botão diz o verbo
  ("Cancelar NF-e 12345"), não "OK".
- Feedback de mutação é imediato: desabilita o botão, mostra progresso e confirma com
  toast que some. Erro não some sozinho.
- Teclado é primeira classe: Tab previsível, Enter salva, Esc fecha, Ctrl+K busca.
  Quem lança 200 pedidos por dia não usa mouse.

## Antes de instalar biblioteca nova

Verifique se shadcn/ui, Radix ou o que já existe resolve. Dependência de UI nova exige
justificativa no PR: tamanho do bundle, manutenção do projeto e acessibilidade.
