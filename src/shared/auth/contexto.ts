import { SemPermissaoError } from '@/shared/errors'
import type { Permissao } from './permissoes'

/**
 * Contexto de execução de um caso de uso (ver skill backend-conventions).
 *
 * Carrega tenant, ator, permissões efetivas e o relógio. `agora()` é injetado
 * para o teste controlar o tempo: `new Date()` dentro de domínio é proibido.
 */
export interface Contexto {
  readonly tenantId: string
  readonly usuarioId: string
  readonly nome: string
  readonly email: string
  readonly permissoes: ReadonlySet<Permissao | 'admin.total'>
  readonly escopo: Escopo
  readonly requestId: string
  agora(): Date
  temPermissao(permissao: Permissao): boolean
  exigirPermissao(permissao: Permissao): void
}

export interface Escopo {
  readonly depositos?: readonly string[]
  readonly filiais?: readonly string[]
  readonly carteira?: readonly string[]
}

export interface DadosContexto {
  tenantId: string
  usuarioId: string
  nome: string
  email: string
  permissoes: Iterable<string>
  escopo?: Escopo
  requestId: string
  agora?: () => Date
}

export function criarContexto(dados: DadosContexto): Contexto {
  const permissoes = new Set(dados.permissoes) as ReadonlySet<Permissao | 'admin.total'>
  const agora = dados.agora ?? (() => new Date())

  const temPermissao = (permissao: Permissao): boolean =>
    permissoes.has('admin.total') || permissoes.has(permissao)

  return {
    tenantId: dados.tenantId,
    usuarioId: dados.usuarioId,
    nome: dados.nome,
    email: dados.email,
    permissoes,
    escopo: dados.escopo ?? {},
    requestId: dados.requestId,
    agora,
    temPermissao,
    exigirPermissao(permissao: Permissao) {
      if (!temPermissao(permissao)) throw new SemPermissaoError(permissao)
    },
  }
}
