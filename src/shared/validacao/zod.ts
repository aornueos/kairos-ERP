import type { z } from 'zod'
import { ValidacaoError } from '@/shared/errors'

/**
 * Valida na fronteira do caso de uso e converte a falha em ValidacaoError com
 * uma mensagem por campo — o formato que os formulários sabem exibir.
 */
export function validar<S extends z.ZodType>(esquema: S, entrada: unknown): z.output<S> {
  const resultado = esquema.safeParse(entrada)
  if (resultado.success) return resultado.data

  const campos: Record<string, string> = {}
  for (const problema of resultado.error.issues) {
    const campo = problema.path.join('.') || '_'
    campos[campo] ??= problema.message
  }
  throw new ValidacaoError('Confira os campos destacados', campos)
}
