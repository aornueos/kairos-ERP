---
name: pix
description: PIX no KAIROS — cobrança com QR Code estático e dinâmico, conciliação automática por txid, PIX automático e devolução. Use ao implementar recebimento por PIX ou conciliar pagamentos instantâneos.
---

# PIX

Meio de recebimento preferido: liquidação imediata, custo baixo e conciliação
automática quando bem implementado.

## Modalidades

| Modalidade | Uso na Pure.us |
|---|---|
| QR estático | valor livre, recebimento eventual. Conciliação manual |
| QR dinâmico (cob) | cobrança com valor, vencimento e txid. **Padrão para títulos** |
| PIX Cobrança (cobv) | com vencimento, juros, multa e desconto; substitui boleto em muitos casos |
| PIX automático | débito recorrente autorizado pelo cliente; útil para salão com compra recorrente |
| Devolução | estorno total ou parcial, com prazo definido pelo BACEN |

## Integração

API PIX do banco (padrão BACEN), com certificado mTLS e OAuth2. Fluxo:

```
criar cobrança (txid) -> receber QR Code e copia-e-cola -> enviar ao cliente
 -> webhook de pagamento -> baixa automática do título -> conciliação
```

`txid` é gerado por nós, com no máximo 35 caracteres, determinístico a partir do título
(`t<tenantShort><numeroTitulo>`). É o que amarra pagamento e título sem ambiguidade.

## Baixa automática

Webhook do banco ([webhooks]) chega com `endToEndId`, `txid`, valor e horário.
O job localiza o título pelo `txid`, confere o valor e baixa.

- Valor menor: baixa parcial e alerta.
- Valor maior: baixa total e registra crédito do cliente.
- `txid` desconhecido (PIX avulso na chave da empresa): entra na fila de "recebimentos a
  identificar", nunca é descartado nem baixa título por aproximação de valor.
- `endToEndId` é a chave de idempotência: reprocessar webhook não duplica baixa.

## Segurança

- Chave PIX da empresa e credenciais no gerenciador de segredos, com rotação.
- Valide a assinatura ou o mTLS do webhook; nunca confie em payload sem autenticação.
- Alteração da chave PIX de recebimento exige dupla aprovação e cai em auditoria —
  trocar a chave é o jeito mais simples de desviar recebimentos.
- Nunca exiba QR Code gerado com dados vindos de entrada não validada.

## Envio (pagamentos)

Pagamento a fornecedor por PIX segue a mesma programação de [contas-pagar-receber], com
separação entre quem monta a remessa e quem aprova o envio. Comprovante (`endToEndId`)
anexado ao movimento financeiro.

## Conciliação

Extrato PIX do dia é importado e batido contra os movimentos (ver
[conciliacao-bancaria]). O que não casar aparece na tela de pendências com sugestão de
vínculo.
