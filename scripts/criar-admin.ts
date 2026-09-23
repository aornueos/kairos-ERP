import '../load-env'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { uuidv7 } from 'uuidv7'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { gerarHash, validarPolitica } from '../src/shared/auth/senha'

/**
 * Cria o primeiro administrador de um tenant, com senha informada na hora.
 *
 * Existe porque o seed base não cria usuário com senha conhecida em produção
 * (ver skill data-seeding). Uso: pnpm admin:criar
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL']! }),
})

const rl = createInterface({ input: stdin, output: stdout })

try {
  const tenants = await prisma.tenant.findMany({
    where: { ativo: true },
    select: { id: true, razaoSocial: true, cnpj: true },
    orderBy: { razaoSocial: 'asc' },
  })

  if (tenants.length === 0) {
    console.error('Nenhum tenant ativo. Rode `pnpm seed:base` antes.')
    process.exit(1)
  }

  console.log('\nEmpresas disponíveis:')
  tenants.forEach((t, i) => console.log(`  ${i + 1}. ${t.razaoSocial} (${t.cnpj})`))

  const escolha = Number(await rl.question('\nNúmero da empresa: '))
  const tenant = tenants[escolha - 1]
  if (!tenant) {
    console.error('Escolha inválida.')
    process.exit(1)
  }

  const nome = (await rl.question('Nome completo: ')).trim()
  const email = (await rl.question('E-mail: ')).trim().toLowerCase()
  const senha = await rl.question('Senha: ')

  if (!nome || !email) {
    console.error('Nome e e-mail são obrigatórios.')
    process.exit(1)
  }

  const politica = validarPolitica(senha, [nome, email])
  if (!politica.ok) {
    console.error(politica.motivo)
    process.exit(1)
  }

  if (await prisma.usuario.findUnique({ where: { email } })) {
    console.error(`Já existe usuário com o e-mail ${email}.`)
    process.exit(1)
  }

  const usuarioId = uuidv7()

  await prisma.usuario.create({
    data: { id: usuarioId, nome, email, senhaHash: await gerarHash(senha) },
  })

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.tenant_id', ${tenant.id}::text, true)`

    const vinculo = await tx.usuarioTenant.create({
      data: { id: uuidv7(), tenantId: tenant.id, usuarioId, situacao: 'ATIVO' },
    })

    const perfil = await tx.perfil.findUniqueOrThrow({
      where: { tenantId_codigo: { tenantId: tenant.id, codigo: 'ADMINISTRADOR' } },
    })

    await tx.usuarioTenantPerfil.create({
      data: { tenantId: tenant.id, usuarioTenantId: vinculo.id, perfilId: perfil.id },
    })
  })

  console.log(`\nAdministrador ${email} criado em ${tenant.razaoSocial}.`)
  console.log('Ative o segundo fator no primeiro acesso.')
} finally {
  rl.close()
  await prisma.$disconnect()
}
