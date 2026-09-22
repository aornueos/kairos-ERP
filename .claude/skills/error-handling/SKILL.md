---
name: error-handling
description: Hierarquia de erros, tratamento e propagação no KAIROS. Use ao lançar, capturar ou traduzir erro, integrar serviço externo, ou decidir o que mostrar ao usuário.
---

# Tratamento de erros

## Hierarquia

```ts
class KairosError extends Error {
  constructor(readonly codigo: string, mensagem: string, readonly contexto?: object,
              options?: { cause?: unknown }) { super(mensagem, options) }
}

class ValidacaoError   extends KairosError  // 400 — entrada malformada
class NaoAutenticado   extends KairosError  // 401
class SemPermissao     extends KairosError  // 403
class NaoEncontradoError extends KairosError // 404
class ConflitoError    extends KairosError  // 409 — estado incompatível, lock otimista
class RegraNegocioError extends KairosError // 422 — invariante do domínio
class IntegracaoError  extends KairosError  // 502 — provedor externo falhou
```

Erro de domínio é específico e herda de `RegraNegocioError`:
`SaldoInsuficienteError`, `LoteVencidoError`, `PedidoJaFaturadoError`,
`ClienteBloqueadoError`. O código é estável e documentado — a UI e as integrações
programam contra ele.

## Regras

- Sempre preserve a causa: `throw new IntegracaoError('FISCAL_INDISPONIVEL', msg, ctx, { cause: erro })`.
- Nunca `catch` vazio. Nunca `catch` que devolve `null` e finge sucesso.
- Nunca engula erro para "não travar a tela": erro engolido vira divergência de estoque
  ou título perdido, descoberto meses depois.
- `catch` só para: traduzir para erro de domínio, adicionar contexto, ou tratar de fato
  (retry, fallback explícito e registrado).
- Mensagem ao usuário diz o que aconteceu e o que fazer. Detalhe técnico vai para o log
  com `errorId`, e a tela mostra esse id.

## Fronteira externa

Toda chamada HTTP tem `AbortSignal.timeout(ms)`, limite de tentativas e circuit breaker
em integração crítica (provedor fiscal, banco):

```ts
const r = await fetch(url, { signal: AbortSignal.timeout(15_000) })
if (!r.ok) throw new IntegracaoError('FISCAL_HTTP_' + r.status, await r.text())
```

Retry só em erro transitório (timeout, 502, 503, 429) e só em operação idempotente.
Emissão de NF nunca é reenviada cega: consulte o status pela chave antes (ver [nfe]).

## Erro em job

Job lança para o pg-boss repetir com backoff. Depois do limite vai para dead letter,
gera alerta e aparece na tela de "Integrações com falha", onde o usuário reprocessa.
Falha de negócio permanente (NF rejeitada por dado incorreto) não é retry: marca o
documento com o motivo e devolve ao usuário.

## Tela

- `error.tsx` por segmento de rota, com o `errorId` visível e botão de tentar de novo.
- Falha de validação volta ao formulário com os campos marcados.
- Nunca exiba stack trace, SQL ou nome de tabela ao usuário.

## Log

`logger.error({ err, codigo, tenantId, usuarioId, entidade, entidadeId }, 'mensagem')`.
Sem dado pessoal, sem token, sem certificado. Ver [observability-logs].
