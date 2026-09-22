---
name: sped-fiscal
description: SPED Fiscal (EFD ICMS/IPI) e EFD-Contribuições no KAIROS — origem dos dados, blocos, inventário, validação e entrega. Use ao gerar arquivo fiscal mensal ou corrigir divergência apontada pelo validador.
---

# SPED Fiscal

Obrigação mensal de escrituração digital. O KAIROS gera o arquivo; o contador valida no
PVA e transmite. Meta: o contador não redigitar nada.

## Origem dos dados

| Bloco | Conteúdo | Origem no KAIROS |
|---|---|---|
| 0 | Abertura, empresa, participantes, produtos, unidades | cadastros |
| C | Documentos fiscais de mercadoria (NF-e entrada e saída) | fiscal |
| D | Documentos de serviço de transporte (CT-e) | [cte] |
| E | Apuração de ICMS e IPI | fiscal |
| G | CIAP (crédito de ICMS do ativo) | [ativos-patrimonio] |
| H | Inventário (bloco anual, registro 1 de cada ano) | [estoque] |
| K | Controle da produção e do estoque | [producao-pcp] |
| 1 | Outras informações e ST | fiscal |

## Bloco K (produção)

Obrigatório para indústria, conforme faturamento e CNAE. Registra consumo de insumo e
produção de acabado por período. A Pure.us fabrica: verifique com o contador se está
obrigada. Se estiver, os apontamentos de OP em [producao-pcp] precisam ser fiéis — o
bloco K é gerado a partir deles, e divergência com o estoque é fiscalizável.

Essa é a razão prática para exigir apontamento correto de lote e quantidade na produção,
além do controle interno.

## Bloco H (inventário)

Inventário de 31/12, entregue no arquivo de fevereiro. Requer quantidade e **custo** de
cada item em estoque na data. Depende do custo médio confiável em [estoque]: se o custo
estiver errado, o inventário fiscal também estará.

## Geração

Job mensal que monta o arquivo texto no layout vigente (o guia prático muda quase todo
ano), com validação prévia:

- todo produto movimentado tem NCM, unidade e código consistentes no bloco 0;
- todo participante tem CNPJ/CPF e IE válidos;
- totais de C190 batem com os itens;
- apuração do E110 bate com os débitos e créditos do período;
- período está fechado em [contabilidade].

Erro encontrado aparece em português, com o registro e o documento que o causou, e link
para corrigir. Sem isso, o contador devolve um relatório do PVA e ninguém sabe onde mexer.

## EFD-Contribuições

Mesma lógica para PIS e COFINS, com blocos próprios (A, C, D, F, M). Regime cumulativo ou
não cumulativo muda tudo: parametrize por tenant, nunca no código.

## Guarda e retificação

Arquivo gerado, recibo de entrega e versão do layout ficam guardados por 5 anos.
Retificação gera arquivo novo com indicador de retificação, preservando o original — o
histórico de retificações é o que se apresenta em fiscalização.
