import { calcularRomaneio, formatarNumeroRomaneio } from '../domain/calculo-romaneio'

/**
 * Documento do romaneio: a única fonte que o PDF e o Excel leem.
 *
 * Tudo que é conta acontece aqui, uma vez, pelo domínio. Os geradores só
 * desenham — assim o PDF e o Excel nunca divergem em centavo.
 */

export type TipoDocumento = 'ROMANEIO' | 'MODELO'

export interface EmpresaDocumento {
  razaoSocial: string
  nomeFantasia: string | null
  /** Sem máscara. */
  cnpj: string
  inscricaoEstadual: string | null
  /** Endereço em uma linha, já montado. */
  endereco: string | null
  telefone: string | null
  email: string | null
}

export interface ClienteDocumento {
  razaoSocial: string
  documento: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
}

export interface ItemEntrada {
  codigo: string
  nome: string
  ean: string | null
  dun14: string | null
  ncm: string
  cest: string | null
  cstCsosn: string
  comprimentoCm: string | null
  larguraCm: string | null
  alturaCm: string | null
  preco: string
  /** Preço unitário negociado pelo vendedor; sobrepõe o desconto. */
  precoManual: string | null
  caixaMaster: number
  caixaBox: number | null
  quantidade: number
}

export interface GrupoEntrada {
  nome: string
  apelo: string | null
  cor: string
  itens: ItemEntrada[]
}

export interface EntradaDocumento {
  tipo: TipoDocumento
  numero: number | null
  cancelado: boolean
  emitidoEm: Date
  vendedor: string | null
  empresa: EmpresaDocumento
  cliente: ClienteDocumento | null
  condicoesPagamento: string | null
  /** Percentual em texto decimal: "5.00". */
  descontoPercentual: string
  observacoes: string | null
  grupos: GrupoEntrada[]
}

export interface ItemDocumento extends ItemEntrada {
  /** Preço unitário cobrado: o manual, ou o de tabela com desconto. */
  precoAplicado: string
  precoManualAplicado: boolean
  total: string
  bruto: string
  caixas: string
  /** Quantidade em boxes, ou null se o produto não tem box. */
  boxes: string | null
  embalagemFechada: boolean
}

export interface GrupoDocumento {
  nome: string
  apelo: string | null
  cor: string
  itens: ItemDocumento[]
}

export interface DocumentoRomaneio {
  tipo: TipoDocumento
  /** Número formatado com seis dígitos, ou null na tabela em branco. */
  numero: string | null
  cancelado: boolean
  emitidoEm: Date
  geradoEm: Date
  vendedor: string | null
  empresa: EmpresaDocumento
  cliente: ClienteDocumento | null
  condicoesPagamento: string | null
  descontoPercentual: string
  observacoes: string | null
  grupos: GrupoDocumento[]
  totais: {
    itensComQuantidade: number
    unidades: number
    caixas: string
    boxes: string
    bruto: string
    desconto: string
    total: string
    embalagensAbertas: number
    precosManuais: number
  }
}

export function montarDocumento(
  entrada: EntradaDocumento,
  geradoEm: Date,
): DocumentoRomaneio {
  const planos = entrada.grupos.flatMap((g, indiceGrupo) =>
    g.itens.map((item) => ({ ...item, indiceGrupo })),
  )
  const { itens, totais } = calcularRomaneio(planos, entrada.descontoPercentual)

  const grupos: GrupoDocumento[] = entrada.grupos.map((g, indiceGrupo) => ({
    nome: g.nome,
    apelo: g.apelo,
    cor: g.cor,
    itens: itens
      .filter((i) => i.indiceGrupo === indiceGrupo)
      .map(({ indiceGrupo: _g, ...i }) => ({
        ...i,
        precoAplicado: i.precoAplicado.toFixed(2),
        total: i.total.toFixed(2),
        bruto: i.bruto.toFixed(2),
        caixas: i.caixas.toDecimalPlaces(2).toString(),
        boxes: i.boxes == null ? null : i.boxes.toDecimalPlaces(2).toString(),
      })),
  }))

  return {
    tipo: entrada.tipo,
    numero: entrada.numero == null ? null : formatarNumeroRomaneio(entrada.numero),
    cancelado: entrada.cancelado,
    emitidoEm: entrada.emitidoEm,
    geradoEm,
    vendedor: entrada.vendedor,
    empresa: entrada.empresa,
    cliente: entrada.cliente,
    condicoesPagamento: entrada.condicoesPagamento,
    descontoPercentual: entrada.descontoPercentual,
    observacoes: entrada.observacoes,
    grupos,
    totais: {
      itensComQuantidade: totais.itensComQuantidade,
      unidades: totais.unidades,
      caixas: totais.caixas.toDecimalPlaces(2).toString(),
      boxes: totais.boxes.toDecimalPlaces(2).toString(),
      bruto: totais.bruto.toFixed(2),
      desconto: totais.desconto.toFixed(2),
      total: totais.total.toFixed(2),
      embalagensAbertas: totais.embalagensAbertas,
      precosManuais: totais.precosManuais,
    },
  }
}

/**
 * Nome do arquivo baixado: "romaneio-000123-salao-bela.pdf". Sem acento e sem
 * espaço, porque o arquivo vai por WhatsApp e e-mail e volta renomeado se não.
 */
export function nomeDoArquivo(doc: DocumentoRomaneio, extensao: 'pdf' | 'xlsx'): string {
  if (doc.tipo === 'MODELO') return `tabela-de-pedido.${extensao}`

  const cliente = (doc.cliente?.razaoSocial ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

  return ['romaneio', doc.numero, cliente].filter(Boolean).join('-') + `.${extensao}`
}
