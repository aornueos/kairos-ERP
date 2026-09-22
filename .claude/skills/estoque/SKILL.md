---
name: estoque
description: Módulo de estoque do KAIROS — saldo, lote, validade, FEFO, depósitos, reserva, inventário, custo médio e rastreabilidade de cosméticos. Use ao mexer em movimentação, saldo, lote ou custo de produto.
---

# Estoque

Contexto crítico do KAIROS. Cosmético capilar tem lote, validade e rastreabilidade
obrigatórios (RDC ANVISA de cosméticos), e a Pure.us fabrica: o mesmo módulo controla
insumo, embalagem e produto acabado.

## Entidades

```
deposito(id, tenant_id, codigo, nome, tipo)        -- MATERIA_PRIMA | PRODUCAO | ACABADO | QUARENTENA | TERCEIRO
lote(id, tenant_id, produto_id, numero, fabricacao, validade, fornecedor_lote, situacao)
saldo_lote(tenant_id, produto_id, deposito_id, lote_id, quantidade, reservado, custo_medio)
movimento_estoque(id, tenant_id, produto_id, deposito_id, lote_id, tipo, quantidade,
                  custo_unitario, documento_tipo, documento_id, estorna_id, ocorrido_em)
reserva_estoque(id, tenant_id, pedido_item_id, lote_id, quantidade, situacao, expira_em)
```

`movimento_estoque` é imutável (ver [soft-delete]). `saldo_lote` é atualizado na mesma
transação do movimento, com lock por linha — é a projeção que as telas leem.

## Tipos de movimento

`ENTRADA_COMPRA` `ENTRADA_PRODUCAO` `ENTRADA_DEVOLUCAO` `ENTRADA_AJUSTE`
`SAIDA_VENDA` `SAIDA_PRODUCAO` `SAIDA_PERDA` `SAIDA_AMOSTRA` `SAIDA_AJUSTE`
`TRANSFERENCIA_SAIDA` `TRANSFERENCIA_ENTRADA`

Toda saída aponta o documento de origem. Movimento sem documento só existe em ajuste de
inventário, que exige permissão e justificativa.

## Regras invioláveis

1. Saldo de lote nunca fica negativo. Falta de saldo é erro de negócio, não ajuste
   silencioso.
2. Produto controlado por lote exige lote em toda movimentação.
3. Lote vencido não sai para venda nem entra em produção. Sai apenas como
   `SAIDA_PERDA` ou para depósito de quarentena.
4. Disponível = `quantidade - reservado`. Venda consome disponível; faturamento converte
   reserva em saída.
5. Movimento retroativo a período fechado é proibido (ver [contabilidade]).

## FEFO

Sugestão automática de lote é sempre "primeiro que vence, primeiro que sai".
Conferente pode trocar o lote com justificativa, e a troca fica em auditoria.
Vender lote mais novo quando há lote antigo no depósito é como o estoque envelhece e
vira perda.

## Custo

Custo médio ponderado móvel por produto e depósito, recalculado a cada entrada:

```
custo_medio = (saldo_anterior * custo_anterior + quantidade_entrada * custo_entrada)
              / (saldo_anterior + quantidade_entrada)
```

Frete, seguro e despesas acessórias da compra entram no custo. Impostos recuperáveis
(ICMS, PIS, COFINS, quando houver crédito) não entram. A decisão está em ADR e vale
para todo o sistema — CMV errado contamina a margem de toda a diretoria.

## Reserva

Pedido confirmado reserva; reserva tem validade (padrão 72 horas) e expira por job,
liberando o saldo. Faturamento converte reserva em saída dentro da mesma transação
(ver [faturamento]).

## Inventário

Contagem cega (o contador não vê o saldo do sistema), em duas contagens para divergência
acima de tolerância. Ao fechar: gera ajustes com motivo, bloqueia movimentação do
depósito durante a contagem, e registra tudo em auditoria. Fechar inventário exige
permissão própria.

## Rastreabilidade

Dado um lote de acabado, o sistema mostra: ordem de produção que o gerou, lotes de insumo
consumidos, fornecedores desses insumos e todas as notas em que o lote saiu, com cliente.
É o que responde a um recall ou a uma fiscalização, e precisa sair em uma tela, não em
consulta manual ao banco.

## Alertas

Saldo abaixo do mínimo, lote a vencer em 90/60/30 dias, produto sem giro há 180 dias,
divergência entre `saldo_lote` e a soma dos movimentos (conferência noturna).
