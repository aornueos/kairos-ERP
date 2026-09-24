import { z } from 'zod'
import { parseDecimalPtBr, somenteDigitos } from '@/shared/validacao/br'
import { dun14DoEan, gtinValido } from '../domain/gtin'

/**
 * Entrada dos formulários de catálogo. Tudo chega como texto do FormData;
 * a conversão e a normalização acontecem aqui, uma vez.
 */

const vazioParaNull = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? null : v

function decimal(rotulo: string, casas: number) {
  const formato = new RegExp(`^\\d{1,9}(\\.\\d{1,${casas}})?$`)
  return z.string().transform((valor, ctx) => {
    const normalizado = parseDecimalPtBr(valor)
    if (!formato.test(normalizado)) {
      ctx.addIssue({
        code: 'custom',
        message: `${rotulo} inválido. Use até ${casas} casas decimais.`,
      })
      return z.NEVER
    }
    return normalizado
  })
}

function digitos(rotulo: string, tamanho: number) {
  return z
    .string()
    .transform(somenteDigitos)
    .refine((v) => v.length === tamanho, `${rotulo} deve ter ${tamanho} dígitos`)
}

function gtin(rotulo: string, tamanho: 13 | 14) {
  return z
    .string()
    .transform(somenteDigitos)
    .refine(
      (v) => gtinValido(v, tamanho),
      `${rotulo} inválido: confira os ${tamanho} dígitos e o verificador`,
    )
}

const inteiro = (rotulo: string, min: number, max: number) =>
  z.coerce
    .number({ error: `Informe ${rotulo}` })
    .int(`${rotulo} deve ser um número inteiro`)
    .min(min, `${rotulo} deve ser no mínimo ${min}`)
    .max(max, `${rotulo} deve ser no máximo ${max}`)

export const produtoEntradaSchema = z
  .object({
    linhaId: z.uuid('Escolha a linha'),
    codigo: z.string().trim().min(1, 'Informe o código').max(20, 'Código muito longo'),
    nome: z.string().trim().min(2, 'Informe o nome').max(120, 'Nome muito longo'),
    ean: z.preprocess(vazioParaNull, gtin('EAN-13', 13).nullable()),
    dun14: z.preprocess(vazioParaNull, gtin('DUN-14', 14).nullable()),
    ncm: digitos('NCM', 8),
    cest: z.preprocess(vazioParaNull, digitos('CEST', 7).nullable()),
    cstCsosn: digitos('CST/CSOSN', 3),
    comprimentoCm: z.preprocess(vazioParaNull, decimal('Comprimento', 2).nullable()),
    larguraCm: z.preprocess(vazioParaNull, decimal('Largura', 2).nullable()),
    alturaCm: z.preprocess(vazioParaNull, decimal('Altura', 2).nullable()),
    preco: decimal('Preço', 2),
    caixaMaster: inteiro('a caixa master', 1, 100_000),
    caixaBox: z.preprocess(vazioParaNull, inteiro('o box', 1, 100_000).nullable()),
    ordem: inteiro('a ordem', 0, 9999).default(0),
    ativo: z.boolean(),
  })
  .superRefine((p, ctx) => {
    const preenchidas = [p.comprimentoCm, p.larguraCm, p.alturaCm].filter(
      (d) => d != null,
    ).length
    if (preenchidas > 0 && preenchidas < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['comprimentoCm'],
        message: 'Informe as três dimensões ou nenhuma',
      })
    }
    if (p.caixaBox != null && p.caixaMaster % p.caixaBox !== 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['caixaBox'],
        message: `A caixa master (${p.caixaMaster}) precisa conter um número inteiro de boxes`,
      })
    }
  })
  // DUN em branco é calculado do EAN: é a regra de todo o catálogo atual.
  .transform((p) => ({ ...p, dun14: p.dun14 ?? (p.ean ? dun14DoEan(p.ean) : null) }))

export const linhaEntradaSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome').max(60, 'Nome muito longo'),
  apelo: z.preprocess(
    vazioParaNull,
    z.string().trim().max(80, 'Apelo muito longo').nullable(),
  ),
  cor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida')
    .transform((c) => c.toUpperCase()),
  ordem: inteiro('a ordem', 0, 9999).default(0),
  ativo: z.boolean(),
})

export type DadosProduto = z.output<typeof produtoEntradaSchema>
export type DadosLinha = z.output<typeof linhaEntradaSchema>
