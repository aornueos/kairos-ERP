import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { uuidv7 } from 'uuidv7'
import type { PrismaClient } from '@/generated/prisma/client'
import { limpar, prepararBanco, type BancoDeTeste } from './suporte/banco'

/**
 * Regressão do impasse de bootstrap da autenticação.
 *
 * `usuario_tenant` tem RLS por tenant, mas no login ainda não se sabe qual é o
 * tenant: é justamente essa linha que diz. Sem a policy `autenticacao_vinculo`,
 * o login jamais encontra o vínculo e ninguém entra no sistema.
 *
 * Estes testes fixam as duas metades do contrato: o login enxerga, e o acesso
 * comum continua isolado.
 */

let banco: BancoDeTeste
let prisma: PrismaClient

const TENANT_A = uuidv7()
const TENANT_B = uuidv7()
const USUARIO = uuidv7()

beforeAll(async () => {
  banco = await prepararBanco()
  prisma = banco.prisma
}, 180_000)

afterAll(async () => {
  await banco?.encerrar()
})

beforeEach(async () => {
  await limpar(prisma)

  await prisma.tenant.createMany({
    data: [
      {
        id: TENANT_A,
        razaoSocial: 'Pure.us Cosméticos Ltda',
        cnpj: '11222333000181',
        regimeTributario: 'SIMPLES_NACIONAL',
        atualizadoEm: new Date(),
      },
      {
        id: TENANT_B,
        razaoSocial: 'Concorrente Cosméticos Ltda',
        cnpj: '11444777000161',
        regimeTributario: 'LUCRO_PRESUMIDO',
        atualizadoEm: new Date(),
      },
    ],
  })

  await prisma.usuario.create({
    data: {
      id: USUARIO,
      nome: 'Maria Operadora',
      email: 'maria@pureus.local',
      senhaHash: 'hash-fake-para-teste',
      atualizadoEm: new Date(),
    },
  })

  // Vínculo só com o tenant A.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.tenant_id', ${TENANT_A}::text, true)`
    await tx.usuarioTenant.create({
      data: {
        id: uuidv7(),
        tenantId: TENANT_A,
        usuarioId: USUARIO,
        atualizadoEm: new Date(),
      },
    })
  })
})

describe('contexto de autenticação', () => {
  it('encontra o vínculo do usuário sem saber o tenant de antemão', async () => {
    const encontrado = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`select set_config('app.autenticando', 'on', true)`
      return tx.usuario.findUnique({
        where: { email: 'maria@pureus.local' },
        include: { vinculos: { where: { situacao: 'ATIVO' } } },
      })
    })

    expect(encontrado?.vinculos).toHaveLength(1)
    expect(encontrado?.vinculos[0]?.tenantId).toBe(TENANT_A)
  })

  it('sem o contexto de autenticação, o vínculo fica invisível', async () => {
    // É o defeito que quebrava o login: a RLS escondia a própria linha que
    // diria qual é o tenant.
    const semContexto = await prisma.usuarioTenant.findMany()
    expect(semContexto).toHaveLength(0)
  })

  it('o contexto de autenticação não libera escrita', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRaw`select set_config('app.autenticando', 'on', true)`
        return tx.usuarioTenant.create({
          data: {
            id: uuidv7(),
            tenantId: TENANT_B,
            usuarioId: USUARIO,
            atualizadoEm: new Date(),
          },
        })
      }),
    ).rejects.toThrow()
  })

  it('o contexto de autenticação não vaza as outras tabelas do tenant', async () => {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`select set_config('app.tenant_id', ${TENANT_B}::text, true)`
      await tx.perfil.create({
        data: {
          id: uuidv7(),
          tenantId: TENANT_B,
          codigo: 'ADMIN',
          nome: 'Admin do concorrente',
          atualizadoEm: new Date(),
        },
      })
    })

    const perfis = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`select set_config('app.autenticando', 'on', true)`
      return tx.perfil.findMany()
    })

    // A policy cobre apenas usuario_tenant. Perfil continua isolado.
    expect(perfis).toHaveLength(0)
  })

  it('com o tenant definido, o vínculo de outro tenant continua invisível', async () => {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`select set_config('app.tenant_id', ${TENANT_B}::text, true)`
      await tx.usuarioTenant.create({
        data: {
          id: uuidv7(),
          tenantId: TENANT_B,
          usuarioId: USUARIO,
          atualizadoEm: new Date(),
        },
      })
    })

    const vistosPorA = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`select set_config('app.tenant_id', ${TENANT_A}::text, true)`
      return tx.usuarioTenant.findMany()
    })

    expect(vistosPorA).toHaveLength(1)
    expect(vistosPorA[0]?.tenantId).toBe(TENANT_A)
  })
})
