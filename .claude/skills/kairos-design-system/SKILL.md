---
name: kairos-design-system
description: Design system do KAIROS — tokens de cor, tipografia, espaçamento, densidade e uso da marca Pure.us na interface. Use ao criar tela ou componente, definir cor, tamanho ou espaçamento, e ao revisar consistência visual.
---

# Design system do KAIROS

Interface de trabalho, usada oito horas por dia. Prioridade: legibilidade, densidade
adequada e previsibilidade. A marca Pure.us aparece com contenção — identidade forte fica
para o site e a embalagem, não para a tela de lançamento de título.

> Para teoria genérica de arquitetura de tokens, existe a skill `design-system` no perfil
> do usuário. Esta aqui define o que vale no KAIROS.

## Camadas de token

```
primitivo  -> --azul-600, --cinza-100, --espaco-4
semantico  -> --cor-superficie, --cor-texto, --cor-perigo, --cor-borda
componente -> --tabela-linha-altura, --campo-altura
```

Componente nunca usa primitivo direto. Se falta um token semântico, crie o token; não
chute o hex.

## Cores semânticas

| Token | Uso |
|---|---|
| `--cor-fundo` / `--cor-superficie` | fundo da página / de cards e tabelas |
| `--cor-texto` / `--cor-texto-suave` | texto principal / secundário e rótulos |
| `--cor-borda` | divisórias e contorno de campo |
| `--cor-marca` | ações primárias, links, estado ativo |
| `--cor-sucesso` | autorizado, pago, concluído |
| `--cor-atencao` | pendente, a vencer, aguardando |
| `--cor-perigo` | rejeitado, vencido, cancelado, exclusão |
| `--cor-info` | rascunho, informativo |

Estado nunca é comunicado só por cor: cor + rótulo, sempre (ver [accessibility]).
Contraste mínimo 4.5:1 para texto, 3:1 para ícone e borda de campo.

## Tema claro e escuro

Tokens redefinidos em `@media (prefers-color-scheme: dark)` e em `:root[data-theme]`.
Todo componente é testado nos dois. Depósito e expedição costumam usar tela em ambiente
claro; o financeiro, não.

## Tipografia

Uma família sem serifa de boa legibilidade em números (Inter ou Geist).
Números tabulares obrigatórios em toda coluna de valor: `font-variant-numeric: tabular-nums`.

| Papel | Tamanho | Peso |
|---|---|---|
| Título de página | 20px | 600 |
| Título de seção | 16px | 600 |
| Corpo e tabela | 14px | 400 |
| Rótulo e auxiliar | 12px | 500 |

Valor monetário alinhado à direita, com duas casas e separador pt-BR, sempre.

## Espaçamento e densidade

Escala de 4px: 4, 8, 12, 16, 24, 32, 48. Duas densidades: `confortavel` (padrão) e
`compacta` (tabelas longas, conferência), trocáveis pelo usuário e persistidas no perfil.

## Componentes base

shadcn/ui como ponto de partida, encapsulado em `src/shared/ui`. Telas nunca importam de
`components/ui` direto: importam do wrapper, que é onde os tokens e o comportamento
padrão do KAIROS entram.

## Marca Pure.us

Logo no topo da barra lateral e nos documentos impressos (DANFE, boleto, relatório).
A cor da marca entra em ação primária e destaque, não como fundo de tela inteira.
Para identidade completa, ver [brand-guidelines].
