---
name: background-jobs
description: Processamento assíncrono do KAIROS com pg-boss — filas, agendamentos, idempotência, retry e worker. Use ao criar tarefa demorada, agendada ou que chama serviço externo.
---

# Jobs em background

pg-boss sobre o próprio PostgreSQL. Sem Redis, sem broker extra: o volume da Pure.us não
justifica e a fila fica no mesmo backup do banco.

## O que vira job

- Emissão e consulta de NF-e/NFC-e no provedor fiscal.
- Geração de SPED, remessa CNAB, retorno bancário, relatório pesado, exportação grande.
- Envio de e-mail, WhatsApp e webhook de saída.
- Recalculo de saldo, conciliação noturna, atualização de view materializada.
- Importação de planilha e sincronização de marketplace.

Regra prática: passou de 2 segundos ou depende de terceiro, é job. Server Action que
espera provedor externo trava a experiência e estoura timeout.

## Definição

```ts
// src/workers/jobs/emitir-nfe.ts
export const emitirNfe = defineJob({
  nome: 'fiscal.emitir-nfe',
  schema: z.object({ tenantId: z.uuid(), notaId: z.uuid() }),
  opcoes: { retryLimit: 5, retryBackoff: true, expireInMinutes: 10 },
  async executar({ tenantId, notaId }, ctx) { /* ... */ },
})
```

Todo job: nome em `<modulo>.<acao>`, payload validado por Zod, `tenantId` obrigatório,
execução idempotente.

## Idempotência

O job pode rodar duas vezes — com retry, sempre roda. Antes de agir, verifique o estado:

```ts
const nota = await ctx.fiscal.porId(notaId)
if (nota.status === 'AUTORIZADA') return // nada a fazer
```

Para operação com efeito externo, use chave de idempotência determinística
(`${tenantId}:${notaId}:emissao`) e envie ao provedor.

## Singleton e agendamento

```ts
boss.schedule('financeiro.conciliar-noturno', '0 3 * * *',
  { tenantId }, { tz: 'America/Sao_Paulo' })
```

Job agendado usa `singletonKey` para não acumular execuções sobrepostas.
Recorrente por tenant: agende um por tenant ativo, não um global que itera todos — um
tenant lento não pode atrasar os outros.

## Worker

Processo separado (`pnpm worker`), mesmo código, container próprio em produção.
Concorrência por fila: fiscal 2, e-mail 5, relatório 1. Encerramento gracioso no SIGTERM,
esperando o job atual terminar até 30 segundos.

## Observabilidade

Toda execução loga início, fim, duração e resultado, com `jobId` e `tenantId`.
Fila com mais de 100 pendentes ou job na dead letter gera alerta (ver [monitoring-alerts]).
A tela "Processos" mostra pendentes, falhas e permite reprocessar com um clique — o
usuário do financeiro precisa disso sem abrir chamado.

## Armadilhas

- Guardar objeto grande no payload. Guarde o id e leia no job.
- Job que depende de outro job terminar. Encadeie por evento (ver [event-driven]).
- Retry infinito em erro permanente: enche a fila e esconde o problema real.
