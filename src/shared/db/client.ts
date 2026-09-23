import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { env, ehProducao } from '@/shared/config/env'

/**
 * Cliente Prisma base, SEM contexto de tenant.
 *
 * Use este cliente apenas para:
 *   - tabelas globais (tenant, usuario, uf, municipio, ncm, cfop, banco);
 *   - autenticação, antes de saber o tenant;
 *   - scripts de manutenção.
 *
 * Para qualquer dado de negócio use `prismaFor(tenantId)` de ./tenant-client,
 * que abre o contexto exigido pela RLS (ver skill multi-tenancy).
 */

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

function criar() {
  return new PrismaClient({
    adapter,
    log: ehProducao ? ['error'] : ['warn', 'error'],
  })
}

// Em desenvolvimento o hot reload recarrega o módulo; sem o cache global o
// pool de conexões cresce até estourar.
const global_ = globalThis as unknown as { prismaKairos?: ReturnType<typeof criar> }

export const prisma = global_.prismaKairos ?? criar()

if (!ehProducao) global_.prismaKairos = prisma

export type PrismaBase = typeof prisma
