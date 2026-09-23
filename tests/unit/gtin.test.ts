import { describe, expect, it } from 'vitest'
import {
  digitoVerificadorGtin,
  dun14DoEan,
  gtinValido,
} from '@/modules/cadastros/domain/gtin'

/** Pares EAN/DUN do catálogo real da Pure.us (planilha de pedido). */
const CATALOGO: Array<[codigo: string, ean: string, dun: string]> = [
  ['483', '7898649053807', '17898649053804'],
  ['486', '7898649054064', '17898649054061'],
  ['477', '7898649053838', '17898649053835'],
  ['476', '7898649054040', '17898649054047'],
  ['500', '7898649054071', '17898649054078'],
]

describe('GTIN', () => {
  it.each(CATALOGO)(
    'produto %s: EAN e DUN-14 da planilha são válidos',
    (_c, ean, dun) => {
      expect(gtinValido(ean, 13)).toBe(true)
      expect(gtinValido(dun, 14)).toBe(true)
    },
  )

  it.each(CATALOGO)(
    'produto %s: DUN-14 é derivado do EAN com indicador 1',
    (_c, ean, dun) => {
      expect(dun14DoEan(ean)).toBe(dun)
    },
  )

  it('reconstrói o DUN do produto 482, que veio como "c" na planilha', () => {
    expect(dun14DoEan('7898649053791')).toBe('17898649053798')
  })

  it('detecta um dígito trocado', () => {
    expect(gtinValido('7898649053808', 13)).toBe(false)
    expect(gtinValido('17898649053805', 14)).toBe(false)
  })

  it('recusa tamanho errado e caractere não numérico', () => {
    expect(gtinValido('789864905380', 13)).toBe(false)
    expect(gtinValido('78986490538O7', 13)).toBe(false)
    expect(gtinValido('c', 14)).toBe(false)
  })

  it('calcula o dígito com pesos 3 e 1 a partir da direita', () => {
    // 789864905380 -> soma ponderada 113 -> 10 - 3 = dígito 7
    expect(digitoVerificadorGtin('789864905380')).toBe(7)
  })

  it('não deriva DUN de EAN inválido', () => {
    expect(() => dun14DoEan('7898649053808')).toThrow('EAN-13 inválido')
  })
})
