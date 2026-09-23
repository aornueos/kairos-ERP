import { PgBoss, type Job } from 'pg-boss'
import { z } from 'zod'
import { env } from '@/shared/config/env'
import { loggerDe } from '@/shared/observabilidade/logger'

/**
 * Fila do KAIROS sobre o próprio PostgreSQL (ADR-0001, skill background-jobs).
 * Sem Redis nem broker extra: o volume não justifica e a fila entra no mesmo
 * backup do banco.
 */

let instancia: PgBoss | null = null

export async function obterFila(): Promise<PgBoss> {
  if (instancia) return instancia

  const boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    schema: 'fila',
  })

  boss.on('error', (erro: Error) => {
    loggerDe({ componente: 'fila' }).error({ err: erro }, 'Erro na fila')
  })

  await boss.start()
  instancia = boss
  return boss
}

export async function encerrarFila(): Promise<void> {
  if (!instancia) return
  await instancia.stop({ graceful: true, timeout: 30_000 })
  instancia = null
}

/**
 * Todo job carrega tenantId no payload. Job sem tenant é bug: falha cedo,
 * antes de tocar em qualquer dado (ver skill multi-tenancy).
 */
export const payloadBase = z.object({ tenantId: z.uuid() })

export interface DefinicaoJob<T extends z.ZodType> {
  nome: string
  schema: T
  opcoes?: {
    retryLimit?: number
    retryBackoff?: boolean
    expireInSeconds?: number
  }
  executar: (dados: z.infer<T>, job: Job<unknown>) => Promise<void>
}

export function definirJob<T extends z.ZodType>(def: DefinicaoJob<T>): DefinicaoJob<T> {
  return def
}

/** Registra a fila e o handler, com validação, log e duração. */
export async function registrar<T extends z.ZodType>(
  boss: PgBoss,
  def: DefinicaoJob<T>,
  concorrencia = 1,
): Promise<void> {
  await boss.createQueue(def.nome, {
    // Retenção curta: job concluído não precisa ficar meses na tabela.
    deleteAfterSeconds: 7 * 24 * 60 * 60,
    retryLimit: def.opcoes?.retryLimit ?? 5,
    retryBackoff: def.opcoes?.retryBackoff ?? true,
    expireInSeconds: def.opcoes?.expireInSeconds ?? 600,
  })

  await boss.work(def.nome, { batchSize: concorrencia }, async (jobs: Job<unknown>[]) => {
    for (const job of jobs) {
      const log = loggerDe({ jobId: job.id, jobNome: def.nome })
      const inicio = Date.now()

      const dados = def.schema.safeParse(job.data)
      if (!dados.success) {
        // Payload inválido não é falha transitória: repetir não resolve.
        log.error({ problemas: dados.error.issues }, 'Payload de job inválido')
        continue
      }

      try {
        await def.executar(dados.data as z.infer<T>, job)
        log.info({ duracaoMs: Date.now() - inicio }, 'Job concluído')
      } catch (erro) {
        log.error({ err: erro, duracaoMs: Date.now() - inicio }, 'Job falhou')
        throw erro
      }
    }
  })
}
