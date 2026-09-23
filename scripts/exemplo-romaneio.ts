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
 * Gera um romaneio de exemplo e a tabela em branco, sem banco e sem login,
 * para validar o layout com quem vai usar. Uso:
 *
 *   pnpm exemplo:romaneio [pasta-de-saida]
 *
 * Cliente, CNPJ da empresa e vendedor são fictícios; o catálogo é o real.
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
  '500': 144,
}

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
      caixaMaster: p.caixaMaster,
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

await mkdir(destino, { recursive: true })

for (const doc of [romaneio, modelo]) {
  const [pdf, xlsx] = await Promise.all([gerarPdf(doc), gerarXlsx(doc)])
  await writeFile(path.join(destino, nomeDoArquivo(doc, 'pdf')), pdf)
  await writeFile(path.join(destino, nomeDoArquivo(doc, 'xlsx')), xlsx)
  console.log(`${nomeDoArquivo(doc, 'pdf')}  ${nomeDoArquivo(doc, 'xlsx')}`)
}

console.log(`Total do romaneio de exemplo: R$ ${romaneio.totais.total}`)
console.log(`Arquivos em ${destino}`)
