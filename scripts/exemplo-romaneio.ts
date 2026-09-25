import '../load-env'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CATALOGO_PUREUS } from '../prisma/seed/base/catalogo-pureus'
import {
  montarDocumento,
  nomeDoArquivo,
  type EntradaDocumento,
} from '../src/modules/vendas/application/documento'
import { gerarPdf } from '../src/modules/vendas/infra/documentos/pdf'
import { gerarXlsx } from '../src/modules/vendas/infra/documentos/xlsx'
import { dun14DoEan } from '../src/modules/cadastros/domain/gtin'

/**
 * Gera um romaneio de exemplo, o romaneio em branco (para o vendedor preencher
 * à mão enquanto o sistema não grava romaneios) e a tabela em branco do
 * cliente, sem banco e sem login. Uso:
 *
 *   pnpm exemplo:romaneio [pasta-de-saida]
 *
 * Cliente, CNPJ da empresa e vendedor são fictícios; o catálogo é o real.
 * O box de 12 unidades é ilustrativo: a planilha original não informa o box,
 * e o catálogo real só recebe esse valor quando a Pure.us confirmar.
 */

const destino = path.resolve(process.argv[2] ?? 'exemplos')

/** Pedido de exemplo: quantidades em unidades, por código de produto. */
const PEDIDO: Record<string, number> = {
  '482': 144,
  '483': 144,
  '484': 72,
  '485': 144,
  '477': 288,
  '478': 288,
  '479': 144,
  '472': 144,
  '473': 144,
  '475': 216,
  '500': 150,
}

/** Box ilustrativo, só para o exemplo mostrar a coluna e a contagem. */
const BOX_ILUSTRATIVO = 12

/** Preço negociado pelo vendedor em um item, para mostrar que sobrepõe o desconto. */
const PRECO_MANUAL: Record<string, string> = { '477': '5.90' }

const EMPRESA: EntradaDocumento['empresa'] = {
  razaoSocial: 'Pure.us Cosméticos Ltda',
  nomeFantasia: 'Pure.us',
  cnpj: '00000000000000',
  inscricaoEstadual: null,
  endereco: 'Endereço da empresa  ·  São Paulo/SP',
  telefone: '(11) 0000-0000',
  email: 'contato@pureus.com.br',
}

function grupos(comQuantidade: boolean): EntradaDocumento['grupos'] {
  return CATALOGO_PUREUS.map((linha) => ({
    nome: linha.nome,
    apelo: linha.apelo,
    cor: linha.cor,
    itens: linha.produtos.map((p) => ({
      codigo: p.codigo,
      nome: p.nome,
      ean: p.ean,
      dun14: p.dun14 ?? dun14DoEan(p.ean),
      ncm: p.ncm,
      cest: p.cest,
      cstCsosn: p.cstCsosn,
      comprimentoCm: p.dimensoes[0],
      larguraCm: p.dimensoes[1],
      alturaCm: p.dimensoes[2],
      preco: p.preco,
      precoManual: comQuantidade ? (PRECO_MANUAL[p.codigo] ?? null) : null,
      caixaMaster: p.caixaMaster,
      caixaBox: p.caixaBox ?? BOX_ILUSTRATIVO,
      quantidade: comQuantidade ? (PEDIDO[p.codigo] ?? 0) : 0,
    })),
  }))
}

const agora = new Date()

const romaneio = montarDocumento(
  {
    tipo: 'ROMANEIO',
    numero: 1,
    cancelado: false,
    emitidoEm: agora,
    vendedor: 'Vendedor de exemplo',
    empresa: EMPRESA,
    cliente: {
      razaoSocial: 'Salão Bela Forma Cosméticos Ltda',
      documento: '11222333000181',
      telefone: '11987654321',
      email: 'compras@belaforma.com.br',
      endereco: 'Rua das Flores, 123  ·  Centro  ·  Campinas/SP  ·  13010-000',
    },
    condicoesPagamento: '30/60/90 dias no boleto',
    descontoPercentual: '5.00',
    observacoes: 'Entregar em horário comercial. Frete por conta do cliente (FOB).',
    grupos: grupos(true),
  },
  agora,
)

const modelo = montarDocumento(
  {
    tipo: 'MODELO',
    numero: null,
    cancelado: false,
    emitidoEm: agora,
    vendedor: null,
    empresa: EMPRESA,
    cliente: null,
    condicoesPagamento: null,
    descontoPercentual: '0.00',
    observacoes: null,
    grupos: grupos(false),
  },
  agora,
)

/** Sem número: número, emissão, vendedor e preço negociado ficam liberados no Excel. */
const emBranco = montarDocumento(
  {
    tipo: 'ROMANEIO',
    numero: null,
    cancelado: false,
    emitidoEm: agora,
    vendedor: null,
    empresa: EMPRESA,
    cliente: null,
    condicoesPagamento: null,
    descontoPercentual: '0.00',
    observacoes: null,
    grupos: grupos(false),
  },
  agora,
)

await mkdir(destino, { recursive: true })

const documentos = [
  { doc: romaneio, nome: (ext: 'pdf' | 'xlsx') => nomeDoArquivo(romaneio, ext) },
  { doc: emBranco, nome: (ext: 'pdf' | 'xlsx') => `romaneio-em-branco.${ext}` },
  { doc: modelo, nome: (ext: 'pdf' | 'xlsx') => nomeDoArquivo(modelo, ext) },
]

for (const { doc, nome } of documentos) {
  const [pdf, xlsx] = await Promise.all([gerarPdf(doc), gerarXlsx(doc)])
  await writeFile(path.join(destino, nome('pdf')), pdf)
  await writeFile(path.join(destino, nome('xlsx')), xlsx)
  console.log(`${nome('pdf')}  ${nome('xlsx')}`)
}

console.log(`Total do romaneio de exemplo: R$ ${romaneio.totais.total}`)
console.log(`Arquivos em ${destino}`)
