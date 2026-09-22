---
name: api-docs-openapi
description: Documentação da API do KAIROS em OpenAPI — geração a partir dos schemas Zod, exemplos, erros e portal do integrador. Use ao expor endpoint público ou atualizar o contrato.
---

# OpenAPI

Documentação gerada a partir do código, nunca escrita à mão em paralelo. Documento
divergente da implementação é pior que documento nenhum: o integrador programa contra ele
e descobre a diferença em produção.

## Geração

Os schemas Zod dos casos de uso são a fonte. `zod-to-openapi` converte para componentes
do OpenAPI 3.1, e o documento é montado no build:

```ts
registry.registerPath({
  method: 'post',
  path: '/api/v1/pedidos',
  tags: ['Pedidos'],
  summary: 'Criar pedido de venda',
  security: [{ bearerAuth: ['pedidos:escrever'] }],
  request: { body: { content: { 'application/json': { schema: criarPedidoInput } } } },
  responses: {
    201: { description: 'Pedido criado', content: { 'application/json': { schema: pedidoDTO } } },
    422: { description: 'Regra de negócio violada', content: { 'application/problem+json': { schema: problemaSchema } } },
  },
})
```

Publicado em `/api/v1/openapi.json` e renderizado em `/docs/api` com Scalar ou Redoc.

## Conteúdo obrigatório por endpoint

- Descrição em português dizendo o que a operação faz no negócio.
- Escopos necessários.
- Exemplo de requisição e de resposta com dados plausíveis da Pure.us (não `string`,
  `foo`, `123`).
- Todos os códigos de erro possíveis, com o campo `codigo` estável (ver [api-design-rest]).
- Regras de idempotência, quando aplicável.
- Limites de taxa.

## Portal do integrador

Além da referência, o portal traz o que a referência não cobre:

- Como obter e usar o token, e como rotacionar.
- Fluxo completo de um pedido, do envio ao faturamento, com a sequência de chamadas.
- Assinatura e reprocessamento de webhooks (ver [webhooks]).
- Ambiente de testes com tenant de sandbox.
- Política de versionamento e depreciação (ver [api-versioning]).
- Changelog da API, separado do changelog do produto.

## Verificação no CI

- O documento gerado valida contra o esquema do OpenAPI.
- Endpoint sem `summary`, sem exemplo ou sem erros documentados falha o build.
- Testes de contrato conferem que a resposta real bate com o schema publicado.

Assim a documentação não pode envelhecer sem alguém perceber.
