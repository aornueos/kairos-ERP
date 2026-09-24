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
 *
 * O vendedor pode negociar um preço manual por item. Ele sobrepõe o desconto:
 * o item passa a valer o preço manual, e o desconto geral não se aplica a ele.
 *
 * Embalagem: a caixa master é a caixa de embarque; o box, quando o produto tem,
 * é a embalagem intermediária. Venda por box é normal, então o alerta de
 * "embalagem aberta" olha o box quando existe e a caixa master quando não.
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
  caixaBox?: number | null
  /** Preço unitário negociado; substitui o preço com desconto. */
  precoManual?: Decimal.Value | null
}

export interface ItemCalculado {
  /** Preço unitário efetivamente cobrado: o manual, ou o de tabela com desconto. */
  precoAplicado: Dinheiro
  /** O item usa preço manual e ignora o desconto geral. */
  precoManualAplicado: boolean
  bruto: Dinheiro
  total: Dinheiro
  /** Quantidade em caixas master; pode ser fracionada. */
  caixas: Decimal
  /** Quantidade em boxes, ou null se o produto não tem box. */
  boxes: Decimal | null
  /** A quantidade fecha embalagens inteiras (box quando há, senão caixa master). */
  embalagemFechada: boolean
}

export interface TotaisRomaneio {
  itensComQuantidade: number
  unidades: number
  caixas: Decimal
  boxes: Decimal
  /** Valor de tabela, sem desconto nem preço manual. */
  bruto: Dinheiro
  /** Bruto menos total. Negativo se algum preço manual ficou acima da tabela. */
  desconto: Dinheiro
  total: Dinheiro
  /** Itens com quantidade que não fecham embalagem inteira. */
  embalagensAbertas: number
  /** Itens com quantidade vendidos a preço manual. */
  precosManuais: number
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
  const box = item.caixaBox ?? null
  if (box != null && (!Number.isInteger(box) || box <= 0)) {
    throw new Error(`Caixa box inválida: ${box}`)
  }

  const manual = item.precoManual == null ? null : new Decimal(item.precoManual)
  if (manual && (manual.isNaN() || manual.lte(0))) {
    throw new Error(`Preço manual deve ser maior que zero: ${item.precoManual}`)
  }

  const unitario = manual
    ? arredondarDinheiro(manual)
    : precoComDesconto(item.preco, descontoPercentual)
  const embalagem = box ?? item.caixaMaster

  return {
    precoAplicado: unitario,
    precoManualAplicado: manual != null,
    bruto: dinheiro(item.preco).times(item.quantidade),
    total: unitario.times(item.quantidade),
    caixas: new Decimal(item.quantidade).div(item.caixaMaster),
    boxes: box == null ? null : new Decimal(item.quantidade).div(box),
    embalagemFechada: item.quantidade % embalagem === 0,
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
  const somar = (valor: (i: (typeof comQuantidade)[number]) => Decimal) =>
    comQuantidade.reduce((soma, i) => soma.plus(valor(i)), new Decimal(0))

  const bruto = somar((i) => i.bruto)
  const total = somar((i) => i.total)

  return {
    itens: calculados,
    totais: {
      itensComQuantidade: comQuantidade.length,
      unidades: comQuantidade.reduce((soma, i) => soma + i.quantidade, 0),
      caixas: somar((i) => i.caixas),
      boxes: somar((i) => i.boxes ?? new Decimal(0)),
      bruto,
      desconto: bruto.minus(total),
      total,
      embalagensAbertas: comQuantidade.filter((i) => !i.embalagemFechada).length,
      precosManuais: comQuantidade.filter((i) => i.precoManualAplicado).length,
    },
  }
}

/** Número de exibição: 6 dígitos, que é o que cabe no código de barras do documento. */
export function formatarNumeroRomaneio(numero: number): string {
  return String(numero).padStart(6, '0')
}
