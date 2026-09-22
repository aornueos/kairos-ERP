---
name: vendas
description: Módulo de vendas do KAIROS — canais, tabela de preços, desconto, comissão, crédito do cliente e metas. Use ao trabalhar em precificação, política comercial ou regra de venda.
---

# Vendas

A Pure.us vende por canais com preços e regras distintas: distribuidor, salão parceiro,
varejo e e-commerce próprio.

## Tabela de preços

```
tabela_preco(id, tenant_id, nome, canal, vigencia_inicio, vigencia_fim, ativo)
tabela_preco_item(tabela_id, produto_id, preco, desconto_max_percentual,
                  quantidade_minima)
```

- Preço nunca fica no cadastro do produto. Fica na tabela, com vigência.
- Cliente tem tabela padrão; o pedido pode usar outra com permissão.
- Preço por faixa de quantidade para atacado.
- Histórico preservado: o pedido grava o preço praticado e a tabela de origem. Alterar
  tabela não altera pedido antigo.

## Desconto

Limite por perfil e por produto. Acima do limite, o pedido entra em
`AGUARDANDO_APROVACAO` e alguém com `vendas.pedido.aprovar_desconto` decide, com
registro em auditoria. Desconto no total é rateado entre os itens proporcionalmente ao
valor, com a diferença de centavos no último item — a NF-e exige que a soma feche.

## Crédito do cliente

Verificação na confirmação do pedido:

1. limite de crédito definido no parceiro;
2. soma de títulos em aberto mais o pedido atual;
3. títulos vencidos acima de N dias.

Estouro bloqueia o pedido e notifica o financeiro. Liberação é ação explícita, com
justificativa e prazo, registrada em auditoria. Nunca libere em silêncio: é o controle
que impede vender para quem não paga.

## Comissão

```
comissao_regra(id, tenant_id, vendedor_id, canal, produto_grupo_id, percentual, base)
```

`base` é `FATURAMENTO` ou `RECEBIMENTO`. Padrão da casa: comissão apurada no faturamento
e provisionada, mas só liberada no recebimento do título. Devolução e cancelamento
estornam a comissão proporcional. A regra de apuração vale um ADR: mudar depois gera
discussão com a equipe comercial.

## Canais

| Canal | Preço | Condição típica | Fiscal |
|---|---|---|---|
| Distribuidor | tabela atacado | 30/60/90 | NF-e |
| Salão parceiro | tabela salão | boleto 28 dias | NF-e |
| Varejo (PDV/feira) | tabela varejo | à vista, PIX, cartão | NFC-e |
| E-commerce | tabela varejo | gateway | NF-e ao consumidor |

Ver [nfe], [nfce] e [integracao-ecommerce].

## Metas e acompanhamento

Meta por vendedor, canal e mês, com acompanhamento diário no painel: realizado, projeção
pelo ritmo atual e quanto falta. Curva ABC de clientes e produtos, e alerta de cliente
sem compra há 60 dias, que alimenta a rotina do [crm].

## Devolução

Devolução total ou parcial gera nota de entrada, retorna o estoque **no lote original**
(insumo cosmético devolvido pode estar impróprio: entra em quarentena por padrão),
estorna títulos e comissão. Nunca apague a venda original.
