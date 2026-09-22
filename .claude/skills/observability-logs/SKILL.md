---
name: observability-logs
description: Logs, traces e métricas no KAIROS — formato estruturado, correlação, níveis, dados proibidos e retenção. Use ao instrumentar código ou investigar problema em produção.
---

# Observabilidade

Pino para log estruturado, OpenTelemetry para traces, Sentry para exceções.
Objetivo prático: responder "o que aconteceu com o pedido 4821 às 14h32" sem abrir o banco.

## Log estruturado

```ts
logger.info({
  evento: 'pedido.faturado',
  tenantId, pedidoId, notaId, valorTotal: total.toString(), duracaoMs,
}, 'Pedido faturado')
```

Sempre objeto primeiro, mensagem depois. Nada de string concatenada: log em JSON é
pesquisável, texto solto não é.

## Campos padrão em toda requisição

`requestId` (gerado ou vindo do header), `tenantId`, `usuarioId`, `rota`, `metodo`,
`status`, `duracaoMs`. Propagados por `AsyncLocalStorage` para não precisar passar de
função em função. Em job: `jobId`, `jobNome`, `tentativa`.

O `requestId` aparece na tela de erro para o usuário. Suporte pede o código, e a busca
leva direto ao caso.

## Níveis

| Nível | Uso |
|---|---|
| `error` | falha que exige ação humana |
| `warn` | degradação, retry, regra de negócio bloqueando operação relevante |
| `info` | eventos de negócio: faturou, baixou, concluiu OP, importou |
| `debug` | detalhe de diagnóstico, desligado em produção |

`console.log` não existe no código de aplicação.

## Nunca logar

Senha, hash, token, certificado, CSC, chave PIX, número de cartão, CPF ou CNPJ completos
em log de aplicação, XML fiscal inteiro (guarde o arquivo e logue a chave), e payload de
webhook com dado pessoal. Redação automática por lista de campos no serializador do Pino.

## Traces

Instrumente as fronteiras: requisição HTTP, Server Action, caso de uso, consulta ao banco,
chamada externa, execução de job. O span do caso de uso carrega `tenantId` e o documento.
É o que mostra que os 3 segundos do faturamento foram 2,7 no provedor fiscal.

## Métricas

- Requisições por rota, com latência p50, p95 e p99.
- Jobs por fila: pendentes, duração, falhas, itens na dead letter.
- Negócio: notas autorizadas e rejeitadas por hora, pedidos faturados, títulos baixados.
- Banco: conexões em uso, consultas lentas, tempo de espera de lock.

Métrica de negócio é a que revela problema real mais rápido: "zero notas autorizadas na
última hora" diz mais que qualquer gráfico de CPU.

## Retenção

Log de aplicação 30 dias; erro 90 dias; auditoria 5 anos em tabela própria (não é log,
ver [audit-trail]). Log tem custo: não mande `debug` para produção "por garantia".
