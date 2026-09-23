// Carrega .env.local: o Vitest não lê arquivos de ambiente por conta própria,
// e no CI as variáveis já vêm do runner (dotenv não sobrescreve as existentes).
import '../../../load-env'

import { execSync } from 'node:child_process'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

/**
 * Banco para testes de integração.
 *
 * Duas formas de obter, nesta ordem:
 *   1. TEST_DATABASE_URL apontando para um Postgres já disponível;
 *   2. Testcontainers, quando há Docker na máquina.
 *
 * A opção 1 existe porque nem toda máquina de desenvolvimento tem Docker, e
 * porque no CI o serviço de Postgres do runner é mais rápido que subir contêiner.
 */

export interface BancoDeTeste {
  url: string
  prisma: PrismaClient
  encerrar: () => Promise<void>
}

export async function prepararBanco(): Promise<BancoDeTeste> {
  const urlExterna = process.env['TEST_DATABASE_URL']

  if (urlExterna) {
    aplicarMigrations(urlExterna)
    const prisma = criarCliente(urlExterna)
    return {
      url: urlExterna,
      prisma,
      encerrar: async () => {
        await prisma.$disconnect()
      },
    }
  }

  const { PostgreSqlContainer } = await import('@testcontainers/postgresql').catch(() => {
    throw new Error(
      'Defina TEST_DATABASE_URL ou instale o Docker para os testes de integração.',
    )
  })

  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('kairos_test')
    .withUsername('kairos')
    .withPassword('kairos')
    .start()

  const url = container.getConnectionUri()
  aplicarMigrations(url)
  const prisma = criarCliente(url)

  return {
    url,
    prisma,
    encerrar: async () => {
      await prisma.$disconnect()
      await container.stop()
    },
  }
}

function criarCliente(url: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
}

function aplicarMigrations(url: string) {
  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  })
}

/** Limpa as tabelas de negócio entre cenários, preservando a referência. */
export async function limpar(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    truncate table
      usuario_tenant_perfil, perfil_permissao, usuario_permissao,
      usuario_tenant, perfil, auditoria, evento_outbox, evento_consumo,
      parametro, arquivo, usuario, tenant
    restart identity cascade
  `)
}
