---
name: efd-reinf
description: EFD-Reinf no KAIROS — retenções na fonte sobre serviços tomados e prestados, eventos e prazos. Use ao tratar retenção de INSS, IR, PIS, COFINS e CSLL sobre serviços.
---

# EFD-Reinf

Escrituração das retenções e de outras informações previdenciárias que não estão no
eSocial. Transmissão é responsabilidade do escritório contábil; o KAIROS fornece os
dados e controla os prazos.

## Quando aparece na Pure.us

- Contratação de serviços com retenção de INSS (limpeza, vigilância, manutenção com
  cessão de mão de obra, transporte de carga em alguns casos).
- Retenção de IR, PIS, COFINS e CSLL sobre serviços tomados de pessoa jurídica acima do
  limite legal.
- Serviços prestados pela Pure.us com retenção pelo tomador (industrialização por
  encomenda, treinamento).

## Eventos relevantes

| Evento | Conteúdo |
|---|---|
| R-1000 | Informações do contribuinte |
| R-2010 | Serviços tomados com retenção de INSS |
| R-2020 | Serviços prestados com retenção de INSS |
| R-2098/R-2099 | Reabertura e fechamento do período |
| R-4010/R-4020 | Retenções de IR, CSLL, PIS e COFINS (pessoa física e jurídica) |

Prazo: até o dia 15 do mês seguinte, antecipado quando cair em dia não útil.

## O que o KAIROS controla

1. Marca o título a pagar de serviço com o código de retenção aplicável.
2. Calcula a retenção sugerida e reduz o valor líquido a pagar.
3. Gera o título do imposto retido com o vencimento correto (DARF, GPS).
4. Acumula por prestador para a conferência do limite mensal de dispensa.
5. Exporta o relatório do período no formato acordado com o contador.

A parametrização de códigos e alíquotas fica em tabela do tenant, revisada com o
contador. Nada de alíquota cravada no código: elas mudam.

## Cuidado

Reter a menor gera responsabilidade solidária da Pure.us pelo tributo. Reter a maior
prejudica o fornecedor e gera retrabalho. Quando o sistema não tiver certeza da
retenção, ele **pergunta** ao usuário e registra a decisão, em vez de escolher sozinho.

## Escopo

Fase 3, junto com [contabilidade] completa. Antes disso, a marcação de retenção nos
títulos e o relatório de apoio já atendem o contador.
