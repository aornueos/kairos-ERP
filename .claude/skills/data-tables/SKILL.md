---
name: data-tables
description: Padrão de tabelas e listagens do KAIROS — colunas, filtros, seleção, ações em massa, totais e exportação. Use ao criar qualquer tela de lista (pedidos, títulos, produtos, movimentos).
---

# Tabelas

A tabela é a tela mais usada de um ERP. Padrão único em `src/shared/ui/tabela`
(TanStack Table headless + componentes próprios).

## Anatomia

```
[ busca ] [ filtros ]            [ colunas ] [ exportar ] [ ação primária ]
[ chips dos filtros aplicados                              limpar tudo ]
| sel | número | data | parceiro | situação |     valor |
| totais da página / do filtro                  R$ 0,00 |
[ 50 de 1.243 · carregar mais ]
```

## Regras de coluna

- Identificador (número do documento) na primeira coluna, sempre visível, clicável.
- Valores à direita com `tabular-nums`; datas no formato `dd/MM/yyyy`; texto à esquerda.
- Situação como `Badge` com cor e rótulo.
- Máximo 8 colunas visíveis por padrão. O resto entra no seletor de colunas, com a
  escolha do usuário persistida por tela e por usuário.
- Coluna de ações à direita, com menu de três pontos. Nunca mais de duas ações inline.

## Filtros

Período é o filtro padrão de toda lista transacional, com valor inicial de 30 dias.
Estado dos filtros vive na URL (`searchParams`) para que o link seja compartilhável e o
voltar do navegador funcione. Filtros aplicados aparecem como chips removíveis.

Busca global da tela procura nos campos que o usuário espera: número, parceiro, CNPJ,
SKU, chave de acesso. Debounce de 300 ms e mínimo de 2 caracteres.

## Paginação

Cursor (ver [api-design-rest]). "Carregar mais" ou paginação numérica, nunca scroll
infinito em tela que o usuário precisa conferir e reencontrar linha.

## Seleção e ação em massa

Checkbox por linha, com "selecionar todos do filtro" explicitando a quantidade
("Selecionar os 1.243 do filtro"). Ação em massa sempre mostra o que vai fazer, em
quantos registros, e roda como job com progresso quando passar de 50 itens.

## Totais

Rodapé mostra total da página e total do filtro inteiro (consulta de agregação separada,
não soma do que está na tela). Em financeiro e faturamento isso não é opcional: o usuário
confere pelo total.

## Exportação

CSV e XLSX respeitando filtros, colunas visíveis e ordenação atuais. Acima de 5.000
linhas vira job com notificação e link de download (ver [import-export-csv]).

## Desempenho

- `take` obrigatório, padrão 50.
- Ordenação só por colunas indexadas; a lista de colunas ordenáveis é whitelist.
- Nada de `count` exato em tabela grande a cada página: use estimativa ou conte só no
  primeiro carregamento do filtro.

## Acessibilidade

`<table>` real com `<th scope>`, cabeçalho fixo com `position: sticky`, navegação por
teclado nas linhas, e leitor de tela anunciando a mudança de quantidade após filtrar.
