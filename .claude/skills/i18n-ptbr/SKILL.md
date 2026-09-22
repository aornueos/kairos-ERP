---
name: i18n-ptbr
description: Localização pt-BR do KAIROS — formatação de número, moeda, data, fuso, ordenação, terminologia e microcopy. Use ao exibir ou receber qualquer valor formatado, e ao escrever texto de interface.
---

# Localização pt-BR

Idioma único na fase 1: português do Brasil. Ainda assim, nada de texto cravado no JSX:
strings ficam em `src/shared/i18n/pt-BR/<modulo>.ts`, o que mantém a terminologia
consistente e permite revisão por quem entende do negócio.

## Formatação

| Dado | Formato | Como |
|---|---|---|
| Moeda | `R$ 1.234,56` | `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` |
| Número | `1.234,5678` | `Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 })` |
| Percentual | `12,50%` | 2 casas |
| Data | `21/09/2026` | `date-fns` com locale `ptBR` |
| Data e hora | `21/09/2026 14:32` | 24 horas, sem AM/PM |
| Competência | `set/2026` | mês abreviado minúsculo |
| CNPJ | `12.345.678/0001-90` | máscara só na exibição |
| CPF | `123.456.789-00` | máscara só na exibição |
| CEP | `01310-100` | máscara só na exibição |
| Telefone | `(11) 98765-4321` | máscara só na exibição |

Formatação sempre pelos componentes `MoedaTexto`, `DataTexto`, `QuantidadeTexto`.
`toFixed(2)` espalhado pelo código produz `1234.56` na tela do usuário e discussão com o
contador.

## Fuso horário

Banco em UTC. Exibição e filtros de período em `America/Sao_Paulo`.
"Vendas de hoje" significa 00:00 a 23:59:59 no fuso de São Paulo, convertido para UTC na
consulta. Erro aqui faz o relatório do dia 1 comer venda do dia 31.

## Entrada

Aceite o que o usuário digita naturalmente: `1.234,56`, `1234,56` e `1234.56` viram o
mesmo número. Data aceita `21/09/26`, `210926` e `21/09/2026`. Documento aceita com e sem
máscara.

## Ordenação e busca

`Intl.Collator('pt-BR', { sensitivity: 'base' })` no cliente; no Postgres, collation
`pt-BR-x-icu` para que "Ácido" ordene junto de "Acido". Busca ignora acento e caixa
(`unaccent` + `pg_trgm`).

## Terminologia

Use o vocabulário do negócio, não o do banco de dados: "Parceiro" e não "Entidade",
"Título" e não "Conta", "Movimento" e não "Transação". A lista canônica está em
[domain-driven-design].

## Microcopy

- Voz ativa, direta, sem infantilizar: "Pedido confirmado", não "Uhu! Tudo certo!".
- Erro diz o problema e o caminho: "CNPJ já cadastrado para Salão Bela Hair. Abrir
  cadastro?".
- Botão com verbo da ação: "Faturar pedido", não "Enviar".
- Sem gerundismo ("vamos estar processando"), sem jargão técnico ("erro 500").
- Números por extenso em confirmação crítica: "Cancelar a NF-e 12.345, no valor de
  R$ 8.430,00?".
