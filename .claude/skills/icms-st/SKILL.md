---
name: icms-st
description: ICMS-ST (substituição tributária) no KAIROS — cosméticos, MVA, base de cálculo, protocolos entre UFs, FCP e ressarcimento. Use ao configurar tributação de produto ou apurar ST.
---

# ICMS-ST

Cosméticos estão entre os produtos mais afetados por substituição tributária. Para uma
fábrica como a Pure.us, isso é regra, não exceção: em boa parte das vendas interestaduais
a empresa é **substituta** e recolhe o ICMS de toda a cadeia.

## Quando se aplica

Depende de três coisas ao mesmo tempo:

1. **Produto**: NCM e CEST na lista do convênio. Preparações capilares (NCM 3305) têm
   CEST específico e estão em regime de ST em muitas UFs.
2. **UF de destino**: há protocolo ou convênio entre a UF de origem e a de destino para
   aquele segmento.
3. **Destinatário**: contribuinte que vai revender (ST se aplica) ou consumidor final
   (aí é DIFAL, ver [difal]).

Não existe atalho: a matriz produto x UF x tipo de destinatário precisa ser cadastrada e
revisada com o contador.

## Cálculo

```
base_st = (valor_produto + IPI + frete + seguro + despesas - desconto) * (1 + MVA)
icms_st = base_st * aliquota_interna_destino - icms_proprio
```

- MVA vem da tabela por NCM/CEST e UF de destino.
- **MVA ajustada** quando a alíquota interestadual difere da interna do destino:
  `MVA_aj = ((1 + MVA) * (1 - aliq_inter) / (1 - aliq_interna)) - 1`.
- FCP-ST (fundo de combate à pobreza) soma-se em várias UFs, com alíquota própria.
- Regime do destinatário pode alterar o resultado.

## Modelagem

```
regra_tributaria(id, tenant_id, ncm, cest, uf_origem, uf_destino, tipo_destinatario,
                 cfop, cst, aliquota_icms, mva, aliquota_interna_destino, fcp,
                 reducao_base, vigencia_inicio, vigencia_fim)
```

Sempre com vigência: alíquota e MVA mudam, e nota antiga precisa continuar explicável.
O cálculo pega a regra vigente na data de emissão, nunca a atual.

## Onde mora

Módulo `fiscal`, chamado por porta no [faturamento]. Nunca calcule imposto em `vendas`
nem na tela. Um só motor de cálculo, usado por pedido (simulação), faturamento (efetivo)
e relatórios.

## Apuração e obrigações

ST recolhida por GNRE por UF de destino, com vencimento próprio por estado.
A apuração mensal separa ICMS próprio e ST por UF, e alimenta [sped-fiscal].
Inscrição estadual de substituto tributário nas UFs onde houver volume evita recolher
nota a nota.

## Ressarcimento

Mercadoria com ST já recolhida que é devolvida, vendida a não contribuinte ou remetida
para outra UF gera direito a ressarcimento ou complemento. Controle essa movimentação
desde o início: reconstruir depois é praticamente inviável.

## Validação

Antes de ir para produção, compare o cálculo do KAIROS com o do provedor fiscal e com
notas reais conferidas pelo contador. Diferença de centavos na base de ST reprova a nota
na SEFAZ e, pior, gera passivo quando passa despercebida.
