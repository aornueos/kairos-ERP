import { describe, expect, it } from 'vitest'
import {
  parseDecimalPtBr,
  somenteDigitos,
  validaChaveAcesso,
  validaCnpj,
  validaCpf,
} from '@/shared/validacao/br'

describe('validaCpf', () => {
  it('aceita CPF válido com e sem máscara', () => {
    expect(validaCpf('529.982.247-25')).toBe(true)
    expect(validaCpf('52998224725')).toBe(true)
  })

  it('rejeita dígito verificador errado', () => {
    expect(validaCpf('52998224726')).toBe(false)
  })

  it('rejeita sequência repetida', () => {
    expect(validaCpf('11111111111')).toBe(false)
    expect(validaCpf('00000000000')).toBe(false)
  })

  it('rejeita tamanho incorreto', () => {
    expect(validaCpf('5299822472')).toBe(false)
    expect(validaCpf('')).toBe(false)
  })
})

describe('validaCnpj', () => {
  it('aceita CNPJ numérico válido', () => {
    expect(validaCnpj('11.222.333/0001-81')).toBe(true)
    expect(validaCnpj('11222333000181')).toBe(true)
  })

  it('rejeita dígito verificador errado', () => {
    expect(validaCnpj('11222333000182')).toBe(false)
  })

  it('rejeita sequência repetida', () => {
    expect(validaCnpj('11111111111111')).toBe(false)
  })

  it('aceita o formato alfanumérico que passa a valer em 2026', () => {
    // As 12 primeiras posições podem ter letras; os 2 DVs continuam numéricos.
    // Valor de cada caractere = código ASCII menos 48.
    expect(validaCnpj('12ABC34501DE35')).toBe(true)
  })

  it('rejeita alfanumérico com DV errado', () => {
    expect(validaCnpj('12ABC34501DE34')).toBe(false)
  })

  it('rejeita letra na posição do dígito verificador', () => {
    expect(validaCnpj('12ABC34501DEAB')).toBe(false)
  })
})

describe('validaChaveAcesso', () => {
  it('rejeita tamanho diferente de 44', () => {
    expect(validaChaveAcesso('123')).toBe(false)
  })

  it('valida o dígito verificador módulo 11', () => {
    // Chave de teste montada com DV calculado.
    const base = '3526091122233300018155001000000012100000001'
    let soma = 0
    let peso = 2
    for (let i = base.length - 1; i >= 0; i--) {
      soma += Number(base[i]) * peso
      peso = peso === 9 ? 2 : peso + 1
    }
    const resto = soma % 11
    const dv = resto < 2 ? 0 : 11 - resto

    expect(validaChaveAcesso(base + String(dv))).toBe(true)
    expect(validaChaveAcesso(base + String((dv + 1) % 10))).toBe(false)
  })
})

describe('somenteDigitos', () => {
  it('remove máscara e espaços', () => {
    expect(somenteDigitos('11.222.333/0001-81')).toBe('11222333000181')
    expect(somenteDigitos(' (11) 98765-4321 ')).toBe('11987654321')
  })
})

describe('parseDecimalPtBr', () => {
  it('aceita as três formas que o usuário digita', () => {
    expect(parseDecimalPtBr('1.234,56')).toBe('1234.56')
    expect(parseDecimalPtBr('1234,56')).toBe('1234.56')
    expect(parseDecimalPtBr('1234.56')).toBe('1234.56')
  })

  it('ignora espaços', () => {
    expect(parseDecimalPtBr(' 1.234,56 ')).toBe('1234.56')
  })
})
