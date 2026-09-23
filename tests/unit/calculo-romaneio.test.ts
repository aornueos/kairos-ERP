import { describe, expect, it } from 'vitest'
import {
  calcularItem,
  calcularRomaneio,
  DescontoInvalidoError,
  formatarNumeroRomaneio,
  precoComDesconto,
} from '@/modules/vendas/domain/calculo-romaneio'

describe('preço com desconto', () => {
  it('sem desconto mantém o preço', () => {
    expect(precoComDesconto('6.50', 0).toFixed(2)).toBe('6.50')
  })

  it('arredonda por unidade, meio para cima', () => {
    // 6,50 x 0,93 = 6,045 -> 6,05
    expect(precoComDesconto('6.50', 7).toFixed(2)).toBe('6.05')
    // 6,50 x 0,97 = 6,305 -> 6,31
    expect(precoComDesconto('6.50', 3).toFixed(2)).toBe('6.31')
  })

  it('aceita desconto com casas decimais', () => {
    expect(precoComDesconto('10.00', '2.5').toFixed(2)).toBe('9.75')
  })

  it.each([-1, 100, 150])('recusa desconto de %s%%', (d) => {
    expect(() => precoComDesconto('6.50', d)).toThrow(DescontoInvalidoError)
  })
})

describe('item do romaneio', () => {
  it('total é quantidade x preço já descontado', () => {
    const r = calcularItem({ preco: '6.50', quantidade: 144, caixaMaster: 144 }, 7)
    expect(r.precoComDesconto.toFixed(2)).toBe('6.05')
    expect(r.total.toFixed(2)).toBe('871.20')
    expect(r.bruto.toFixed(2)).toBe('936.00')
  })

  it('conta caixas e sinaliza caixa aberta', () => {
    expect(
      calcularItem({ preco: 1, quantidade: 288, caixaMaster: 144 }, 0),
    ).toMatchObject({
      caixaFechada: true,
    })
    const aberta = calcularItem({ preco: 1, quantidade: 216, caixaMaster: 144 }, 0)
    expect(aberta.caixas.toString()).toBe('1.5')
    expect(aberta.caixaFechada).toBe(false)
  })

  it('quantidade zero é caixa fechada e total zero', () => {
    const r = calcularItem({ preco: '6.50', quantidade: 0, caixaMaster: 144 }, 10)
    expect(r.total.toFixed(2)).toBe('0.00')
    expect(r.caixaFechada).toBe(true)
  })

  it('recusa quantidade negativa ou fracionada', () => {
    expect(() => calcularItem({ preco: 1, quantidade: -1, caixaMaster: 1 }, 0)).toThrow()
    expect(() => calcularItem({ preco: 1, quantidade: 1.5, caixaMaster: 1 }, 0)).toThrow()
  })
})

describe('totais do romaneio', () => {
  const itens = [
    { id: 'a', preco: '6.50', quantidade: 144, caixaMaster: 144 },
    { id: 'b', preco: '6.50', quantidade: 72, caixaMaster: 144 },
    { id: 'c', preco: '6.50', quantidade: 0, caixaMaster: 144 },
  ]

  it('fecha bruto, desconto e total no centavo', () => {
    const { totais } = calcularRomaneio(itens, 7)
    expect(totais.bruto.toFixed(2)).toBe('1404.00')
    expect(totais.total.toFixed(2)).toBe('1306.80')
    expect(totais.desconto.toFixed(2)).toBe('97.20')
    expect(totais.bruto.minus(totais.desconto).equals(totais.total)).toBe(true)
  })

  it('conta só o que tem quantidade', () => {
    const { totais } = calcularRomaneio(itens, 0)
    expect(totais.itensComQuantidade).toBe(2)
    expect(totais.unidades).toBe(216)
    expect(totais.caixas.toString()).toBe('1.5')
    expect(totais.caixasFracionadas).toBe(1)
  })

  it('preserva os campos do item de entrada', () => {
    const { itens: calculados } = calcularRomaneio(itens, 0)
    expect(calculados.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('romaneio vazio tem total zero', () => {
    const { totais } = calcularRomaneio([], 5)
    expect(totais.total.toFixed(2)).toBe('0.00')
    expect(totais.unidades).toBe(0)
  })
})

describe('número do romaneio', () => {
  it('tem seis dígitos', () => {
    expect(formatarNumeroRomaneio(1)).toBe('000001')
    expect(formatarNumeroRomaneio(123456)).toBe('123456')
  })
})
