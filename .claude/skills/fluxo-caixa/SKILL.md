---
name: fluxo-caixa
description: Fluxo de caixa realizado e projetado no KAIROS — apuração, projeção, cenários e DRE gerencial. Use ao construir relatório de caixa, projeção ou painel financeiro da diretoria.
---

# Fluxo de caixa

Duas visões, que nunca devem se misturar na mesma coluna:

- **Realizado**: o que entrou e saiu de fato (`movimento_financeiro` por data de caixa).
- **Projetado**: títulos em aberto por vencimento, mais recorrências e compromissos
  previstos.

## Estrutura do relatório

```
Saldo inicial do período
+ Entradas   (recebimento de clientes, outras receitas, aportes)
- Saídas     (fornecedores, folha, impostos, despesas fixas, financeiras)
= Saldo operacional
+/- Investimentos e financiamentos
= Saldo final
```

Agrupado por natureza financeira em árvore, com abertura por dia, semana ou mês e
comparação entre realizado e projetado.

## Projeção

Horizonte padrão de 90 dias, granularidade diária nos primeiros 30.

Entram:
- títulos a receber em aberto, ajustados pela probabilidade histórica de atraso do
  cliente (fase 2; na fase 1, pelo vencimento puro);
- títulos a pagar em aberto;
- recorrências previstas (aluguel, folha, impostos, assinaturas);
- pedidos confirmados ainda não faturados, com previsão de faturamento;
- compras aprovadas ainda não recebidas.

Não entram: previsão de vendas sem pedido. Isso é orçamento, vai em outro relatório e
não pode contaminar a projeção de caixa.

## Cenários

Três curvas na mesma tela: pessimista (recebimentos com atraso médio histórico),
realista (vencimentos) e otimista (tudo em dia). A diretoria decide olhando o pessimista
— é para isso que ele existe.

Alerta automático quando a projeção cruza zero ou o limite mínimo de caixa definido.

## DRE gerencial

Regime de competência, separado do caixa:

```
Receita bruta
(-) Deduções: impostos sobre venda, devoluções
= Receita líquida
(-) CMV (custo médio dos produtos vendidos, de [estoque] e [producao-pcp])
= Margem bruta
(-) Despesas operacionais por centro de custo
= EBITDA
(-) Depreciação, resultado financeiro
= Resultado líquido
```

Toda linha é clicável até o documento de origem. DRE que não permite auditar o número
não é usado por ninguém — vira planilha paralela.

## Implementação

View materializada por competência e por caixa, atualizada por job noturno e sob demanda
(ver [caching]). Valor sempre `Decimal`. A data de corte de período usa o fuso
`America/Sao_Paulo` (ver [i18n-ptbr]).

Exportação para XLSX com a mesma estrutura da tela, porque o contador e a diretoria vão
pedir. Use a skill `xlsx` para gerar.
