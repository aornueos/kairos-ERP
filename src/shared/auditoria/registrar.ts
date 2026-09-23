import { uuidv7 } from 'uuidv7'
import type { TransacaoTenant } from '@/shared/db/tenant-client'

/**
 * Registro na trilha de auditoria (ver skill audit-trail).
 *
 * Chamado dentro da mesma transação da alteração: se a gravação desfaz, o
 * registro também. `antes` e `depois` guardam só os campos que mudaram.
 *
 * A skill prevê captura automática por extensão do Prisma; enquanto ela não
 * existe, os repositórios chamam esta função explicitamente.
 */

export type AcaoAuditoria = 'criou' | 'alterou' | 'cancelou'

type Valor = string | number | boolean | null

export interface RegistroAuditoria {
  tenantId: string
  entidade: string
  entidadeId: string
  acao: AcaoAuditoria
  atorId: string
  antes?: Record<string, Valor> | null
  depois?: Record<string, Valor> | null
}

export async function registrarAuditoria(
  tx: TransacaoTenant,
  registro: RegistroAuditoria,
): Promise<void> {
  await tx.auditoria.create({
    data: {
      id: uuidv7(),
      tenantId: registro.tenantId,
      entidade: registro.entidade,
      entidadeId: registro.entidadeId,
      acao: registro.acao,
      atorTipo: 'USUARIO',
      atorId: registro.atorId,
      antes: registro.antes ?? undefined,
      depois: registro.depois ?? undefined,
    },
  })
}

/**
 * Campos alterados entre dois estados, já normalizados para comparação.
 * Retorna null quando nada mudou — quem chama decide não auditar.
 */
export function diferencas(
  antes: Record<string, Valor>,
  depois: Record<string, Valor>,
): { antes: Record<string, Valor>; depois: Record<string, Valor> } | null {
  const a: Record<string, Valor> = {}
  const d: Record<string, Valor> = {}

  for (const chave of Object.keys(depois)) {
    if (antes[chave] !== depois[chave]) {
      a[chave] = antes[chave] ?? null
      d[chave] = depois[chave] ?? null
    }
  }

  return Object.keys(d).length > 0 ? { antes: a, depois: d } : null
}
