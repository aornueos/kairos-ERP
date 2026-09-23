import { z } from 'zod'

/**
 * Validadores de documentos brasileiros (ver skill validation-rules).
 * Tudo é guardado sem máscara; a formatação é responsabilidade da interface.
 */

/** Remove tudo que não é dígito. */
export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Remove tudo que não é dígito ou letra maiúscula (CNPJ alfanumérico). */
export function somenteAlfanumerico(valor: string): string {
  return valor.toUpperCase().replace(/[^0-9A-Z]/g, '')
}

export function validaCpf(valor: string): boolean {
  const cpf = somenteDigitos(valor)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const dv = (ate: number): number => {
    let soma = 0
    for (let i = 0; i < ate; i++) {
      soma += Number(cpf[i]) * (ate + 1 - i)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return dv(9) === Number(cpf[9]) && dv(10) === Number(cpf[10])
}

/**
 * CNPJ, incluindo o formato alfanumérico que passa a valer em 2026.
 * As 12 primeiras posições podem ser letras ou dígitos; os 2 DVs são numéricos.
 * O valor de cada caractere é o código ASCII menos 48 (assim '0' vale 0 e 'A' vale 17).
 */
export function validaCnpj(valor: string): boolean {
  const cnpj = somenteAlfanumerico(valor)
  if (cnpj.length !== 14) return false
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj)) return false
  if (/^(.)\1{13}$/.test(cnpj)) return false

  const valorDe = (c: string): number => c.charCodeAt(0) - 48

  const dv = (ate: number): number => {
    const pesos =
      ate === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let soma = 0
    for (let i = 0; i < ate; i++) {
      soma += valorDe(cnpj[i]!) * pesos[i]!
    }
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  return dv(12) === Number(cnpj[12]) && dv(13) === Number(cnpj[13])
}

/** Chave de acesso de NF-e: 44 dígitos com DV módulo 11. */
export function validaChaveAcesso(valor: string): boolean {
  const chave = somenteDigitos(valor)
  if (chave.length !== 44) return false

  let soma = 0
  let peso = 2
  for (let i = 42; i >= 0; i--) {
    soma += Number(chave[i]) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  const resto = soma % 11
  const dv = resto < 2 ? 0 : 11 - resto

  return dv === Number(chave[43])
}

// ---------------------------------------------------------------- schemas Zod

export const cpfSchema = z
  .string()
  .transform(somenteDigitos)
  .refine(validaCpf, 'CPF inválido')

export const cnpjSchema = z
  .string()
  .transform(somenteAlfanumerico)
  .refine(validaCnpj, 'CNPJ inválido')

export const cepSchema = z
  .string()
  .transform(somenteDigitos)
  .refine((v) => v.length === 8, 'CEP deve ter 8 dígitos')

export const ncmSchema = z
  .string()
  .transform(somenteDigitos)
  .refine((v) => v.length === 8, 'NCM deve ter 8 dígitos')

export const chaveAcessoSchema = z
  .string()
  .transform(somenteDigitos)
  .refine(validaChaveAcesso, 'Chave de acesso inválida')

export const ufSchema = z
  .string()
  .transform((v) => v.toUpperCase().trim())
  .refine((v) => (UFS as readonly string[]).includes(v), 'UF inválida')

export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

/** Aceita "1.234,56", "1234,56" e "1234.56" como o mesmo número. */
export function parseDecimalPtBr(entrada: string): string {
  const limpo = entrada.trim().replace(/\s/g, '')
  if (limpo.includes(',')) {
    return limpo.replace(/\./g, '').replace(',', '.')
  }
  return limpo
}
