---
name: financeiro
description: Visão geral do módulo financeiro do KAIROS — contas, naturezas, integração com faturamento e compras, e regras que valem para todo o financeiro. Use como porta de entrada antes de mexer em títulos, caixa ou conciliação.
---

# Financeiro

Reúne contas a pagar e receber, tesouraria, conciliação e a ponte com a contabilidade.
É o módulo que a diretoria olha todo dia; precisa fechar até o centavo.

## Entidades base

```
conta_financeira(id, tenant_id, tipo, banco, agencia, numero, saldo_inicial, ativo)
   -- tipo: CAIXA | CORRENTE | APLICACAO | CARTAO | GATEWAY
natureza_financeira(id, tenant_id, codigo, nome, tipo, conta_contabil_id)
   -- árvore: Receita de vendas, Insumos, Embalagens, Folha, Impostos, Marketing...
titulo(id, tenant_id, tipo, numero, parceiro_id, natureza_id, centro_custo_id,
       emissao, vencimento, valor, saldo, situacao, documento_origem)
movimento_financeiro(id, tenant_id, conta_id, titulo_id, tipo, valor, data,
                     forma_pagamento, conciliado_em, estorna_id)
```

`titulo.tipo` é `PAGAR` ou `RECEBER`. `movimento_financeiro` é imutável: correção é
estorno com vínculo ao original.

## Regras gerais

1. Todo título nasce de um documento (nota, entrada de compra, contrato, folha) ou de
   lançamento manual com natureza obrigatória. Título sem origem não existe.
2. Saldo do título = valor - baixas - descontos + juros e multa. Nunca negativo.
3. Baixa não altera o título original: cria movimento e atualiza o saldo na mesma
   transação.
4. Data de competência (regime de competência) e data de caixa (regime de caixa) são
   campos distintos. Confundir as duas produz DRE errado.
5. Lançamento em período fechado é bloqueado (ver [contabilidade]).
6. Toda operação financeira exige permissão específica e cai em [audit-trail].

## Formas de recebimento

Boleto ([boleto], [cnab]), PIX ([pix]), cartão via gateway
([integracao-gateways-pagamento]), dinheiro e transferência. Cada forma tem taxa e prazo
de liquidação próprios: o recebimento bruto vira líquido mais despesa financeira, e o
DRE precisa dos dois.

## Fechamento do dia

Rotina diária: conferir saldo de cada conta contra o extrato, revisar títulos vencidos,
conferir recebimentos do gateway e do PIX, e lançar as despesas do dia. A tela de
fechamento mostra o que ainda diverge e não deixa fechar com pendência sem justificativa.

## Indicadores

Inadimplência (valor e percentual), prazo médio de recebimento e de pagamento, ciclo
financeiro, despesa financeira sobre faturamento, e a projeção de caixa de
[fluxo-caixa].

## Integração contábil

Cada natureza aponta para conta contábil. As baixas e os faturamentos geram lançamentos
contábeis automáticos pelo modelo de partidas configurado em [contabilidade]. O contador
externo recebe o SPED e os relatórios mensais sem redigitar nada.
