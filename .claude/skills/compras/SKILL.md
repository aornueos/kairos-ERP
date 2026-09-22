---
name: compras
description: Módulo de compras do KAIROS — requisição, cotação, pedido ao fornecedor, recebimento com conferência e entrada de nota. Use ao trabalhar em suprimentos, entrada de insumo ou custo de aquisição.
---

# Compras

Abastece a produção (insumos, embalagens, rótulos) e a revenda. O recebimento é o ponto
onde custo e rastreabilidade entram no sistema — errar aqui contamina margem e recall.

## Fluxo

```
REQUISICAO -> COTACAO -> PEDIDO_COMPRA -> RECEBIMENTO -> ENTRADA_NF -> TITULO_PAGAR
```

Na fase 1, requisição e cotação podem ser simplificadas (o comprador já sabe de quem
compra), mas o pedido de compra é obrigatório: sem ele não há conferência do que foi
combinado contra o que chegou.

## Entidades

```
requisicao_compra(id, tenant_id, numero, solicitante_id, centro_custo_id, situacao)
cotacao(id, requisicao_id, fornecedor_id, prazo_entrega, condicao_pagamento, valor_total)
pedido_compra(id, tenant_id, numero, fornecedor_id, situacao, previsao_entrega,
              valor_total, aprovado_por, aprovado_em)
pedido_compra_item(pedido_id, insumo_id, quantidade, preco_unitario, quantidade_recebida)
recebimento(id, tenant_id, pedido_compra_id, nota_fornecedor, chave_acesso, situacao)
recebimento_item(recebimento_id, item_id, quantidade, lote, fabricacao, validade, divergencia)
```

## Aprovação

Alçada por valor: até X o comprador aprova; acima, exige `compras.pedido.aprovar`.
Pedido aprovado que for alterado volta para aprovação. A alçada fica em parâmetro do
tenant, não no código.

## Recebimento

1. Conferência quantitativa contra o pedido de compra.
2. Conferência qualitativa: lote, validade, laudo do fornecedor, integridade da embalagem.
   Insumo cosmético sem laudo ou fora da especificação entra em **quarentena**, não no
   estoque disponível.
3. Divergência (falta, sobra, avaria, preço diferente) é registrada com motivo e decide
   o fluxo: aceitar, recusar parcialmente ou devolver.
4. Entrada de estoque só depois da liberação da qualidade.

Importar o XML da NF-e do fornecedor pela chave de acesso preenche itens, valores e
tributos, e reduz digitação e erro. O vínculo entre item do XML e insumo do cadastro é
aprendido por fornecedor (`de-para`) e reaproveitado na próxima compra.

## Custo de aquisição

```
custo_entrada = valor do item
              + frete e seguro rateados
              + despesas acessórias
              + IPI e ICMS-ST quando não recuperáveis
              - impostos recuperáveis conforme o regime
```

O rateio de frete é por valor, salvo indicação de rateio por peso. O custo resultante é o
que alimenta o custo médio em [estoque].

## Entrada de nota e financeiro

A entrada gera contas a pagar conforme a condição negociada, com centro de custo e conta
contábil por item ou por natureza da compra. Ver [contas-pagar-receber] e
[centro-de-custo].

## Fornecedores

Avaliação por prazo cumprido, divergências e qualidade dos lotes. Alerta de fornecedor
com documentação vencida (certificado, licença sanitária) antes de emitir novo pedido.
Alteração de dados bancários de fornecedor exige dupla confirmação e cai em auditoria —
é o golpe mais comum em contas a pagar.
