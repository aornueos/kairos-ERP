import { Decimal } from 'decimal.js'
import { arredondarDinheiro, dinheiro, type Dinheiro } from '@/shared/money/dinheiro'

/**
 * Cálculo do romaneio.
 *
 * O desconto é percentual e único para o pedido, como na planilha original.
 * O preço com desconto é arredondado por unidade e o total da linha é
 * quantidade x preço com desconto: é o que o cliente consegue conferir na
 * calculadora, e é exatamente a fórmula gravada no Excel gerado
 * (ARRED(preço*(1-desconto);2)). Os dois lados precisam bater no centavo.
 */

export const DESCONTO_MAXIMO_EXCLUSIVO = 100

export class DescontoInvalidoError extends Error {
  constructor(percentual: Decimal.Value) {
    super(`Desconto deve estar entre 0% e menos de 100%. Recebido: ${percentual}%`)
    this.name = 'DescontoInvalidoError'
  }
}

export interface ItemCalculavel {
  preco: Decimal.Value
  quantidade: number
  caixaMaster: number
}

export interface ItemCalculado {
  precoComDesconto: Dinheiro
  bruto: Dinheiro
  total: Dinheiro
  /** Quantidade em caixas de embarque; pode ser fracionada. */
  caixas: Decimal
  /** A quantidade fecha um número inteiro de caixas master. */
  caixaFechada: boolean
}

export interface TotaisRomaneio {
  itensComQuantidade: number
  unidades: number
  caixas: Decimal
  bruto: Dinheiro
  desconto: Dinheiro
  total: Dinheiro
  /** Itens com quantidade que não fecha caixa master. */
  caixasFracionadas: number
}

function validarDesconto(percentual: Decimal): void {
  if (
    percentual.isNaN() ||
    percentual.lt(0) ||
    percentual.gte(DESCONTO_MAXIMO_EXCLUSIVO)
  ) {
    throw new DescontoInvalidoError(percentual.toString())
  }
}

export function precoComDesconto(
  preco: Decimal.Value,
  descontoPercentual: Decimal.Value,
): Dinheiro {
  const percentual = new Decimal(descontoPercentual)
  validarDesconto(percentual)
  const fator = new Decimal(1).minus(percentual.div(100))
  return arredondarDinheiro(new Decimal(preco).times(fator))
}

export function calcularItem(
  item: ItemCalculavel,
  descontoPercentual: Decimal.Value,
): ItemCalculado {
  if (!Number.isInteger(item.quantidade) || item.quantidade < 0) {
    throw new Error(`Quantidade inválida: ${item.quantidade}`)
  }
  if (!Number.isInteger(item.caixaMaster) || item.caixaMaster <= 0) {
    throw new Error(`Caixa master inválida: ${item.caixaMaster}`)
  }

  const unitario = precoComDesconto(item.preco, descontoPercentual)

  return {
    precoComDesconto: unitario,
    bruto: dinheiro(item.preco).times(item.quantidade),
    total: unitario.times(item.quantidade),
    caixas: new Decimal(item.quantidade).div(item.caixaMaster),
    caixaFechada: item.quantidade % item.caixaMaster === 0,
  }
}

export function calcularRomaneio<T extends ItemCalculavel>(
  itens: readonly T[],
  descontoPercentual: Decimal.Value,
): { itens: Array<T & ItemCalculado>; totais: TotaisRomaneio } {
  validarDesconto(new Decimal(descontoPercentual))

  const calculados = itens.map((item) => ({
    ...item,
    ...calcularItem(item, descontoPercentual),
  }))

  const comQuantidade = calculados.filter((i) => i.quantidade > 0)
  const bruto = comQuantidade.reduce((soma, i) => soma.plus(i.bruto), new Decimal(0))
  const total = comQuantidade.reduce((soma, i) => soma.plus(i.total), new Decimal(0))

  return {
    itens: calculados,
    totais: {
      itensComQuantidade: comQuantidade.length,
      unidades: comQuantidade.reduce((soma, i) => soma + i.quantidade, 0),
      caixas: comQuantidade.reduce((soma, i) => soma.plus(i.caixas), new Decimal(0)),
      bruto,
      desconto: bruto.minus(total),
      total,
      caixasFracionadas: comQuantidade.filter((i) => !i.caixaFechada).length,
    },
  }
}

/** Número de exibição: 6 dígitos, que é o que cabe no código de barras do documento. */
export function formatarNumeroRomaneio(numero: number): string {
  return String(numero).padStart(6, '0')
}
