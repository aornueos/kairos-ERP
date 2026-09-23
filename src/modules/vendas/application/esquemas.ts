import { z } from 'zod'
import {
  parseDecimalPtBr,
  somenteAlfanumerico,
  somenteDigitos,
  validaCnpj,
  validaCpf,
} from '@/shared/validacao/br'
import { DESCONTO_MAXIMO_EXCLUSIVO } from '../domain/calculo-romaneio'

const vazioParaNull = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? null : v

const textoOpcional = (max: number, rotulo: string) =>
  z.preprocess(
    vazioParaNull,
    z.string().trim().max(max, `${rotulo}: no máximo ${max} caracteres`).nullable(),
  )

/** CPF quando são 11 dígitos; qualquer outra coisa é tratada como CNPJ. */
const documentoCliente = z
  .string()
  .transform(somenteAlfanumerico)
  .refine(
    (v) => (/^\d{11}$/.test(v) ? validaCpf(v) : validaCnpj(v)),
    'CNPJ ou CPF inválido: confira os dígitos',
  )

const desconto = z.string().transform((valor, ctx) => {
  const normalizado = parseDecimalPtBr(valor.replace('%', '')) || '0'
  const numero = Number(normalizado)
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(normalizado) || numero >= DESCONTO_MAXIMO_EXCLUSIVO) {
    ctx.addIssue({
      code: 'custom',
      message: 'Desconto entre 0 e 99,99%, com até duas casas',
    })
    return z.NEVER
  }
  return numero.toFixed(2)
})

export const QUANTIDADE_MAXIMA = 1_000_000

export const romaneioEntradaSchema = z.object({
  clienteRazaoSocial: z
    .string()
    .trim()
    .min(2, 'Informe a razão social do cliente')
    .max(120, 'Razão social: no máximo 120 caracteres'),
  clienteDocumento: z.preprocess(vazioParaNull, documentoCliente.nullable()),
  clienteTelefone: z.preprocess(
    vazioParaNull,
    z
      .string()
      .transform(somenteDigitos)
      .refine(
        (v) => v.length === 10 || v.length === 11,
        'Telefone com DDD: 10 ou 11 dígitos',
      )
      .nullable(),
  ),
  clienteEmail: z.preprocess(
    vazioParaNull,
    z
      .email('E-mail inválido')
      .max(120)
      .transform((v) => v.toLowerCase())
      .nullable(),
  ),
  clienteEndereco: textoOpcional(250, 'Endereço'),
  condicoesPagamento: textoOpcional(250, 'Condições de pagamento'),
  descontoPercentual: desconto,
  observacoes: textoOpcional(1000, 'Observações'),
  quantidades: z.record(
    z.uuid(),
    z
      .number()
      .int('Quantidade deve ser inteira')
      .min(0, 'Quantidade não pode ser negativa')
      .max(QUANTIDADE_MAXIMA, 'Quantidade acima do permitido'),
  ),
})

export type DadosRomaneio = z.output<typeof romaneioEntradaSchema>
export type CabecalhoRomaneio = Omit<DadosRomaneio, 'quantidades'>
