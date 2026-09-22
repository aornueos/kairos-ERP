---
name: esocial
description: eSocial no KAIROS — escopo adotado, eventos, dados fornecidos ao escritório contábil e controle de prazos. Use ao tratar obrigações trabalhistas e previdenciárias.
---

# eSocial

## Decisão de escopo

O KAIROS **não transmite** eSocial. A transmissão é do escritório contábil, coerente com
a decisão de não calcular folha ([folha-pagamento]). O que fazemos: fornecer dados
corretos no prazo e guardar os recibos.

Transmitir eSocial exige acompanhar leiautes, certificado, filas de retorno e regras
trabalhistas em mudança constante. Não se paga para uma indústria pequena.

## Eventos e o que alimentamos

| Evento | Descrição | Origem no KAIROS |
|---|---|---|
| S-2200 | Admissão | [rh] |
| S-2206 | Alteração contratual | [rh] |
| S-2230 | Afastamento temporário | [rh] |
| S-2299 | Desligamento | [rh] |
| S-1200 | Remuneração | folha importada |
| S-1210 | Pagamentos | [contas-pagar-receber] |
| S-2210 | CAT (acidente de trabalho) | [rh] |
| S-2220 | Monitoramento da saúde (ASO) | [rh] |
| S-2240 | Condições ambientais (agentes químicos) | [rh] |

Os dois últimos importam em fábrica de cosméticos: há exposição a agentes químicos, e o
S-2240 depende do PGR e do LTCAT. Manter EPI, função e exposição atualizados no cadastro
do colaborador é o que permite ao contador cumprir o prazo.

## Prazos críticos

- Admissão: até o dia anterior ao início do trabalho. Perder esse prazo gera multa —
  alerta no sistema no momento do cadastro, não depois.
- Afastamento acima de 15 dias: até o 16º dia.
- CAT: primeiro dia útil após o acidente; imediato em caso de óbito.
- Desligamento: até 10 dias.

O KAIROS alerta o RH sobre cada prazo e registra a data de envio ao contador.

## Guarda

Recibos de entrega recebidos do contador ficam anexados ao colaborador e ao evento
correspondente, com data. É a prova de cumprimento em fiscalização.

## Privacidade

Dados trabalhistas e de saúde são sensíveis (ver [lgpd] e [rh]): acesso restrito,
auditoria de leitura, e transmissão ao contador por canal seguro, nunca por e-mail sem
proteção.
