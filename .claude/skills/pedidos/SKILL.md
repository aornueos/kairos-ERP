---
name: pedidos
description: Ciclo de vida do pedido de venda no KAIROS — estados, transições, reserva de estoque, separação e integração com faturamento. Use ao implementar ou alterar qualquer regra do pedido.
---

# Pedido de venda

Agregado central do fluxo comercial. É o documento que amarra vendas, estoque,
faturamento e financeiro.

## Estados

```
RASCUNHO -> AGUARDANDO_APROVACAO -> CONFIRMADO -> EM_SEPARACAO -> SEPARADO
         -> FATURADO -> ENTREGUE
qualquer um (antes de FATURADO) -> CANCELADO
```

| Transição | Efeitos |
|---|---|
| confirmar | valida crédito e saldo, reserva estoque, evento `pedido.confirmado` |
| aprovar | libera desconto ou crédito pendente, volta para confirmado |
| separar | gera lista de separação por FEFO, define lotes |
| faturar | ver [faturamento]; converte reserva em saída |
| cancelar | libera reservas, registra motivo; bloqueado após faturado |

Transição inválida lança `ConflitoError` (409). A máquina de estados fica no domínio,
em um lugar só, não espalhada em `if` nas telas.

## Estrutura

```
pedido(id, tenant_id, numero, cliente_id, vendedor_id, canal, tabela_preco_id,
       condicao_pagamento_id, situacao, valor_produtos, valor_desconto, valor_frete,
       valor_total, previsao_entrega, observacao, criado_em)
pedido_item(id, pedido_id, produto_id, quantidade, preco_unitario, desconto,
            valor_total, lote_id, observacao)
```

Totais são recalculados no domínio a cada alteração de item e conferidos por `check` no
banco. Cliente não digita total.

## Reserva de estoque

Confirmação reserva por item (ver [estoque]). Sem saldo: escolha explícita do usuário
entre reduzir a quantidade, gerar pendência (backorder) ou solicitar produção (gera
sugestão de OP em [producao-pcp]). Nunca confirme pedido silenciosamente sem saldo — é
assim que se promete entrega que não acontece.

Reserva expira em 72 horas por padrão e o job libera o saldo, notificando o vendedor.

## Separação

Lista por endereço de depósito e FEFO, com conferência por leitura de código de barras
(GTIN + lote). Divergência na conferência não altera o pedido sozinha: abre pendência
para o vendedor decidir faturar parcial ou aguardar.

## Faturamento parcial

Permitido, com controle de saldo por item (`quantidade_faturada`). O pedido só vai para
`FATURADO` quando todos os itens estiverem atendidos ou o restante for cancelado com
motivo.

## Entrada por integração

Pedido de marketplace e e-commerce chega por API já como `CONFIRMADO`, com origem e id
externo gravados. Regras de crédito e saldo valem igual; falha vira pendência na tela de
integrações, nunca descarte silencioso. Ver [integracao-marketplaces].

## Impressões

Confirmação do pedido em PDF para o cliente, lista de separação para o depósito e
romaneio para a expedição. Todas com o número do pedido em código de barras.
