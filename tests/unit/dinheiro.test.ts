import { describe, expect, it } from 'vitest'
import { Decimal } from 'decimal.js'
import {
  arredondarDinheiro,
  dinheiro,
  parcelar,
  ratear,
  somar,
} from '@/shared/money/dinheiro'

const str = (valores: Decimal[]) => valores.map((v) => v.toFixed(2))

describe('arredondarDinheiro', () => {
  it('arredonda meio para cima', () => {
    expect(arredondarDinheiro('0.005').toFixed(2)).toBe('0.01')
    expect(arredondarDinheiro('2.345').toFixed(2)).toBe('2.35')
  })

  it('preserva valor já arredondado', () => {
    expect(arredondarDinheiro('10.00').toFixed(2)).toBe('10.00')
  })

  it('arredonda negativo para longe do zero', () => {
    // ROUND_HALF_UP no decimal.js significa "meio para longe do zero":
    // -1.005 vira -1.01, e não -1.00. É o comportamento esperado em
    // contabilidade, e o mesmo que o contador usa ao conferir a nota.
    expect(arredondarDinheiro('-1.005').toFixed(2)).toBe('-1.01')
    expect(arredondarDinheiro('-2.344').toFixed(2)).toBe('-2.34')
  })
})

describe('ratear', () => {
  it('distribui mantendo a soma exata do total', () => {
    const partes = ratear('100.00', ['1', '1', '1'])
    expect(str(partes)).toEqual(['33.33', '33.33', '33.34'])
    expect(somar(partes).toFixed(2)).toBe('100.00')
  })

  it('distribui proporcionalmente ao peso', () => {
    const partes = ratear('50.00', ['100.00', '300.00'])
    expect(str(partes)).toEqual(['12.50', '37.50'])
    expect(somar(partes).toFixed(2)).toBe('50.00')
  })

  it('fecha o total mesmo com peso que gera dízima', () => {
    const partes = ratear('10.00', ['1', '1', '1', '1', '1', '1', '1'])
    expect(somar(partes).toFixed(2)).toBe('10.00')
  })

  it('divide igualmente quando não há base de rateio', () => {
    const partes = ratear('9.00', ['0', '0', '0'])
    expect(str(partes)).toEqual(['3.00', '3.00', '3.00'])
  })

  it('devolve lista vazia para nenhum item', () => {
    expect(ratear('10.00', [])).toEqual([])
  })

  it('rateia frete entre itens de nota sem sobrar centavo', () => {
    // Caso real: frete de 87,53 sobre três itens de valores quebrados.
    const partes = ratear('87.53', ['129.90', '349.70', '78.40'])
    expect(somar(partes).toFixed(2)).toBe('87.53')
  })
})

describe('parcelar', () => {
  it('coloca a diferença na primeira parcela', () => {
    expect(str(parcelar('1000.00', 3))).toEqual(['333.34', '333.33', '333.33'])
  })

  it('divide exatamente quando não há resto', () => {
    expect(str(parcelar('3000.00', 3))).toEqual(['1000.00', '1000.00', '1000.00'])
  })

  it('parcela única devolve o total', () => {
    expect(str(parcelar('157.89', 1))).toEqual(['157.89'])
  })

  it('a soma das parcelas é sempre o total', () => {
    for (const n of [2, 3, 4, 6, 7, 12]) {
      expect(somar(parcelar('1234.57', n)).toFixed(2)).toBe('1234.57')
    }
  })

  it('rejeita número de parcelas inválido', () => {
    expect(() => parcelar('100.00', 0)).toThrow()
  })
})

describe('somar', () => {
  it('soma lista vazia como zero', () => {
    expect(somar([]).toFixed(2)).toBe('0.00')
  })

  it('não sofre o erro de ponto flutuante', () => {
    expect(somar([dinheiro('0.1'), dinheiro('0.2')]).toFixed(2)).toBe('0.30')
  })
})
