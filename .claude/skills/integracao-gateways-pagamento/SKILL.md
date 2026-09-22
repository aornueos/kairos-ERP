---
name: integracao-gateways-pagamento
description: Gateways de pagamento no KAIROS — cartão, taxas, antecipação, estorno, chargeback e conciliação de recebíveis. Use ao integrar meio de pagamento eletrônico ou conciliar cartão.
---

# Gateways de pagamento

Para cartão e carteiras digitais na loja própria e no PDV. PIX e boleto são tratados em
[pix] e [boleto], geralmente direto com o banco por custo menor.

## Conceitos que precisam estar no modelo

| Conceito | Efeito no ERP |
|---|---|
| Autorização | reserva do limite, não é recebimento |
| Captura | confirmação da cobrança |
| Liquidação | quando o dinheiro entra, em D+1 a D+30 |
| MDR | taxa do gateway, despesa financeira |
| Parcelamento | uma venda, várias parcelas de recebível |
| Antecipação | recebe antes com desconto: despesa financeira |
| Estorno | devolução ao cliente |
| Chargeback | contestação, com prazo de defesa |

Erro comum: tratar venda no cartão como recebimento imediato. O caixa recebe depois,
menos a taxa — e a projeção em [fluxo-caixa] fica errada se o modelo não separar as duas
coisas.

## Modelo

```
transacao_pagamento(id, tenant_id, gateway, id_externo, pedido_id, valor_bruto,
                    parcelas, bandeira, situacao, autorizado_em, capturado_em)
recebivel_cartao(id, transacao_id, parcela, valor_bruto, mdr, valor_liquido,
                 previsao_liquidacao, liquidado_em, antecipado)
```

Um título a receber por parcela, com a data prevista de liquidação, não a data da venda.

## Conciliação

Arquivo ou API de conciliação da adquirente, batido contra os recebíveis:
valor bruto, taxa e líquido, por transação. Divergências recorrentes: taxa diferente da
contratada, antecipação não solicitada, chargeback silencioso. Só a conciliação revela.

Alerta quando a taxa efetiva de um período passar do contratado — é dinheiro saindo sem
ninguém ver.

## Estorno e chargeback

Estorno gera movimento financeiro de saída vinculado à venda e, se houver devolução de
mercadoria, nota de devolução com retorno do estoque para quarentena.
Chargeback abre tarefa com prazo de defesa e documentos exigidos (comprovante de entrega,
nota, dados do pedido). Perder prazo é perder o valor.

## Segurança

O KAIROS **nunca** armazena número de cartão, CVV ou dados completos. Só token do
gateway, bandeira e últimos quatro dígitos. Tokenização no cliente, com o gateway.
Dado de cartão no banco significa escopo de PCI-DSS, auditoria e responsabilidade que a
empresa não quer — e não precisa.

## Escolha do gateway

Critérios: MDR por bandeira e parcelamento, prazo de liquidação, custo de antecipação,
qualidade da API de conciliação e suporte a PIX. Registre a escolha e os números em ADR:
a diferença de MDR entre provedores é material no resultado anual.
