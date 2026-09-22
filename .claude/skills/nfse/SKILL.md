---
name: nfse
description: NFS-e (nota de serviço) no KAIROS — quando a Pure.us presta serviço, padrão nacional, ISS e retenções. Use ao emitir nota de serviço ou tratar ISS.
---

# NFS-e

Nota de serviço. Na Pure.us aparece em situações pontuais: industrialização por encomenda
para terceiros (envase de marca própria), treinamento técnico para salões, consultoria e
locação de espaço.

## Padrão nacional

O padrão nacional da NFS-e (ambiente unificado) substituiu progressivamente os layouts
municipais. Ainda assim, cada município tem particularidades de código de serviço e
alíquota. O provedor externo abstrai a comunicação — a mesma decisão da [nfe].

## Dados

- Prestador: CNPJ, inscrição municipal, regime (Simples, Presumido, Real).
- Tomador: CNPJ/CPF, endereço, e-mail.
- Serviço: código da lista nacional (LC 116) e o código municipal correspondente,
  descrição, valor, deduções.
- ISS: alíquota, base, município de incidência, e se é retido na fonte pelo tomador.
- Retenções federais: IRRF, PIS, COFINS, CSLL e INSS conforme o tipo de serviço e o
  valor.

## Regras que costumam morder

- **Local de incidência**: em regra o ISS é do município do prestador, mas há lista de
  exceções em que é do tomador. Industrialização por encomenda tem tratamento próprio e
  pode ser fato gerador de IPI/ICMS em vez de ISS — confirme com o contador antes de
  emitir.
- **Retenção**: tomador pessoa jurídica pode ser obrigado a reter ISS e federais. A nota
  sai com o valor bruto e o líquido a receber é menor: o título gerado em
  [contas-pagar-receber] precisa refletir o líquido, com as retenções registradas como
  impostos a recuperar.
- **Simples Nacional**: alíquota efetiva vem do anexo e do faturamento acumulado, não é
  fixa.

## Fluxo

Igual ao da NF-e: documento em `PENDENTE`, job envia ao provedor, webhook confirma,
XML e PDF guardados por 5 anos. Cancelamento e substituição seguem regra municipal.

## Escopo

Fase 3, ou antes se a industrialização por encomenda começar. Enquanto não houver,
mantenha o módulo desativado por parâmetro do tenant em vez de meio implementado.
