---
name: contas-pagar-receber
description: Contas a pagar e a receber no KAIROS — geração de títulos, baixa total e parcial, juros e multa, desconto, estorno, renegociação e cobrança. Use ao implementar qualquer operação sobre título.
---

# Contas a pagar e a receber

## Origem dos títulos

| Origem | Tipo |
|---|---|
| Faturamento de pedido | RECEBER, uma parcela por condição de pagamento |
| Entrada de nota de compra | PAGAR |
| Folha e encargos | PAGAR |
| Impostos apurados | PAGAR |
| Lançamento manual (aluguel, energia, pró-labore) | PAGAR ou RECEBER |
| Recorrência (contrato, assinatura) | gerada por job com antecedência |

## Situações

```
ABERTO -> PARCIALMENTE_BAIXADO -> BAIXADO
       -> RENEGOCIADO
       -> CANCELADO
```

`VENCIDO` não é situação persistida: é `ABERTO` com `vencimento < hoje`. Guardar como
status exige job para "virar" todo dia e sempre dessincroniza.

## Baixa

```ts
baixarTitulo({
  tituloId, contaId, dataPagamento, valorPago,
  juros, multa, desconto, formaPagamento, observacao,
})
```

Regras:

- `valorPago + desconto <= saldo + juros + multa`. Sobra vira crédito do parceiro, nunca
  saldo negativo.
- Juros e multa são calculados pela regra do título (percentual ao mês e multa fixa),
  sugeridos na tela e editáveis com permissão.
- Baixa parcial mantém o título aberto com saldo remanescente.
- Baixa em lote (vários títulos do mesmo parceiro, um pagamento só) gera um movimento
  financeiro por título, com o mesmo identificador de pagamento.
- Toda baixa gera `movimento_financeiro` e evento `titulo.baixado`.

## Estorno

Não apaga a baixa: cria movimento de estorno vinculado, devolve o saldo ao título e
registra motivo, autor e data. Exige permissão `financeiro.titulo.estornar`. Estorno de
baixa já conciliada avisa que a conciliação bancária será desfeita.

## Renegociação

Cancela os títulos originais com situação `RENEGOCIADO` (não `CANCELADO`, para não sumir
do histórico), cria os novos com referência aos antigos e registra juros embutidos como
receita financeira. A tela mostra a cadeia completa.

## Cobrança (receber)

Régua configurável: aviso 3 dias antes, no vencimento, 5, 15 e 30 dias depois, por
e-mail e WhatsApp (ver [notifications]). Cliente com atraso acima do limite bloqueia
novo pedido (ver [vendas]). Registro de negociação e promessa de pagamento fica no
histórico do parceiro.

## Programação de pagamento

Seleção de títulos a pagar por data, fornecedor e conta, com totalizador e geração de
remessa CNAB ou PIX em lote (ver [cnab], [pix]). A aprovação da programação é separada
da execução do pagamento: quem monta não é quem paga, quando o time permitir.

## Telas

Listas com filtro por período, situação, parceiro, natureza e centro de custo; totais do
filtro no rodapé; e exportação. A tela de a receber mostra o aging (a vencer, 1-15,
16-30, 31-60, 60+) e permite abrir o extrato do parceiro em um clique.
