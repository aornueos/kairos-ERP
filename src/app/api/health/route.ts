import { NextResponse } from 'next/server'
import { prisma } from '@/shared/db/client'

export const dynamic = 'force-dynamic'

/**
 * Health check usado pelo deploy e pelo monitor externo
 * (ver skill monitoring-alerts). Responde 200 com o detalhe por dependência,
 * ou 503 se alguma essencial estiver fora.
 */
export async function GET() {
  const dependencias: Record<string, 'ok' | 'falha'> = {}

  try {
    await prisma.$queryRaw`select 1`
    dependencias['banco'] = 'ok'
  } catch {
    dependencias['banco'] = 'falha'
  }

  const saudavel = Object.values(dependencias).every((s) => s === 'ok')

  return NextResponse.json(
    {
      situacao: saudavel ? 'ok' : 'degradado',
      dependencias,
      versao: process.env['npm_package_version'] ?? '0.1.0',
      momento: new Date().toISOString(),
    },
    { status: saudavel ? 200 : 503 },
  )
}
