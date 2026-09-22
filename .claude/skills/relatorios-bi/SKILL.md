---
name: relatorios-bi
description: Relatórios e BI do KAIROS — catálogo, arquitetura de consulta, materialização, exportação e definição de indicadores. Use ao criar relatório, indicador ou exportação analítica.
---

# Relatórios e BI

## Arquitetura

Sem data warehouse separado na fase 1. O mesmo PostgreSQL atende, com separação clara:

```
tabelas transacionais  -> operação
views materializadas   -> relatórios e painéis
job noturno + refresh sob demanda
```

Relatório nunca consulta tabela transacional com agregação pesada em horário comercial.
Se a consulta demora mais de 3 segundos, ela vira materialização ou job.

Quando o volume exigir (fase 3), a evolução natural é réplica de leitura, não outro
banco.

## Catálogo mínimo

**Comercial**: vendas por período, produto, cliente, canal e vendedor; curva ABC de
produtos e clientes; ticket médio; desconto médio; comissões apuradas; metas contra
realizado; clientes inativos.

**Estoque**: posição atual por depósito e lote; giro e cobertura em dias; lotes a vencer;
perdas por motivo; movimentações por período; divergências de inventário.

**Produção**: OPs por situação; rendimento por produto e fórmula; perdas por etapa; custo
de produção por lote; eficiência por centro produtivo.

**Compras**: compras por fornecedor e insumo; evolução de preço de insumo; prazo médio de
entrega; divergências de recebimento.

**Financeiro**: aging de recebíveis e pagáveis; inadimplência; fluxo de caixa realizado e
projetado; DRE gerencial; despesas por centro de custo; despesa financeira por forma de
recebimento.

**Fiscal**: notas emitidas por CFOP e situação; impostos por período; notas canceladas e
rejeitadas com motivo.

## Definição de indicador

Todo indicador tem verbete em `docs/indicadores.md`: nome, fórmula, origem dos dados, o
que inclui e o que exclui, e a periodicidade de atualização. Sem isso, dois relatórios
mostram "faturamento" diferente e ninguém confia em nenhum dos dois.

Exemplo:

```
Faturamento líquido = soma do valor total das NF-e de venda AUTORIZADAS no período,
                      menos devoluções do período, menos impostos sobre vendas.
Exclui: notas de remessa, amostra, bonificação e transferência.
Origem: nota_fiscal + nota_fiscal_item. Atualização: horária.
```

## Construção

Toda view materializada:

- começa por `tenant_id` nos índices e respeita o isolamento (ver [multi-tenancy]);
- é refeita com `refresh materialized view concurrently` (exige índice único);
- registra `atualizado_em`, exibido na tela;
- tem teste que compara o resultado com a consulta transacional em um cenário de fixture.

## Exportação

XLSX com formatação pt-BR (use a skill `xlsx`), CSV para reprocessamento e PDF para
apresentação. Exportação grande roda como job e avisa quando terminar. Todo arquivo leva
cabeçalho com empresa, relatório, filtros aplicados e data de geração — sem isso, a
planilha circula e ninguém sabe do que ela é.

## Gráficos

Antes de escrever qualquer gráfico, use a skill `dataviz`. Para painel, ver [dashboards].
