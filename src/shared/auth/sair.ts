'use server'

import { signOut } from './auth'

/**
 * Encerra a sessão e volta ao login. Server Action porque o cookie de sessão
 * é httpOnly: só o servidor consegue apagá-lo.
 */
export async function sair(): Promise<void> {
  await signOut({ redirectTo: '/login' })
}
