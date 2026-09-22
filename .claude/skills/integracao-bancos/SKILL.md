---
name: integracao-bancos
description: Integração bancária do KAIROS — escolha entre API e CNAB, adapters por banco, credenciais, homologação e resiliência. Use ao conectar um banco novo ou tratar falha de integração bancária.
---

# Integração com bancos

## Porta única

```ts
interface BancoProvider {
  registrarBoleto(dados: BoletoInput): Promise<BoletoRegistrado>
  consultarBoleto(nossoNumero: string): Promise<SituacaoBoleto>
  baixarBoleto(nossoNumero: string, motivo: string): Promise<void>
  criarCobrancaPix(dados: PixInput): Promise<CobrancaPix>
  extrato(contaId: string, periodo: Periodo): Promise<LancamentoExtrato[]>
  pagar(dados: PagamentoInput): Promise<ComprovantePagamento>
}
```

Um adapter por banco em `src/modules/financeiro/infra/bancos/<banco>/`. O módulo
financeiro nunca conhece o banco específico — só a porta. Trocar de banco vira
configuração, não refatoração.

## API ou CNAB

| Situação | Caminho |
|---|---|
| Banco tem API moderna e o volume justifica | API (melhor: tempo real, webhook, sem arquivo) |
| Banco sem API ou recurso não coberto | CNAB (ver [cnab]) |
| Pagamento em lote a fornecedores | CNAB ainda costuma ser o mais prático |
| PIX | sempre API (ver [pix]) |

Vários bancos exigem contrato específico e homologação para liberar a API. Conte semanas,
não dias, no planejamento.

## Credenciais

Certificado mTLS, `client_id` e `client_secret` por banco e por ambiente, no gerenciador
de segredos. Nunca no banco de dados em texto puro, nunca no repositório.
Certificado tem validade: alerta 30 dias antes do vencimento, senão a conciliação para
sem aviso em um dia qualquer.

## Resiliência

- Timeout curto (10 s) e retry só em erro transitório, com backoff.
- Circuit breaker por banco: banco fora do ar não pode travar o faturamento.
- Toda chamada registra requisição e resposta (sem segredo) por 90 dias, para
  contestação. Banco discorda com frequência; log é o que resolve.
- Falha em job aparece na tela de integrações com o erro, e pode ser reprocessada.

## Homologação

Checklist por banco antes de produção: registro de boleto aceito, rejeição tratada,
liquidação lida, baixa por decurso, tarifa classificada, extrato conciliando, e PIX
recebido com baixa automática. Documente a data e o contato do banco em
`docs/integracoes/<banco>.md`.

## Ambientes

Sandbox do banco para desenvolvimento, e nunca credenciais de produção em ambiente de
teste. Se o banco não oferece sandbox (acontece), use conta real com valores mínimos e
uma lista explícita de operações permitidas em teste.
