import '../../../load-env'
import { randomBytes } from 'node:crypto'
import { uuidv7 } from 'uuidv7'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../src/generated/prisma/client'
import { MATRIZ_PADRAO, PERFIS_PADRAO } from '../../../src/shared/auth/permissoes'
import { gerarHash } from '../../../src/shared/auth/senha'
import { BANCOS, CFOPS, MUNICIPIOS, NCMS, UFS, UNIDADES } from './dados'

/**
 * Seed base: obrigatório em todo ambiente, inclusive produção.
 * Idempotente por upsert com chave natural — rodar duas vezes não duplica nem
 * sobrescreve alteração feita pelo usuário (ver skill data-seeding).
 */

const url = process.env['DATABASE_URL']
if (!url) throw new Error('DATABASE_URL não definida')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

const CNPJ_PUREUS = process.env['PUREUS_CNPJ'] ?? '00000000000191'

async function referencia() {
  for (const uf of UFS) {
    await prisma.uf.upsert({ where: { sigla: uf.sigla }, update: {}, create: uf })
  }
  for (const m of MUNICIPIOS) {
    await prisma.municipio.upsert({
      where: { codigoIbge: m.codigoIbge },
      update: {},
      create: m,
    })
  }
  for (const n of NCMS) {
    await prisma.ncm.upsert({
      where: { codigo: n.codigo },
      update: {},
      create: { ...n, vigenciaInicio: new Date(n.vigenciaInicio) },
    })
  }
  for (const c of CFOPS) {
    await prisma.cfop.upsert({ where: { codigo: c.codigo }, update: {}, create: c })
  }
  for (const b of BANCOS) {
    await prisma.banco.upsert({ where: { codigo: b.codigo }, update: {}, create: b })
  }
  for (const u of UNIDADES) {
    await prisma.unidadeMedida.upsert({
      where: { codigo: u.codigo },
      update: {},
      create: u,
    })
  }

  console.log(
    `  referência: ${UFS.length} UFs, ${MUNICIPIOS.length} municípios, ${NCMS.length} NCMs, ` +
      `${CFOPS.length} CFOPs, ${BANCOS.length} bancos, ${UNIDADES.length} unidades`,
  )
}

async function tenantPureus(): Promise<string> {
  const existente = await prisma.tenant.findUnique({ where: { cnpj: CNPJ_PUREUS } })
  if (existente) {
    console.log(`  tenant: ${existente.razaoSocial} (já existia)`)
    return existente.id
  }

  const tenant = await prisma.tenant.create({
    data: {
      id: uuidv7(),
      razaoSocial: 'Pure.us Cosméticos Ltda',
      nomeFantasia: 'Pure.us',
      cnpj: CNPJ_PUREUS,
      regimeTributario: 'SIMPLES_NACIONAL',
      ambiente: process.env['KAIROS_ENV'] === 'prod' ? 'PRODUCAO' : 'HOMOLOGACAO',
      municipioIbge: '3550308',
      email: 'contato@pureus.com.br',
    },
  })

  console.log(`  tenant: ${tenant.razaoSocial} criado`)
  return tenant.id
}

async function perfis(tenantId: string) {
  // Tabelas com RLS: é preciso abrir o contexto de tenant antes de escrever.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.tenant_id', ${tenantId}::text, true)`

    for (const [codigo, nome] of Object.entries(PERFIS_PADRAO)) {
      const perfil = await tx.perfil.upsert({
        where: { tenantId_codigo: { tenantId, codigo } },
        update: { nome },
        create: { id: uuidv7(), tenantId, codigo, nome, sistema: true },
      })

      const permissoes = MATRIZ_PADRAO[codigo as keyof typeof MATRIZ_PADRAO]

      // Perfil de sistema é gerenciado pelo seed: sincroniza e remove o que saiu.
      await tx.perfilPermissao.deleteMany({ where: { perfilId: perfil.id } })
      await tx.perfilPermissao.createMany({
        data: permissoes.map((permissao) => ({
          tenantId,
          perfilId: perfil.id,
          permissao,
        })),
      })
    }
  })

  console.log(
    `  perfis: ${Object.keys(PERFIS_PADRAO).length} criados com suas permissões`,
  )
}

/**
 * Primeiro administrador.
 * Em produção não criamos usuário com senha conhecida: use `pnpm admin:criar`.
 * Fora de produção, gera senha aleatória e imprime uma única vez.
 */
async function administrador(tenantId: string) {
  const ehProducao = process.env['KAIROS_ENV'] === 'prod'
  const email = (process.env['ADMIN_EMAIL'] ?? 'admin@pureus.local').toLowerCase()

  const jaExiste = await prisma.usuario.findUnique({ where: { email } })
  if (jaExiste) {
    console.log(`  administrador: ${email} (já existia)`)
    return
  }

  if (ehProducao) {
    console.log('  administrador: não criado em produção. Rode `pnpm admin:criar`.')
    return
  }

  const senha = randomBytes(12).toString('base64url')
  const usuarioId = uuidv7()

  await prisma.usuario.create({
    data: {
      id: usuarioId,
      nome: 'Administrador',
      email,
      senhaHash: await gerarHash(senha),
      mfaAtivo: false,
    },
  })

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.tenant_id', ${tenantId}::text, true)`

    const vinculo = await tx.usuarioTenant.create({
      data: { id: uuidv7(), tenantId, usuarioId, situacao: 'ATIVO' },
    })

    const perfilAdmin = await tx.perfil.findUniqueOrThrow({
      where: { tenantId_codigo: { tenantId, codigo: 'ADMINISTRADOR' } },
    })

    await tx.usuarioTenantPerfil.create({
      data: { tenantId, usuarioTenantId: vinculo.id, perfilId: perfilAdmin.id },
    })
  })

  console.log('\n  ┌─ Administrador criado (ambiente não produtivo) ─────────────')
  console.log(`  │  e-mail: ${email}`)
  console.log(`  │  senha : ${senha}`)
  console.log('  │  Esta senha aparece uma única vez. Troque no primeiro acesso.')
  console.log('  └─────────────────────────────────────────────────────────────\n')
}

async function principal() {
  console.log('Seed base do KAIROS')
  await referencia()
  const tenantId = await tenantPureus()
  await perfis(tenantId)
  await administrador(tenantId)
  console.log('Seed base concluído.')
}

principal()
  .catch((erro: unknown) => {
    console.error('Seed base falhou:', erro)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
