'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/shared/auth/auth'

export type EstadoLogin = { erro?: string }

/**
 * Server Action de login.
 * A ação só adapta: converte entrada e chama o provider. A decisão está em
 * `authorize` (ver skill backend-conventions).
 */
export async function entrar(
  _anterior: EstadoLogin,
  dados: FormData,
): Promise<EstadoLogin> {
  const email = String(dados.get('email') ?? '').trim()
  const senha = String(dados.get('senha') ?? '')

  if (!email || !senha) {
    return { erro: 'Informe e-mail e senha.' }
  }

  try {
    await signIn('credentials', { email, senha, redirectTo: '/' })
    return {}
  } catch (erro) {
    if (erro instanceof AuthError) {
      // Mensagem única: não revelamos se o e-mail existe nem se está bloqueado.
      return { erro: 'E-mail ou senha incorretos.' }
    }
    throw erro
  }
}
