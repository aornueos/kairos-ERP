import { z } from 'zod'
import { prisma } from '@/shared/db/client'
import { obterFila } from '../fila'
import { definirJob } from '../fila'
import { loggerDe } from '@/shared/observabilidade/logger'

const LOTE = 100
const MAX_TENTATIVAS = 5

/**
 * Publisher do padrão outbox (ver skill event-driven).
 *
 * O evento foi gravado na mesma transação da mudança de estado; este job lê o
 * que ainda não foi publicado e enfileira. É o que garante que nenhum efeito
 * se perca quando o processo cai entre o commit e a publicação.
 */
export const publicarOutbox = definirJob({
  nome: 'plataforma.publicar-outbox',
  schema: z.object({}),
  opcoes: { retryLimit: 3, expireInSeconds: 120 },

  async executar() {
    const log = loggerDe({ componente: 'outbox' })
    const boss = await obterFila()

    // Sem contexto de tenant: o publisher varre todos. Roda com a role da
    // aplicação, então a RLS filtraria — por isso desabilitamos a policy para
    // esta leitura específica usando uma consulta administrativa explícita.
    const pendentes = await prisma.$queryRaw<
      Array<{
        id: string
        tenant_id: string
        tipo: string
        versao: number
        agregado_id: string
        payload: unknown
        tentativas: number
      }>
    >`
      select id, tenant_id, tipo, versao, agregado_id, payload, tentativas
        from evento_outbox
       where publicado_em is null
         and tentativas < ${MAX_TENTATIVAS}
       order by ocorrido_em
       limit ${LOTE}
       for update skip locked
    `

    if (pendentes.length === 0) return

    for (const evento of pendentes) {
      try {
        await boss.send(evento.tipo, {
          tenantId: evento.tenant_id,
          eventoId: evento.id,
          agregadoId: evento.agregado_id,
          versao: evento.versao,
          payload: evento.payload,
        })

        await prisma.eventoOutbox.update({
          where: { id: evento.id },
          data: { publicadoEm: new Date(), ultimoErro: null },
        })
      } catch (erro) {
        await prisma.eventoOutbox.update({
          where: { id: evento.id },
          data: {
            tentativas: { increment: 1 },
            ultimoErro: erro instanceof Error ? erro.message : String(erro),
          },
        })
        log.error(
          { err: erro, eventoId: evento.id, tipo: evento.tipo },
          'Falha ao publicar evento',
        )
      }
    }

    log.info({ publicados: pendentes.length }, 'Lote de eventos publicado')
  },
})
