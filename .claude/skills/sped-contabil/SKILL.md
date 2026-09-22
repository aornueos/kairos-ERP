---
name: sped-contabil
description: SPED Contábil (ECD) e ECF no KAIROS — exportação dos lançamentos para o contador, plano referencial e balancete. Use ao preparar a entrega contábil anual ou exportar a escrituração.
---

# SPED Contábil (ECD) e ECF

Entrega anual, responsabilidade do escritório contábil. O papel do KAIROS é fornecer a
escrituração completa e consistente, sem redigitação.

## O que exportamos

| Bloco ECD | Conteúdo | Origem |
|---|---|---|
| 0 | Abertura e identificação | cadastro do tenant |
| I | Lançamentos contábeis, plano de contas, plano referencial, saldos periódicos | [contabilidade], [plano-de-contas] |
| J | Demonstrações: balanço e DRE | relatórios contábeis |
| K/9 | Encerramento e assinaturas | contador |

## Pré-requisitos de qualidade

O arquivo só presta se a base estiver correta. Antes de exportar, verifique:

- todos os meses do exercício fechados em [contabilidade];
- nenhum lançamento pendente na fila contábil;
- toda conta analítica com mapeamento para o plano referencial da Receita;
- balancete fechando (débitos iguais a créditos em cada período);
- saldos de estoque, caixa e clientes conciliados com os módulos operacionais;
- centros de custo preenchidos onde obrigatórios.

A tela de "Preparação para o contador" roda essa lista e mostra o que falta, com link
para cada pendência. Descobrir em abril que faltou fechar agosto é caro.

## Formato

Arquivo texto no layout do ano-calendário. O layout muda anualmente: a versão usada fica
registrada junto ao arquivo gerado, e o gerador é versionado por ano
(`sped/ecd/2026/gerador.ts`), sem `if` espalhado por versão.

## ECF

Escrituração Contábil Fiscal, para apuração de IRPJ e CSLL. Depende da ECD e do regime
tributário. Gerada pelo contador a partir da ECD e dos dados fiscais; o KAIROS fornece os
relatórios de apoio (receitas por CFOP, despesas por natureza, movimentação do
imobilizado).

## Escopo

Fase 3. Enquanto isso, a entrega ao contador é o pacote mensal descrito em
[contabilidade]: balancete, razão, diário e relação de documentos em XLSX e PDF.
Isso já elimina a maior parte da redigitação.
