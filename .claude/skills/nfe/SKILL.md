---
name: nfe
description: NF-e (modelo 55) no KAIROS via provedor externo — emissão, autorização, rejeição, cancelamento, CC-e, inutilização e guarda do XML. Use ao trabalhar em qualquer parte da emissão fiscal de venda.
---

# NF-e

Decisão arquitetural (ADR-0002): **emissão por provedor externo** (Focus NFe, PlugNotas,
NFe.io ou equivalente). O KAIROS monta os dados, o provedor cuida de assinatura,
schema, comunicação com a SEFAZ e contingência.

Isso evita manter XSD, certificado e webservices de 27 UFs — e evita virar refém da
próxima mudança de layout.

## Fluxo

```
Faturamento cria NotaFiscal PENDENTE (ver [faturamento])
 -> job monta o payload e envia ao provedor (Idempotency-Key = id da nota)
 -> provedor responde processando
 -> webhook de autorização/rejeição ([webhooks])
 -> AUTORIZADA: guarda XML e chave, gera DANFE, dispara e-mail ao cliente
 -> REJEITADA: registra código e motivo da SEFAZ, devolve ao usuário
```

Nunca reenvie cegamente após timeout: consulte o status pela chave ou pela referência de
idempotência. Reenvio cego gera nota duplicada, e duplicidade fiscal dá trabalho e multa.

## Dados obrigatórios do nosso lado

- Emitente: CNPJ, IE, regime tributário, endereço, CNAE.
- Destinatário: CNPJ/CPF, IE ou ISENTO, endereço completo com código IBGE do município,
  indicador de IE (contribuinte, isento, não contribuinte).
- Produto: NCM (8 dígitos), CEST quando houver ST, CFOP, unidade comercial, EAN/GTIN
  quando existir, valor unitário e total.
- Tributos por item: ICMS (CST ou CSOSN), IPI, PIS, COFINS, e FCP/ST quando aplicável.
- Transporte: modalidade de frete, transportadora, volumes, peso.
- Referência ao pedido e informações complementares.

Cosmético capilar costuma cair em NCM 3305 (preparações capilares) e tem **substituição
tributária** em várias UFs: ver [icms-st]. Confirme NCM, CEST e MVA com o contador antes
de emitir em produção. Errar aqui gera passivo silencioso que aparece meses depois.

## Situações e prazos

| Operação | Prazo |
|---|---|
| Cancelamento | 24 h após autorização (algumas UFs permitem mais, com multa) |
| Carta de correção (CC-e) | 30 dias; não corrige valor, destinatário nem produto |
| Inutilização de numeração | até o dia 10 do mês seguinte |
| Guarda do XML | 5 anos |

Passado o prazo de cancelamento, a correção é nota de devolução ou nota complementar,
não cancelamento.

## Armazenamento

XML autorizado e DANFE em PDF no S3 (ver [file-storage]), com chave de 44 dígitos como
nome. XML nunca é sobrescrito. Eventos (cancelamento, CC-e) são arquivos adicionais
vinculados à mesma chave.

## Contingência

Responsabilidade do provedor. O KAIROS trata o estado `TRANSMITINDO` por tempo excessivo
com alerta ao fiscal, e a tela mostra claramente quais notas ainda não voltaram.
Nenhuma mercadoria sai sem nota autorizada ou DANFE em contingência válida.

## Rejeições comuns

| Código | Causa | Ação |
|---|---|---|
| 204 | Duplicidade de NF | consultar antes de reemitir |
| 539 | Duplicidade com diferença de chave | conferir dados do emitente |
| 610 | NCM inválido | corrigir cadastro do produto |
| 778 | NCM inexistente na tabela | atualizar tabela NCM |
| 225 | Falha no schema | payload incompleto: validar antes de enviar |

Mapeie os códigos recorrentes para mensagens em português com a ação sugerida. O usuário
do faturamento não deve precisar do manual da SEFAZ.
