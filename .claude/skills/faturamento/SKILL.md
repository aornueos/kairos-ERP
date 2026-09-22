---
name: faturamento
description: Faturamento no KAIROS — a transação que converte pedido em nota fiscal, baixa de estoque e títulos a receber. Use ao alterar qualquer parte desse fluxo, que é o ponto mais crítico do sistema.
---

# Faturamento

O caso de uso mais perigoso do ERP: toca estoque, fiscal e financeiro ao mesmo tempo.
Estado inconsistente aqui aparece como divergência de estoque, nota sem título ou título
sem nota — sempre descoberto tarde.

## Orquestração

`src/modules/faturamento/application/faturar-pedido.ts` é o único lugar autorizado a
abrir transação que cruza módulos (exceção registrada em ADR; ver [modular-monolith]).

```
transação:
  1. carrega pedido, valida situação (CONFIRMADO ou SEPARADO)
  2. valida lotes, validade e saldo reservado
  3. calcula tributos (porta do módulo fiscal)
  4. cria NotaFiscal em situação PENDENTE, com número e série reservados
  5. converte reserva em SAIDA_VENDA no estoque
  6. gera títulos a receber conforme a condição de pagamento
  7. atualiza pedido para FATURADO
  8. grava evento pedido.faturado na outbox
commit
--- fora da transação ---
  9. job envia a nota ao provedor fiscal (ver [nfe])
 10. autorização ou rejeição volta por webhook
```

A transmissão para a SEFAZ fica **fora** da transação de banco. Chamada externa dentro de
transação segura conexão, estoura timeout e deixa o banco travado no pior momento.

## Estados da nota

```
PENDENTE -> TRANSMITINDO -> AUTORIZADA
                         -> REJEITADA -> (corrige) -> PENDENTE
AUTORIZADA -> CANCELADA (prazo legal) | DENEGADA
```

Rejeição não desfaz o faturamento: mantém o documento, registra o motivo com o código da
SEFAZ e devolve a correção ao usuário. Se a correção exigir mudar item ou valor, o
faturamento é estornado por completo (estoque volta, títulos são cancelados) e refeito.
Estorno é operação registrada, com permissão própria.

## Numeração

Número e série vêm do contador por tenant com lock (ver [migrations]). Numeração fiscal
não pode ter buraco: se a nota for inutilizada, registre a inutilização junto à SEFAZ.

## Condição de pagamento e títulos

```
30/60/90 sobre 3.000,00 -> 3 títulos de 1.000,00 com vencimentos calculados
```

Regras: dias corridos a partir da emissão, ajuste para o próximo dia útil quando a
condição exigir, e a diferença de centavos vai na primeira parcela. Cada título guarda o
número da nota e da parcela — o cliente vai perguntar.

## Faturamento em lote

Tela seleciona vários pedidos e fatura em job com progresso, resultado por pedido e
lista do que falhou com o motivo. Um pedido com erro não derruba os outros: cada um tem
a própria transação.

## Conferência diária

Job noturno confere: toda nota autorizada tem movimento de estoque e títulos
correspondentes; todo pedido faturado tem nota. Divergência gera alerta imediato para o
administrador. Em ERP, essa conferência é o que transforma "provavelmente está certo"
em "está certo".
