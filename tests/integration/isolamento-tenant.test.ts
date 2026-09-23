import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { uuidv7 } from 'uuidv7'
import type { PrismaClient } from '@/generated/prisma/client'
import { limpar, prepararBanco, type BancoDeTeste } from './suporte/banco'

/**
 * Critério de aceite da fase 0.
 *
 * Vazamento entre tenants é o pior defeito possível neste sistema: acaba com a
 * confiança no produto e é impossível de desfazer depois que alguém viu o dado
 * de outra empresa. Por isso este teste existe antes de qualquer módulo de
 * negócio, e deve ser replicado em todo módulo novo (ver skill multi-tenancy).
 */

let banco: BancoDeTeste
let prisma: PrismaClient

const TENANT_A = uuidv7()
const TENANT_B = uuidv7()

/** Executa um bloco com o contexto de tenant que a RLS exige. */
async function comTenant<T>(
  tenantId: string,
  bloco: (tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.tenant_id', ${tenantId}::text, true)`
    return bloco(tx)
  })
}

beforeAll(async () => {
  banco = await prepararBanco()
  prisma = banco.prisma
}, 180_000)

afterAll(async () => {
  await banco?.encerrar()
})

beforeEach(async () => {
  await limpar(prisma)

  // `tenant` é tabela global, sem RLS: as duas empresas convivem na mesma base.
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

  await comTenant(TENANT_A, (tx) =>
    tx.perfil.create({
      data: {
        id: uuidv7(),
        tenantId: TENANT_A,
        codigo: 'VENDAS',
        nome: 'Vendas da Pure.us',
        atualizadoEm: new Date(),
      },
    }),
  )

  await comTenant(TENANT_B, (tx) =>
    tx.perfil.create({
      data: {
        id: uuidv7(),
        tenantId: TENANT_B,
        codigo: 'VENDAS',
        nome: 'Vendas do concorrente',
        atualizadoEm: new Date(),
      },
    }),
  )
})

describe('isolamento por tenant', () => {
  it('cada tenant lê apenas os próprios registros', async () => {
    const doA = await comTenant(TENANT_A, (tx) => tx.perfil.findMany())
    const doB = await comTenant(TENANT_B, (tx) => tx.perfil.findMany())

    expect(doA).toHaveLength(1)
    expect(doA[0]?.nome).toBe('Vendas da Pure.us')

    expect(doB).toHaveLength(1)
    expect(doB[0]?.nome).toBe('Vendas do concorrente')
  })

  it('não encontra registro de outro tenant nem pelo id exato', async () => {
    const perfilDeB = await comTenant(TENANT_B, (tx) => tx.perfil.findFirstOrThrow())

    const tentativa = await comTenant(TENANT_A, (tx) =>
      tx.perfil.findUnique({ where: { id: perfilDeB.id } }),
    )

    // Retorna nulo, que a aplicação traduz em 404: não confirmamos existência.
    expect(tentativa).toBeNull()
  })

  it('não altera registro de outro tenant', async () => {
    const perfilDeB = await comTenant(TENANT_B, (tx) => tx.perfil.findFirstOrThrow())

    const alterados = await comTenant(TENANT_A, (tx) =>
      tx.perfil.updateMany({
        where: { id: perfilDeB.id },
        data: { nome: 'Invadido' },
      }),
    )

    expect(alterados.count).toBe(0)

    const depois = await comTenant(TENANT_B, (tx) =>
      tx.perfil.findUniqueOrThrow({ where: { id: perfilDeB.id } }),
    )
    expect(depois.nome).toBe('Vendas do concorrente')
  })

  it('não apaga registro de outro tenant', async () => {
    const perfilDeB = await comTenant(TENANT_B, (tx) => tx.perfil.findFirstOrThrow())

    const apagados = await comTenant(TENANT_A, (tx) =>
      tx.perfil.deleteMany({ where: { id: perfilDeB.id } }),
    )

    expect(apagados.count).toBe(0)
    await expect(
      comTenant(TENANT_B, (tx) =>
        tx.perfil.findUniqueOrThrow({ where: { id: perfilDeB.id } }),
      ),
    ).resolves.toBeTruthy()
  })

  it('bloqueia gravar registro marcado com outro tenant', async () => {
    // WITH CHECK da policy: não basta filtrar leitura, a escrita também é barrada.
    await expect(
      comTenant(TENANT_A, (tx) =>
        tx.perfil.create({
          data: {
            id: uuidv7(),
            tenantId: TENANT_B,
            codigo: 'INFILTRADO',
            nome: 'Perfil plantado',
            atualizadoEm: new Date(),
          },
        }),
      ),
    ).rejects.toThrow()
  })

  it('sem contexto de tenant, não enxerga nada', async () => {
    // Conexão sem set_config: current_setting devolve nulo e a policy nega tudo.
    // É a proteção contra query que escapou do helper de tenant.
    const semContexto = await prisma.perfil.findMany()
    expect(semContexto).toHaveLength(0)
  })

  it('o mesmo vale para a trilha de auditoria', async () => {
    await comTenant(TENANT_B, (tx) =>
      tx.auditoria.create({
        data: {
          id: uuidv7(),
          tenantId: TENANT_B,
          entidade: 'Perfil',
          entidadeId: uuidv7(),
          acao: 'criou',
          atorTipo: 'USUARIO',
        },
      }),
    )

    const visivelParaA = await comTenant(TENANT_A, (tx) => tx.auditoria.findMany())
    expect(visivelParaA).toHaveLength(0)

    const visivelParaB = await comTenant(TENANT_B, (tx) => tx.auditoria.findMany())
    expect(visivelParaB).toHaveLength(1)
  })
})

describe('imutabilidade da auditoria', () => {
  it('rejeita alteração de registro de auditoria', async () => {
    const registro = await comTenant(TENANT_A, (tx) =>
      tx.auditoria.create({
        data: {
          id: uuidv7(),
          tenantId: TENANT_A,
          entidade: 'Perfil',
          entidadeId: uuidv7(),
          acao: 'criou',
          atorTipo: 'USUARIO',
        },
      }),
    )

    await expect(
      comTenant(TENANT_A, (tx) =>
        tx.auditoria.update({ where: { id: registro.id }, data: { acao: 'alterou' } }),
      ),
    ).rejects.toThrow(/imutavel/i)
  })

  it('rejeita exclusão de registro de auditoria', async () => {
    const registro = await comTenant(TENANT_A, (tx) =>
      tx.auditoria.create({
        data: {
          id: uuidv7(),
          tenantId: TENANT_A,
          entidade: 'Perfil',
          entidadeId: uuidv7(),
          acao: 'criou',
          atorTipo: 'USUARIO',
        },
      }),
    )

    await expect(
      comTenant(TENANT_A, (tx) => tx.auditoria.delete({ where: { id: registro.id } })),
    ).rejects.toThrow(/imutavel/i)
  })
})
