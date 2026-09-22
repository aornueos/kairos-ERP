---
name: api-design-rest
description: Padrão de API REST do KAIROS (Route Handlers do Next) para integrações externas, app mobile e parceiros. Use ao expor um endpoint público, definir formato de erro, paginação ou filtro.
---

# API REST

Uso interno (telas) é Server Action. REST existe só para consumidores externos:
e-commerce, marketplace, PDV, integrações do contador e webhooks de entrada.

Base: `/api/v1/...` em `src/app/api/v1/**/route.ts`.

## Convenções

- Recurso no plural e em português: `/api/v1/pedidos`, `/api/v1/produtos`.
- Subrecurso só um nível: `/api/v1/pedidos/{id}/itens`.
- Ação que não é CRUD vira subrecurso de comando: `POST /api/v1/pedidos/{id}/faturamento`.
- `PATCH` para alteração parcial. `PUT` só quando o corpo é o recurso inteiro.
- IDs sempre UUID v7 em texto. Nunca expor id sequencial interno.

## Envelope de resposta

Coleção:

```json
{
  "dados": [],
  "paginacao": { "cursor": "01J...", "proximoCursor": "01J...", "limite": 50 }
}
```

Item: o objeto direto, sem envelope.

Paginação é por cursor (UUID v7 é ordenável) em toda listagem transacional.
`offset` só em relatório com total fixo.

## Erros (RFC 9457)

```json
{
  "type": "https://kairos.pureus.com.br/erros/saldo-insuficiente",
  "title": "Saldo insuficiente",
  "status": 422,
  "detail": "Lote L-2409-03 possui 12,000 disponíveis e foram solicitadas 20,000.",
  "instance": "/api/v1/pedidos/01J.../faturamento",
  "codigo": "ESTOQUE_SALDO_INSUFICIENTE",
  "campos": { "itens[2].quantidade": "Acima do disponível" }
}
```

`Content-Type: application/problem+json`. O campo `codigo` é estável e documentado: o
cliente programa contra ele, não contra o texto.

| Situação | Status |
|---|---|
| Payload malformado, falha de Zod | 400 |
| Sem token ou token inválido | 401 |
| Sem permissão | 403 |
| Recurso não existe, ou é de outro tenant | 404 |
| Conflito de estado (pedido já faturado) | 409 |
| Regra de negócio violada | 422 |
| Rate limit | 429 |

Dado de outro tenant retorna 404, nunca 403: não confirme existência.

## Idempotência

`POST` que gera efeito financeiro ou fiscal exige header `Idempotency-Key`.
Guarde `(tenant, rota, chave) -> resposta` por 24 horas e devolva a resposta original.

## Filtros e ordenação

`?status=confirmado&emitidoDe=2026-01-01&emitidoAte=2026-03-31&ordem=-emitidoEm`

Whitelist de campos filtráveis por rota. Nunca monte SQL a partir de nome de campo
recebido sem validar contra a lista.

## Autenticação

Token de aplicação em `Authorization: Bearer`, com escopos por recurso
(`pedidos:ler`, `pedidos:escrever`). O token é por tenant e aparece na auditoria como ator.
