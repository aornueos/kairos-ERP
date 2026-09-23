import { prisma } from './client'

/**
 * Abre o contexto de tenant exigido pelas policies de RLS (ADR-0003).
 *
 * `set_config(..., true)` define o valor apenas para a transação corrente,
 * então o valor não vaza entre requisições que compartilham conexão do pool.
 *
 * Toda operação de negócio passa por aqui. A RLS é a rede de segurança: mesmo
 * que uma query esqueça o `where tenantId`, o banco filtra.
 */

export type TransacaoTenant = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/** Executa um bloco dentro de uma transação com o tenant fixado. */
export async function comTenant<T>(
  tenantId: string,
  bloco: (tx: TransacaoTenant) => Promise<T>,
  opcoes?: { timeoutMs?: number },
): Promise<T> {
  if (!tenantId) {
    throw new Error('comTenant exige tenantId. Job ou requisição sem tenant é bug.')
  }

  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`select set_config('app.tenant_id', ${tenantId}::text, true)`
      return bloco(tx)
    },
    { timeout: opcoes?.timeoutMs ?? 15_000 },
  )
}

/**
 * Leitura simples com tenant, sem precisar montar transação manualmente.
 * Continua abrindo transação por baixo — a RLS exige.
 */
export async function lerComTenant<T>(
  tenantId: string,
  bloco: (tx: TransacaoTenant) => Promise<T>,
): Promise<T> {
  return comTenant(tenantId, bloco)
}
