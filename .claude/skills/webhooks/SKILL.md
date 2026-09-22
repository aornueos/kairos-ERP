---
name: webhooks
description: Webhooks de entrada e de saída no KAIROS — assinatura HMAC, idempotência, retry e segurança. Use ao receber callback de provedor (fiscal, pagamento, marketplace) ou ao expor eventos para sistemas externos.
---

# Webhooks

## Entrada (recebemos)

Rota: `src/app/api/webhooks/<provedor>/route.ts`. Provedores previstos: fiscal
(autorização, rejeição, cancelamento), gateway de pagamento e PIX, marketplace,
e-commerce, transportadora.

Ordem obrigatória de processamento:

1. **Verificar assinatura** com o segredo do provedor, usando comparação de tempo
   constante (`crypto.timingSafeEqual`). Falhou, responde 401 e loga. Nunca processe
   payload não assinado.
2. **Rejeitar replay**: timestamp fora de janela de 5 minutos, descarta.
3. **Deduplicar** por id do evento do provedor em `webhook_recebido`.
4. **Persistir cru** (headers e corpo) antes de interpretar. Salva a investigação depois.
5. **Enfileirar** o processamento e responder `200` em menos de 3 segundos.

Nunca processe regra de negócio dentro do handler HTTP: provedor que recebe timeout
reenvia, e o efeito duplica.

```ts
export async function POST(req: Request) {
  const raw = await req.text()
  if (!assinaturaValida(raw, req.headers.get('x-signature'), segredo))
    return new Response('assinatura inválida', { status: 401 })
  const id = await registrarRecebimento(raw, req.headers)
  await boss.send('webhook.processar', { id })
  return new Response(null, { status: 200 })
}
```

O corpo precisa ser lido como texto puro para validar HMAC. `req.json()` antes da
verificação invalida a assinatura.

## Saída (enviamos)

Assinatura de eventos por tenant, com URL e segredo cadastrados na tela de integrações.

```
webhook_assinatura(id, tenant_id, url, segredo, eventos[], ativo, versao)
webhook_entrega(id, assinatura_id, evento_id, tentativa, status_http, erro, enviado_em)
```

- Cabeçalhos: `X-Kairos-Evento`, `X-Kairos-Entrega`, `X-Kairos-Timestamp`,
  `X-Kairos-Assinatura` (HMAC-SHA256 de `timestamp.corpo`).
- Retry: 5 tentativas com backoff 1 min, 5 min, 30 min, 2 h, 6 h.
- Após a última falha, a assinatura é suspensa e o administrador do tenant é notificado.
- Tela mostra o histórico de entregas e permite reenviar uma entrega específica.
- Timeout de 10 segundos por tentativa.
- Só HTTPS. Bloqueie destino em faixa privada, localhost e metadados de nuvem (SSRF).

Payload mínimo, sem dado sensível: id, tipo, versão, ocorridoEm e identificadores.
O consumidor busca o detalhe pela API com o próprio token.

## Segredos

Gerados com 32 bytes aleatórios, exibidos uma vez. Rotação suportada com dois segredos
válidos por 24 horas. Nunca logue o segredo nem o header de assinatura.
