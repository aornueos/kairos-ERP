---
name: difal
description: DIFAL — diferencial de alíquota do ICMS no KAIROS, para venda a consumidor final de outra UF e compra de ativo ou uso e consumo. Use ao configurar tributação interestadual ou apurar DIFAL.
---

# DIFAL

Diferença entre a alíquota interna do estado de destino e a interestadual, devida em duas
situações distintas.

## 1. Venda a consumidor final não contribuinte de outra UF

Caso típico do e-commerce da Pure.us: cliente pessoa física em outro estado.

```
base = valor da operação (com a regra de base dupla quando a UF exigir)
difal = base * (aliquota_interna_destino - aliquota_interestadual)
fcp   = base * aliquota_fcp_destino
```

- Desde 2019 o DIFAL é 100% do estado de destino.
- Recolhimento pela GNRE por UF, ou por inscrição estadual como substituto naquela UF
  quando o volume justificar.
- A EC 87/2015 e a LC 190/2022 definem a regra; a base de cálculo "por dentro" varia por
  UF. Confirme com o contador estado a estado onde houver volume.

## 2. Compra de ativo ou material de uso e consumo de outra UF

A Pure.us compra equipamento de laboratório ou insumo de uso interno de fornecedor de
outra UF: a diferença de alíquota é devida no destino, ou seja, aqui.

Isso entra na apuração do ICMS e precisa ser lançado na entrada, não descoberto no
fechamento.

## Quando não se aplica

- Venda a contribuinte que vai revender: aí é ICMS próprio, e possivelmente ST
  (ver [icms-st]).
- Venda dentro da mesma UF.
- Insumo que entra na produção: gera crédito, não DIFAL.

A distinção entre "consumidor final", "contribuinte" e "revenda" depende do indicador de
IE do destinatário e da finalidade declarada. O cadastro do parceiro precisa desse campo
correto — é a origem de boa parte dos erros.

## Implementação

Mesma tabela `regra_tributaria` do [icms-st], com vigência e por UF. O motor fiscal
decide entre ICMS próprio, ST e DIFAL a partir de NCM, CFOP, UF e tipo de destinatário.
A nota fiscal leva o grupo de partilha do ICMS preenchido.

## Apuração

Relatório mensal de DIFAL por UF com a guia a recolher e o vencimento, gerando título em
[contas-pagar-receber]. Atraso em GNRE é multa que ninguém percebe até chegar a
notificação.
