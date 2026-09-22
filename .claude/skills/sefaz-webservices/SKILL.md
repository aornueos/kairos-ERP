---
name: sefaz-webservices
description: Webservices da SEFAZ no KAIROS — o que fazemos direto (consulta, manifestação, download de XML), o que fica com o provedor, certificado e contingência. Use ao consultar documentos na SEFAZ ou avaliar emissão própria.
---

# Webservices SEFAZ

## Fronteira da decisão

**Emissão (autorização, cancelamento, CC-e, inutilização) é do provedor externo**
(ADR-0002, ver [nfe]). Manter assinatura XML, XSD por UF, contingência SVC e a mudança
constante de layout não se paga para uma indústria pequena.

**Consulta e recepção podem ser diretas**, com certificado A1, quando o provedor não
cobrir bem:

| Serviço | Uso |
|---|---|
| `NFeDistribuicaoDFe` | baixar XMLs de notas emitidas **contra** o CNPJ da Pure.us |
| `RecepcaoEvento` (manifestação) | ciência, confirmação ou desconhecimento da operação |
| `NfeConsultaProtocolo` | conferir situação de uma nota pela chave |
| `NfeStatusServico` | disponibilidade da SEFAZ, para diagnóstico |

## DistribuiçãoDFe: por que importa

É como a empresa descobre notas emitidas contra seu CNPJ sem depender do fornecedor
mandar o XML por e-mail. O job diário busca por NSU incremental, guarda os XMLs e cruza
com os pedidos de compra em aberto ([compras]), avisando sobre:

- nota de fornecedor chegando sem pedido correspondente;
- nota emitida contra o CNPJ que a empresa não reconhece (indício de fraude);
- divergência de valor entre pedido e nota.

Guarde o último NSU processado por tenant. Consultar sempre do zero gera bloqueio por
consumo indevido.

## Manifestação do destinatário

Obrigatória em alguns casos e útil sempre. "Desconhecimento da operação" é a defesa
formal contra nota emitida indevidamente contra o CNPJ — e tem prazo. O sistema alerta
sobre notas não manifestadas.

## Certificado digital

A1 (arquivo) em cofre de segredos, nunca no repositório nem em coluna de banco.
Senha separada do arquivo. Alerta de vencimento em 60, 30 e 7 dias: certificado vencido
para a emissão fiscal inteira, e a renovação não é instantânea.

Acesso ao certificado é auditado. Em produção, apenas o worker que faz as consultas tem
permissão de leitura.

## Ambiente e limites

Homologação (`tpAmb=2`) para testes, com dados claramente fictícios. Produção só depois
de conferência com o contador.

A SEFAZ limita consultas por CNPJ e por hora. Respeite o intervalo mínimo entre chamadas,
trate `cStat` de bloqueio por consumo indevido com recuo maior, e nunca repita consulta em
laço apertado.

## Indisponibilidade

SEFAZ fora do ar é rotina. O sistema marca o documento como pendente, alerta e tenta de
novo com backoff. A contingência da emissão é do provedor. Para consultas, atraso é
aceitável: nada de bloquear tela esperando resposta.
