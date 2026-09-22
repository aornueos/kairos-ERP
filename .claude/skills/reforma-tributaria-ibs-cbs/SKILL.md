---
name: reforma-tributaria-ibs-cbs
description: Reforma tributária (IBS, CBS, Imposto Seletivo) no KAIROS — cronograma de transição, impacto no cadastro, no cálculo e no documento fiscal. Use ao modelar tributos, planejar o roadmap fiscal ou avaliar impacto de prazo.
---

# Reforma tributária: IBS e CBS

A EC 132/2023 e a LC 214/2025 substituem PIS, COFINS, IPI, ICMS e ISS por CBS (federal) e
IBS (estadual e municipal), mais o Imposto Seletivo. A transição ocupa o fim da década e
atravessa todo o ciclo de vida do KAIROS.

> Datas, alíquotas e regras mudam com regulamentação nova. **Confirme sempre com o
> contador da Pure.us antes de implementar.** Este documento orienta a arquitetura, não
> substitui a norma.

## Cronograma (linhas gerais)

| Período | O que acontece |
|---|---|
| 2026 | Ano de teste: CBS e IBS com alíquotas simbólicas, compensáveis; obrigação principalmente de informação no documento fiscal |
| 2027 | CBS plena; PIS e COFINS extintos; IPI zerado (salvo Zona Franca); Imposto Seletivo entra |
| 2029 a 2032 | IBS sobe em degraus; ICMS e ISS caem proporcionalmente |
| 2033 | Somente IBS e CBS |

## Consequência arquitetural

O sistema precisa calcular **dois regimes ao mesmo tempo** por vários anos. Isso decide a
modelagem desde já:

1. O motor fiscal é uma porta com implementações por vigência, não um punhado de `if`.
   `calcularTributos(documento, dataOperacao)` escolhe a regra vigente.
2. `regra_tributaria` já nasce com `vigencia_inicio` e `vigencia_fim` (ver [icms-st]).
   Nota antiga precisa continuar sendo recalculável com a regra da época.
3. Documento fiscal guarda o **detalhamento por tributo** em estrutura extensível, não em
   colunas fixas de ICMS, PIS e COFINS. Acrescentar IBS e CBS não pode exigir migração
   de todas as tabelas.
4. Relatórios de tributo leem essa estrutura genérica, não campos cravados.

Quem cravou ICMS, PIS, COFINS e IPI como colunas fixas vai pagar caro na transição. Essa
é a principal razão de a decisão estar registrada em ADR.

## Impacto para a Pure.us

- **Crédito amplo**: no IBS/CBS, o crédito é financeiro e amplo (não cumulativo pleno).
  Insumo, embalagem, energia e serviços passam a gerar crédito com menos restrição, o que
  muda o custo real do produto e a precificação.
- **Destino**: o tributo passa a ser devido no destino. A lógica de ST e DIFAL como
  conhecemos desaparece ao longo da transição.
- **Cosméticos**: sem alíquota reduzida prevista, ficam na alíquota padrão. Não estão no
  escopo do Imposto Seletivo (que mira tabaco, bebidas, veículos e itens similares).
- **Split payment**: recolhimento no momento da liquidação financeira, previsto na lei.
  Isso liga fiscal e financeiro de um jeito novo: o recebimento passa a carregar
  informação tributária. Planeje a conciliação considerando isso.

## Documento fiscal

O layout da NF-e recebeu grupos novos para IBS, CBS e IS. O provedor externo
(ver [nfe]) absorve a mudança de schema, mas os **dados de entrada** são nossos: cadastro
de produto com classificação nova, indicadores de crédito e regime do destinatário
precisam estar corretos antes.

## Plano

1. Agora: modelar tributos de forma extensível e com vigência. Não cravar nada.
2. 2026: acompanhar o ano de teste com o contador; conferir se o provedor já envia os
   grupos novos; validar o cadastro de produtos.
3. 2027: CBS plena — revisar precificação e margem com o crédito ampliado.
4. 2029 em diante: acompanhar os degraus de IBS ano a ano, com regra por vigência.

Revisão obrigatória deste documento a cada semestre, junto com o contador.
