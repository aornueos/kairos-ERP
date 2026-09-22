# 0002 — Emissão fiscal por provedor externo

- Status: aceito
- Data: 2026-09-22
- Decisores: Raul (produto e engenharia)

## Contexto

A Pure.us emite NF-e em toda venda e, se houver venda presencial, NFC-e. Cosmético
capilar tem substituição tributária na maior parte das unidades federativas, o que torna
o cálculo sensível e específico.

Emitir direto na SEFAZ exige: assinatura XML com certificado A1, validação contra XSD por
UF, comunicação com webservices distintos, tratamento de contingência (SVC), consulta de
status e acompanhamento de notas técnicas que mudam o layout várias vezes por ano. Some-se
a isso a transição da reforma tributária, que altera os documentos fiscais ao longo da
década.

## Decisão

A emissão, o cancelamento, a carta de correção e a inutilização de documentos fiscais são
feitos por provedor externo com API (Focus NFe, PlugNotas, NFe.io ou equivalente).

O KAIROS é responsável por: montar os dados corretos, calcular os tributos conforme as
regras cadastradas, controlar numeração e série, guardar XML e PDF por cinco anos, e
tratar os retornos.

Consulta e recepção de documentos (DistribuiçãoDFe, manifestação do destinatário,
consulta de protocolo) podem ser feitas direto na SEFAZ com certificado A1, quando o
provedor não cobrir bem.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Emissão própria direto na SEFAZ | custo de manutenção alto e contínuo, risco de compliance concentrado numa equipe pequena |
| Biblioteca de terceiros auto-hospedada | reduz parte do trabalho, mas mantém a responsabilidade por layout, contingência e certificado |
| Emissor externo avulso (fora do ERP) | redigitação, divergência entre ERP e nota, e conciliação manual |

## Consequências

Positivas: mudança de layout e contingência deixam de ser problema nosso; o time
concentra esforço no domínio; risco de rejeição em massa cai.

Negativas: custo por nota; dependência de disponibilidade de terceiro; menor controle
sobre detalhes do XML. Mitigação: adapter atrás de porta (`ProvedorFiscal`), o que permite
trocar de provedor sem tocar o módulo fiscal, e testes com provedor simulado.

O cálculo dos tributos continua sendo nosso. O provedor não substitui o cadastro correto
de NCM, CEST, MVA e regras por UF, que precisa ser validado com o contador.

## Revisão

Revisitar se o custo por nota passar a ser material no resultado, se a qualidade do
provedor cair, ou se a reforma tributária simplificar a emissão a ponto de a manutenção
própria se pagar.
