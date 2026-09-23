/**
 * Hierarquia de erros do KAIROS (ver skill error-handling).
 *
 * O `codigo` é contrato estável: a interface e as integrações programam contra
 * ele, não contra o texto da mensagem.
 */

export type ContextoErro = Record<string, unknown>

export class KairosError extends Error {
  readonly codigo: string
  readonly contexto: ContextoErro | undefined
  readonly statusHttp: number = 500

  constructor(
    codigo: string,
    mensagem: string,
    contexto?: ContextoErro,
    opcoes?: { cause?: unknown },
  ) {
    super(mensagem, opcoes)
    this.name = new.target.name
    this.codigo = codigo
    this.contexto = contexto
  }
}

/** 400 — entrada malformada. */
export class ValidacaoError extends KairosError {
  override readonly statusHttp = 400
  readonly campos: Record<string, string>

  constructor(mensagem = 'Dados inválidos', campos: Record<string, string> = {}) {
    super('VALIDACAO', mensagem, { campos })
    this.campos = campos
  }
}

/** 401 — sem sessão válida. */
export class NaoAutenticadoError extends KairosError {
  override readonly statusHttp = 401
  constructor(mensagem = 'Faça login para continuar') {
    super('NAO_AUTENTICADO', mensagem)
  }
}

/** 403 — autenticado, mas sem a permissão exigida. */
export class SemPermissaoError extends KairosError {
  override readonly statusHttp = 403
  constructor(permissao: string) {
    super('SEM_PERMISSAO', 'Você não tem permissão para esta ação', { permissao })
  }
}

/**
 * 404 — recurso inexistente.
 * Dado de outro tenant também cai aqui, nunca em 403: não confirmamos existência.
 */
export class NaoEncontradoError extends KairosError {
  override readonly statusHttp = 404
  constructor(entidade: string, id?: string) {
    super('NAO_ENCONTRADO', `${entidade} não encontrado`, { entidade, id })
  }
}

/** 409 — estado incompatível com a operação, ou conflito de lock otimista. */
export class ConflitoError extends KairosError {
  override readonly statusHttp = 409
  constructor(codigo: string, mensagem: string, contexto?: ContextoErro) {
    super(codigo, mensagem, contexto)
  }
}

/** 422 — invariante de domínio violada. Erros específicos herdam desta. */
export class RegraNegocioError extends KairosError {
  override readonly statusHttp = 422
}

/** 502 — provedor externo falhou. Sempre preserve a causa. */
export class IntegracaoError extends KairosError {
  override readonly statusHttp = 502
  constructor(
    codigo: string,
    mensagem: string,
    contexto?: ContextoErro,
    opcoes?: { cause?: unknown },
  ) {
    super(codigo, mensagem, contexto, opcoes)
  }
}

export function ehKairosError(erro: unknown): erro is KairosError {
  return erro instanceof KairosError
}

/** Status HTTP de qualquer erro, com 500 como padrão seguro. */
export function statusDoErro(erro: unknown): number {
  return ehKairosError(erro) ? erro.statusHttp : 500
}

/**
 * Mensagem segura para o usuário final.
 * Erro desconhecido nunca vaza detalhe interno: o `errorId` do log é a ponte.
 */
export function mensagemParaUsuario(erro: unknown): string {
  if (ehKairosError(erro)) return erro.message
  return 'Não foi possível concluir a operação. Tente novamente.'
}
