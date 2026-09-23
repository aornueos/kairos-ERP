import { hash, verify } from '@node-rs/argon2'

/**
 * Hash de senha com Argon2id (ver skill auth-rbac).
 * Parâmetros seguem a recomendação OWASP: 19 MiB, 2 iterações, paralelismo 1.
 */
const OPCOES = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const

export const TAMANHO_MINIMO_SENHA = 12

export async function gerarHash(senha: string): Promise<string> {
  return hash(senha, OPCOES)
}

export async function conferirSenha(
  senha: string,
  hashArmazenado: string,
): Promise<boolean> {
  try {
    return await verify(hashArmazenado, senha, OPCOES)
  } catch {
    // Hash corrompido ou de formato desconhecido: trata como senha errada,
    // sem vazar a diferença para quem está tentando entrar.
    return false
  }
}

export type ProblemaSenha = { ok: false; motivo: string } | { ok: true }

/** Política mínima. A verificação contra listas de senhas vazadas entra na fase 1. */
export function validarPolitica(
  senha: string,
  dadosDoUsuario: string[] = [],
): ProblemaSenha {
  if (senha.length < TAMANHO_MINIMO_SENHA) {
    return {
      ok: false,
      motivo: `A senha precisa de no mínimo ${TAMANHO_MINIMO_SENHA} caracteres`,
    }
  }
  if (/^(.)\1+$/.test(senha)) {
    return { ok: false, motivo: 'A senha não pode ser um único caractere repetido' }
  }
  const minuscula = senha.toLowerCase()
  for (const dado of dadosDoUsuario) {
    if (dado.length >= 4 && minuscula.includes(dado.toLowerCase())) {
      return { ok: false, motivo: 'A senha não pode conter seu nome ou e-mail' }
    }
  }
  return { ok: true }
}
