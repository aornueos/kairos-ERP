import { Decimal } from 'decimal.js'

/**
 * Dinheiro e quantidade no KAIROS (ver skill backend-conventions).
 *
 * Regra absoluta: nunca `number` para valor monetário. `0.1 + 0.2` é o começo
 * de uma NF-e rejeitada por diferença de centavo.
 */

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export type Dinheiro = Decimal
export type Quantidade = Decimal

export const CASAS_DINHEIRO = 2
export const CASAS_QUANTIDADE = 4

export function dinheiro(valor: Decimal.Value): Dinheiro {
  return new Decimal(valor)
}

export function quantidade(valor: Decimal.Value): Quantidade {
  return new Decimal(valor)
}

export const ZERO = new Decimal(0)

/** Arredonda para 2 casas, meio para cima. Use só no final do cálculo. */
export function arredondarDinheiro(valor: Decimal.Value): Dinheiro {
  return new Decimal(valor).toDecimalPlaces(CASAS_DINHEIRO, Decimal.ROUND_HALF_UP)
}

export function arredondarQuantidade(valor: Decimal.Value): Quantidade {
  return new Decimal(valor).toDecimalPlaces(CASAS_QUANTIDADE, Decimal.ROUND_HALF_UP)
}

export function somar(valores: readonly Decimal.Value[]): Dinheiro {
  return valores.reduce<Decimal>((acc, v) => acc.plus(v), ZERO)
}

/**
 * Rateia um total entre pesos, garantindo que a soma das partes seja exatamente
 * igual ao total. A diferença de centavos vai para a última parte.
 *
 * É o cálculo que distribui frete e desconto entre itens da nota. Se a soma não
 * fechar, a SEFAZ rejeita.
 */
export function ratear(
  total: Decimal.Value,
  pesos: readonly Decimal.Value[],
): Dinheiro[] {
  const totalDec = new Decimal(total)
  const pesosDec = pesos.map((p) => new Decimal(p))
  const somaPesos = pesosDec.reduce<Decimal>((acc, p) => acc.plus(p), ZERO)

  if (pesosDec.length === 0) return []

  // Sem base de rateio: distribui igualmente.
  if (somaPesos.isZero()) {
    const parte = arredondarDinheiro(totalDec.dividedBy(pesosDec.length))
    const partes = pesosDec.map(() => parte)
    return ajustarSobra(partes, totalDec)
  }

  const partes = pesosDec.map((p) =>
    arredondarDinheiro(totalDec.times(p).dividedBy(somaPesos)),
  )
  return ajustarSobra(partes, totalDec)
}

function ajustarSobra(partes: Dinheiro[], total: Decimal): Dinheiro[] {
  const soma = partes.reduce<Decimal>((acc, p) => acc.plus(p), ZERO)
  const sobra = total.minus(soma)

  if (sobra.isZero() || partes.length === 0) return partes

  const ultimo = partes.length - 1
  const ajustadas = [...partes]
  ajustadas[ultimo] = arredondarDinheiro(partes[ultimo]!.plus(sobra))
  return ajustadas
}

/**
 * Divide um valor em N parcelas iguais, com a diferença na primeira.
 * Condição 30/60/90 sobre 1.000,00 vira 333,34 + 333,33 + 333,33.
 */
export function parcelar(total: Decimal.Value, parcelas: number): Dinheiro[] {
  if (parcelas < 1) throw new Error('Número de parcelas deve ser maior que zero')

  const totalDec = new Decimal(total)
  const base = arredondarDinheiro(totalDec.dividedBy(parcelas))
  const valores = Array.from({ length: parcelas }, () => base)
  const soma = base.times(parcelas)
  const sobra = totalDec.minus(soma)

  if (!sobra.isZero()) {
    valores[0] = arredondarDinheiro(base.plus(sobra))
  }

  return valores
}
