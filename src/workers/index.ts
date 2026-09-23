import '../../load-env'
import { encerrarFila, obterFila, registrar } from './fila'
import { publicarOutbox } from './jobs/publicar-outbox'
import { logger } from '@/shared/observabilidade/logger'
import { prisma } from '@/shared/db/client'

/**
 * Processo de worker do KAIROS.
 *
 * Roda separado da aplicação web (container próprio em produção, `pnpm worker`
 * no desenvolvimento). Server Action que espera provedor externo trava a
 * experiência e estoura timeout — por isso todo trabalho demorado vem para cá.
 */

const log = logger.child({ componente: 'worker' })

async function principal() {
  log.info('Iniciando worker')

  const boss = await obterFila()

  // Concorrência por fila: fiscal 2, e-mail 5, relatório 1.
  // Na fase 0 só o publisher da outbox existe.
  await registrar(boss, publicarOutbox, 1)

  // Varredura da outbox a cada 10 segundos. singletonKey evita acúmulo de
  // execuções sobrepostas quando um ciclo demora mais que o intervalo.
  await boss.schedule(
    publicarOutbox.nome,
    '*/1 * * * *',
    {},
    {
      tz: 'America/Sao_Paulo',
      singletonKey: 'outbox',
    },
  )

  log.info({ filas: [publicarOutbox.nome] }, 'Worker pronto')
}

async function encerrar(sinal: string) {
  log.info({ sinal }, 'Encerrando worker')
  try {
    await encerrarFila()
    await prisma.$disconnect()
    log.info('Worker encerrado')
    process.exit(0)
  } catch (erro) {
    log.error({ err: erro }, 'Falha ao encerrar worker')
    process.exit(1)
  }
}

process.on('SIGTERM', () => void encerrar('SIGTERM'))
process.on('SIGINT', () => void encerrar('SIGINT'))

principal().catch((erro: unknown) => {
  log.fatal({ err: erro }, 'Worker não iniciou')
  process.exit(1)
})
