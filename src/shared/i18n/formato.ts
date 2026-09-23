import { Decimal } from 'decimal.js'

/**
 * Formatação pt-BR (ver skill i18n-ptbr).
 * Toda saída de número, moeda e data passa por aqui — nunca `toFixed` solto,
 * que produz "1234.56" na tela do usuário.
 */

export const LOCALE = 'pt-BR'
export const FUSO = 'America/Sao_Paulo'

type Numerico = Decimal | number | string

function paraNumero(valor: Numerico): number {
  if (valor instanceof Decimal) return valor.toNumber()
  if (typeof valor === 'string') return Number(valor)
  return valor
}

const fmtMoeda = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const fmtQuantidade = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
})

const fmtPercentual = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function moeda(valor: Numerico): string {
  return fmtMoeda.format(paraNumero(valor))
}

export function quantidade(valor: Numerico): string {
  return fmtQuantidade.format(paraNumero(valor))
}

export function percentual(valor: Numerico): string {
  return `${fmtPercentual.format(paraNumero(valor))}%`
}

/** Moeda abreviada para cartão de painel. O valor exato fica no detalhe. */
export function moedaCompacta(valor: Numerico): string {
  const n = paraNumero(valor)
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `R$ ${fmtPercentual.format(n / 1_000_000)} mi`
  if (abs >= 1_000) return `R$ ${fmtPercentual.format(n / 1_000)} mil`
  return moeda(n)
}

const fmtData = new Intl.DateTimeFormat(LOCALE, {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const fmtDataHora = new Intl.DateTimeFormat(LOCALE, {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function data(valor: Date): string {
  return fmtData.format(valor)
}

export function dataHora(valor: Date): string {
  return fmtDataHora.format(valor)
}

/** Competência no formato "set/2026". */
export function competencia(valor: Date): string {
  const mes = new Intl.DateTimeFormat(LOCALE, { timeZone: FUSO, month: 'short' })
    .format(valor)
    .replace('.', '')
    .toLowerCase()
  const ano = new Intl.DateTimeFormat(LOCALE, { timeZone: FUSO, year: 'numeric' }).format(
    valor,
  )
  return `${mes}/${ano}`
}

// ---------------------------------------------------------------- máscaras

export function mascararCnpj(digitos: string): string {
  const v = digitos.padStart(14, '0')
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`
}

export function mascararCpf(digitos: string): string {
  const v = digitos.padStart(11, '0')
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`
}

export function mascararCep(digitos: string): string {
  const v = digitos.padStart(8, '0')
  return `${v.slice(0, 5)}-${v.slice(5)}`
}

export function mascararTelefone(digitos: string): string {
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return digitos
}

/** CPF ou CNPJ conforme o tamanho. */
export function mascararDocumento(digitos: string): string {
  return digitos.length > 11 ? mascararCnpj(digitos) : mascararCpf(digitos)
}
