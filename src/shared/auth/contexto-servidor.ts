import { randomUUID } from 'node:crypto'
import { comTenant } from '@/shared/db/tenant-client'
import { NaoAutenticadoError } from '@/shared/errors'
import { auth } from './auth'
import { criarContexto, type Contexto, type Escopo } from './contexto'

/**
 * Monta o Contexto a partir da sessão, carregando as permissões efetivas
 * do banco a cada requisição.
 *
 * As permissões NÃO ficam no token: revogar acesso precisa valer na hora,
 * não só quando a sessão de 8 horas expirar.
 */
export async function contextoDaRequisicao(): Promise<Contexto> {
  const sessao = await auth()

  if (!sessao?.user?.id || !sessao.user.tenantId) {
    throw new NaoAutenticadoError()
  }

  const { id: usuarioId, tenantId } = sessao.user

  // Vínculo, perfis e exceções vivem em tabelas com RLS: a leitura precisa do
  // contexto de tenant. Aqui já o conhecemos pela sessão, então é o caminho
  // normal — nada de contexto de autenticação.
  const { vinculo, excecoes } = await comTenant(tenantId, async (tx) => ({
    vinculo: await tx.usuarioTenant.findUnique({
      where: { tenantId_usuarioId: { tenantId, usuarioId } },
      include: {
        usuario: { select: { nome: true, email: true, ativo: true } },
        perfis: {
          include: {
            perfil: {
              select: { ativo: true, permissoes: { select: { permissao: true } } },
            },
          },
        },
      },
    }),
    excecoes: await tx.usuarioPermissao.findMany({
      where: { tenantId, usuarioId },
      select: { permissao: true, concedida: true },
    }),
  }))

  if (!vinculo || vinculo.situacao !== 'ATIVO' || !vinculo.usuario.ativo) {
    throw new NaoAutenticadoError('Seu acesso a esta empresa não está mais ativo')
  }

  const permissoes = new Set<string>()
  for (const vp of vinculo.perfis) {
    if (!vp.perfil.ativo) continue
    for (const p of vp.perfil.permissoes) permissoes.add(p.permissao)
  }

  // Exceções pontuais sobrepõem o perfil, em qualquer direção.
  for (const e of excecoes) {
    if (e.concedida) permissoes.add(e.permissao)
    else permissoes.delete(e.permissao)
  }

  return criarContexto({
    tenantId,
    usuarioId,
    nome: vinculo.usuario.nome,
    email: vinculo.usuario.email,
    permissoes,
    escopo: (vinculo.escopo as Escopo | null) ?? {},
    requestId: randomUUID(),
  })
}

/** Versão que não lança: para telas que mudam de forma quando não há sessão. */
export async function contextoOpcional(): Promise<Contexto | null> {
  try {
    return await contextoDaRequisicao()
  } catch {
    return null
  }
}
