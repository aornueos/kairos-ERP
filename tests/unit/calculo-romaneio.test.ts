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
    expect(r.precoAplicado.toFixed(2)).toBe('6.05')
    expect(r.total.toFixed(2)).toBe('871.20')
    expect(r.bruto.toFixed(2)).toBe('936.00')
    expect(r.precoManualAplicado).toBe(false)
  })

  it('quantidade zero fecha embalagem e tem total zero', () => {
    const r = calcularItem({ preco: '6.50', quantidade: 0, caixaMaster: 144 }, 10)
    expect(r.total.toFixed(2)).toBe('0.00')
    expect(r.embalagemFechada).toBe(true)
  })

  it('recusa quantidade negativa ou fracionada', () => {
    expect(() => calcularItem({ preco: 1, quantidade: -1, caixaMaster: 1 }, 0)).toThrow()
    expect(() => calcularItem({ preco: 1, quantidade: 1.5, caixaMaster: 1 }, 0)).toThrow()
  })
})

describe('preço manual do vendedor', () => {
  it('sobrepõe o desconto geral', () => {
    const r = calcularItem(
      { preco: '6.50', quantidade: 144, caixaMaster: 144, precoManual: '5.90' },
      10,
    )
    // Com 10% seria 5,85; o preço manual manda.
    expect(r.precoAplicado.toFixed(2)).toBe('5.90')
    expect(r.precoManualAplicado).toBe(true)
    expect(r.total.toFixed(2)).toBe('849.60')
    expect(r.bruto.toFixed(2)).toBe('936.00')
  })

  it('vale mesmo sem desconto no romaneio', () => {
    const r = calcularItem(
      { preco: '6.50', quantidade: 10, caixaMaster: 144, precoManual: '6' },
      0,
    )
    expect(r.precoAplicado.toFixed(2)).toBe('6.00')
  })

  it('pode ficar acima da tabela, e o desconto total fica negativo', () => {
    const { totais } = calcularRomaneio(
      [{ preco: '6.50', quantidade: 10, caixaMaster: 144, precoManual: '7.00' }],
      5,
    )
    expect(totais.total.toFixed(2)).toBe('70.00')
    expect(totais.desconto.toFixed(2)).toBe('-5.00')
  })

  it('recusa preço manual zero ou negativo', () => {
    expect(() =>
      calcularItem({ preco: 1, quantidade: 1, caixaMaster: 1, precoManual: '0' }, 0),
    ).toThrow('maior que zero')
    expect(() =>
      calcularItem({ preco: 1, quantidade: 1, caixaMaster: 1, precoManual: '-1' }, 0),
    ).toThrow()
  })

  it('preço manual nulo usa o desconto normalmente', () => {
    const r = calcularItem(
      { preco: '6.50', quantidade: 1, caixaMaster: 1, precoManual: null },
      7,
    )
    expect(r.precoAplicado.toFixed(2)).toBe('6.05')
    expect(r.precoManualAplicado).toBe(false)
  })
})

describe('embalagem: box e caixa master', () => {
  it('sem box, alerta quando não fecha a caixa master', () => {
    const aberta = calcularItem({ preco: 1, quantidade: 216, caixaMaster: 144 }, 0)
    expect(aberta.caixas.toString()).toBe('1.5')
    expect(aberta.boxes).toBeNull()
    expect(aberta.embalagemFechada).toBe(false)
  })

  it('com box, vender boxes inteiros não é embalagem aberta', () => {
    const r = calcularItem(
      { preco: 1, quantidade: 216, caixaMaster: 144, caixaBox: 12 },
      0,
    )
    expect(r.boxes?.toString()).toBe('18')
    expect(r.caixas.toString()).toBe('1.5')
    expect(r.embalagemFechada).toBe(true)
  })

  it('com box, alerta quando sobra unidade solta', () => {
    const r = calcularItem(
      { preco: 1, quantidade: 150, caixaMaster: 144, caixaBox: 12 },
      0,
    )
    expect(r.boxes?.toString()).toBe('12.5')
    expect(r.embalagemFechada).toBe(false)
  })

  it('recusa box inválido', () => {
    expect(() =>
      calcularItem({ preco: 1, quantidade: 1, caixaMaster: 144, caixaBox: 0 }, 0),
    ).toThrow('Caixa box inválida')
  })
})

describe('totais do romaneio', () => {
  const itens = [
    { id: 'a', preco: '6.50', quantidade: 144, caixaMaster: 144, caixaBox: 12 },
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
    expect(totais.boxes.toString()).toBe('12')
    expect(totais.embalagensAbertas).toBe(1)
  })

  it('conta itens com preço manual', () => {
    const { totais } = calcularRomaneio(
      [
        { preco: '6.50', quantidade: 144, caixaMaster: 144, precoManual: '6.00' },
        { preco: '6.50', quantidade: 0, caixaMaster: 144, precoManual: '6.00' },
        { preco: '6.50', quantidade: 144, caixaMaster: 144 },
      ],
      5,
    )
    expect(totais.precosManuais).toBe(1)
    // 144 x 6,00 + 144 x 6,18
    expect(totais.total.toFixed(2)).toBe('1753.92')
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
