/**
 * Códigos GTIN (GS1): EAN-13 na unidade de venda, DUN-14 na caixa de embarque.
 *
 * O dígito verificador é módulo 10 com pesos 3 e 1 alternados, contados da
 * direita para a esquerda sem o próprio dígito. Serve para GTIN-8, 12, 13 e 14.
 */

const SO_DIGITOS = /^\d+$/

export function digitoVerificadorGtin(corpo: string): number {
  if (!SO_DIGITOS.test(corpo))
    throw new Error(`GTIN com caractere não numérico: ${corpo}`)

  let soma = 0
  for (let i = 0; i < corpo.length; i++) {
    const digito = Number(corpo[corpo.length - 1 - i])
    soma += digito * (i % 2 === 0 ? 3 : 1)
  }
  return (10 - (soma % 10)) % 10
}

export function gtinValido(codigo: string, tamanho: 8 | 12 | 13 | 14): boolean {
  if (codigo.length !== tamanho || !SO_DIGITOS.test(codigo)) return false
  return digitoVerificadorGtin(codigo.slice(0, -1)) === Number(codigo.at(-1))
}

/**
 * DUN-14 derivado do EAN-13: indicador logístico + 12 primeiros dígitos do EAN
 * + novo dígito verificador.
 *
 * É a regra que a Pure.us usa em todo o catálogo, com indicador 1. Um DUN com
 * indicador diferente continua aceito se informado explicitamente.
 */
export function dun14DoEan(ean: string, indicador = '1'): string {
  if (!gtinValido(ean, 13)) throw new Error(`EAN-13 inválido: ${ean}`)
  if (!/^[1-8]$/.test(indicador))
    throw new Error(`Indicador logístico inválido: ${indicador}`)

  const corpo = indicador + ean.slice(0, 12)
  return corpo + digitoVerificadorGtin(corpo)
}
