import ExcelJS from 'exceljs'
import sharp from 'sharp'
import {
  dataHora,
  dimensoesCm,
  FUSO,
  mascararDocumento,
  mascararTelefone,
  percentual,
  quantidade,
} from '@/shared/i18n/formato'
import type { DocumentoRomaneio, ItemDocumento } from '../../application/documento'
import { precoComDesconto } from '../../domain/calculo-romaneio'
import {
  carregarLogo,
  clarear,
  codigoDeBarras,
  COLUNAS,
  COR,
  escurecer,
  linhasDaEmpresa,
  marcaEmTexto,
  miniaturasDoDocumento,
  tituloDoDocumento,
  tituloDoGrupo,
  type ChaveColuna,
} from './comum'

/**
 * Romaneio em Excel: o mesmo documento do PDF, editável.
 *
 * Layout, cores, colunas e tipografia são os do PDF, em escala (ver ESCALA).
 * O que a planilha acrescenta: fórmulas que recalculam quando a quantidade ou
 * o desconto mudam, campos de preenchimento liberados e o resto protegido
 * contra edição acidental (sem senha), validação de entrada, alertas de
 * embalagem aberta e de preço negociado que reagem à edição, e impressão em
 * A4 paisagem com as quebras de página do PDF.
 *
 * Diferença deliberada: o PDF de um romaneio mostra só os itens pedidos; a
 * planilha mostra o catálogo inteiro, para incluir item sem gerar outro arquivo.
 *
 * Romaneio sem número é o preenchido à mão, fora do sistema: as linhas de
 * produto saem vazias e liberadas, assim como número, emissão e vendedor, e
 * não há código de barras (ele identificaria um número que ainda não existe).
 *
 * Cada fórmula leva também o resultado calculado: pré-visualização de e-mail e
 * de WhatsApp não recalcula, e mostraria zero sem isso.
 */

/**
 * Cada ponto do PDF vira 4/3 de ponto na planilha: a letra de 7,5 pt do PDF
 * vira os 10 pt de costume do Excel. Impressa ajustada à largura do A4, a
 * planilha volta a 75% e sai do tamanho do PDF.
 */
const ESCALA = 4 / 3
const PX_POR_PT = 96 / 72
/** Largura do dígito da fonte padrão da pasta (Calibri 11): a unidade da largura de coluna. */
const PX_POR_UNIDADE_DE_COLUNA = 7
const EMU_POR_PX = 9525
const EMU_POR_PT = 12700

/** Tamanho de fonte ou altura de linha a partir da medida do PDF, com meio ponto de precisão. */
const pt = (pdf: number) => Math.round(pdf * ESCALA * 2) / 2
const pxDaColuna = (larguraPdf: number) => Math.round(larguraPdf * ESCALA * PX_POR_PT)

/** Página do PDF, em pontos: A4 paisagem e as margens do documento. */
const PAGINA = {
  altura: 595.28,
  margemLateral: 24,
  margemTopo: 20,
  margemBase: 36,
  rodape: 16,
}
/** A escala de impressão é arredondada pelo Excel; a folga evita grupo cortado no pé da página. */
const FOLGA_DE_PAGINA = 0.97

/** O Helvetica do PDF. Arial tem as mesmas medidas e existe em qualquer Excel. */
const FONTE = 'Arial'

const FORMATO = {
  moeda: '"R$" #,##0.00',
  moedaOuVazio: '"R$" #,##0.00;-"R$" #,##0.00;;@',
  moedaNegociada: '"R$" #,##0.00" †"',
  contagem: 'General;-General;;@',
  contagemComAlerta: 'General" *";-General" *";;@',
  inteiro: '#,##0',
  desconto: '"– R$ "#,##0.00;"+ R$ "#,##0.00;"– R$ "0.00;@',
  percentual: '0.00%',
  percentualOuVazio: '0.00%;-0.00%;;@',
  numero: '"Nº "000000',
  emissao: '"Emitido em "dd/mm/yyyy',
  vigencia: '"Preços vigentes em "dd/mm/yyyy',
  vendedor: '"Vendedor: "@',
}

const letra = (indice: number) => String.fromCharCode(65 + indice)

/** Coluna da planilha por chave: A a P, na ordem do PDF. */
const C = Object.fromEntries(COLUNAS.map((c, i) => [c.chave, letra(i)])) as Record<
  ChaveColuna,
  string
>
/** Colunas auxiliares, ocultas: marca de linha de item, valor bruto, preço negociado e embalagem aberta. */
const AUX = {
  item: letra(COLUNAS.length),
  bruto: letra(COLUNAS.length + 1),
  manual: letra(COLUNAS.length + 2),
  aberta: letra(COLUNAS.length + 3),
}
const ULTIMA = C.total

/** Linhas fixas do topo; a tabela começa depois delas. */
const LINHA = {
  cliente: 8,
  condicoes: 14,
  observacoes: 15,
  faixaItens: 18,
  tabela: 20,
}
const CELULA_DESCONTO = `$${C.quantidade}$${LINHA.observacoes}`

const argb = (hex: string) => `FF${hex.replace('#', '').toUpperCase()}`
const cor = (hex: string): Partial<ExcelJS.Color> => ({ argb: argb(hex) })
const preencher = (hex: string): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: cor(hex),
})
const traco = (style: ExcelJS.BorderStyle, hex: string): Partial<ExcelJS.Border> => ({
  style,
  color: cor(hex),
})
const FINO = traco('thin', COR.borda)
const FORTE = traco('medium', COR.forte)
const ASSINATURA = traco('thin', COR.forte)

function fonte(
  tamanhoPdf: number,
  extra: Partial<ExcelJS.Font> = {},
): Partial<ExcelJS.Font> {
  return { name: FONTE, size: pt(tamanhoPdf), color: cor(COR.texto), ...extra }
}

type Estilo = Partial<
  Pick<ExcelJS.Style, 'font' | 'alignment' | 'numFmt' | 'fill' | 'border'>
>

function escrever(celula: ExcelJS.Cell, valor: ExcelJS.CellValue, estilo: Estilo = {}) {
  celula.value = valor
  Object.assign(celula, estilo)
}

/** Campo de preenchimento: fica destravado na planilha protegida. */
function liberar(celula: ExcelJS.Cell) {
  celula.protection = { locked: false }
}

function letrasEntre(inicio: string, fim: string): string[] {
  const a = inicio.charCodeAt(0)
  const b = fim.charCodeAt(0)
  return Array.from({ length: b - a + 1 }, (_, i) => String.fromCharCode(a + i))
}

/** Mescla as colunas na linha (quando são mais de uma) e devolve a célula principal. */
function mesclar(
  ws: ExcelJS.Worksheet,
  de: string,
  ate: string,
  linha: number,
  ateLinha = linha,
) {
  if (de !== ate || linha !== ateLinha) ws.mergeCells(`${de}${linha}:${ate}${ateLinha}`)
  return ws.getCell(`${de}${linha}`)
}

function somarBorda(celula: ExcelJS.Cell, borda: Partial<ExcelJS.Borders>) {
  celula.border = { ...celula.border, ...borda }
}

/** Contorno de um retângulo de células, sem apagar as bordas internas. */
function contornar(
  ws: ExcelJS.Worksheet,
  de: string,
  ate: string,
  linhaDe: number,
  linhaAte: number,
  borda: Partial<ExcelJS.Border>,
) {
  for (const col of letrasEntre(de, ate)) {
    somarBorda(ws.getCell(`${col}${linhaDe}`), { top: borda })
    somarBorda(ws.getCell(`${col}${linhaAte}`), { bottom: borda })
  }
  for (let linha = linhaDe; linha <= linhaAte; linha++) {
    somarBorda(ws.getCell(`${de}${linha}`), { left: borda })
    somarBorda(ws.getCell(`${ate}${linha}`), { right: borda })
  }
}

function alturas(ws: ExcelJS.Worksheet, valores: Record<number, number>) {
  for (const [linha, altura] of Object.entries(valores)) {
    ws.getRow(Number(linha)).height = altura
  }
}

/**
 * Âncora de imagem em pixels a partir da esquerda da planilha e em pontos a
 * partir do topo da linha. O exceljs converte frações de coluna com uma
 * largura estimada que desloca a imagem; a âncora nativa, em EMU, ele grava
 * sem conversão. A tipagem do exceljs só declara a forma fracionária.
 */
function ancora(xPx: number, linha: number, yPt: number): { col: number; row: number } {
  let coluna = 0
  let resto = xPx
  while (coluna < COLUNAS.length - 1) {
    const largura = pxDaColuna(COLUNAS[coluna]?.largura ?? 0)
    if (resto < largura) break
    resto -= largura
    coluna++
  }
  const nativa = {
    nativeCol: coluna,
    nativeColOff: Math.round(resto * EMU_POR_PX),
    nativeRow: linha - 1,
    nativeRowOff: Math.round(yPt * EMU_POR_PT),
  }
  return nativa as unknown as { col: number; row: number }
}

const inicioDaColuna = (chave: ChaveColuna) => {
  const indice = COLUNAS.findIndex((c) => c.chave === chave)
  return COLUNAS.slice(0, indice).reduce((soma, c) => soma + pxDaColuna(c.largura), 0)
}
const LARGURA_DA_PLANILHA_PX = COLUNAS.reduce(
  (soma, c) => soma + pxDaColuna(c.largura),
  0,
)

/** Data do calendário de São Paulo, como data do Excel (que não tem fuso). */
function dataDoExcel(instante: Date): Date {
  const dia = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante)
  return new Date(`${dia}T00:00:00Z`)
}

/** Texto no rodapé de impressão: & é caractere de controle e precisa dobrar. */
const rodape = (texto: string) => texto.replace(/&/g, '&&')

interface Contexto {
  wb: ExcelJS.Workbook
  ws: ExcelJS.Worksheet
  doc: DocumentoRomaneio
  /** Romaneio sem número: preenchido à mão, fora do sistema. */
  aMao: boolean
  /** Id da imagem no arquivo, por código de produto. */
  miniaturas: Map<string, number>
}

interface Tabela {
  primeira: number
  ultima: number
  /** Próxima linha livre depois da tabela. */
  fim: number
  grupos: Array<{ inicio: number; fim: number }>
}

export async function gerarXlsx(doc: DocumentoRomaneio): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = doc.empresa.nomeFantasia ?? doc.empresa.razaoSocial
  wb.created = doc.geradoEm
  wb.title = tituloDoDocumento(doc)

  const aMao = doc.tipo === 'ROMANEIO' && doc.numero == null
  const ws = wb.addWorksheet(
    doc.tipo === 'MODELO'
      ? 'Tabela de pedido'
      : doc.numero
        ? `Romaneio ${doc.numero}`
        : 'Romaneio',
    { views: [{ showGridLines: false }], properties: { defaultRowHeight: pt(12) } },
  )

  ws.columns = [
    ...COLUNAS.map((c) => ({
      width: pxDaColuna(c.largura) / PX_POR_UNIDADE_DE_COLUNA,
      style: { font: fonte(7.5) },
    })),
    ...Object.values(AUX).map(() => ({ width: 10, hidden: true })),
  ]

  // Romaneio à mão não tem produto na linha, logo não tem miniatura.
  const miniaturas = aMao ? new Map<string, number>() : await registrarMiniaturas(wb, doc)
  const ctx: Contexto = { wb, ws, doc, aMao, miniaturas }

  await cabecalho(ctx)
  blocoCliente(ctx)
  blocoCondicoes(ctx)
  faixaDeItens(ctx)
  const tabela = tabelaDeItens(ctx)
  const { total, ultimaLinha } = resumo(ctx, tabela)
  totalNoTopo(ctx, tabela, total)
  quebrarPaginas(ws, tabela, ultimaLinha)

  ws.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    printArea: `A1:${ULTIMA}${ultimaLinha}`,
    margins: {
      left: PAGINA.margemLateral / 72,
      right: PAGINA.margemLateral / 72,
      top: PAGINA.margemTopo / 72,
      bottom: PAGINA.margemBase / 72,
      header: 0,
      footer: PAGINA.rodape / 72,
    },
  }

  const esquerda = [tituloDoDocumento(doc), doc.cliente?.razaoSocial]
    .filter(Boolean)
    .join('  ·  ')
  const centro = aMao ? '' : `Gerado em ${dataHora(doc.geradoEm)}`
  const estiloRodape = `&"${FONTE}"&9&K${argb(COR.suave).slice(2)}`
  ws.headerFooter = {
    oddFooter:
      `&L${estiloRodape}${rodape(esquerda)}` +
      `&C${estiloRodape}${rodape(centro)}` +
      `&R${estiloRodape}Página &P de &N`,
  }

  // Sem senha: evita apagar fórmula sem querer, mas não impede quem precisa ajustar.
  await ws.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatColumns: true,
    formatRows: true,
  })

  return Buffer.from(await wb.xlsx.writeBuffer())
}

async function registrarMiniaturas(
  wb: ExcelJS.Workbook,
  doc: DocumentoRomaneio,
): Promise<Map<string, number>> {
  // Uma imagem por produto, mesmo quando duas são iguais: o exceljs embaralha as
  // referências quando o mesmo id é ancorado em várias células (miniaturas saíam
  // trocadas, e até o código de barras aparecia no lugar de produto). Cada
  // miniatura tem poucos KB; a repetição não pesa.
  const miniaturas = await miniaturasDoDocumento(doc)
  const ids = new Map<string, number>()
  for (const [codigo, imagem] of miniaturas) {
    ids.set(
      codigo,
      wb.addImage({ buffer: imagem as unknown as ExcelJS.Buffer, extension: 'png' }),
    )
  }
  return ids
}

// ---------------------------------------------------------------- cabeçalho

/**
 * Três blocos, como no PDF: marca e fornecedor à esquerda, valor total em
 * destaque no centro, tipo, número, código de barras e emissão à direita.
 */
async function cabecalho({ wb, ws, doc, aMao }: Contexto) {
  alturas(ws, { 1: 26, 2: 34, 3: 16, 4: 16, 5: 14, 6: 14, 7: 10 })

  const logo = await carregarLogo()
  if (logo) {
    const { width = 1, height = 1 } = await sharp(logo).metadata()
    const alto = pt(38) * PX_POR_PT
    ws.addImage(
      wb.addImage({ buffer: logo as unknown as ExcelJS.Buffer, extension: 'png' }),
      {
        tl: ancora(0, 1, 4),
        ext: { width: (alto * width) / height, height: alto },
        editAs: 'oneCell',
      },
    )
  } else {
    escrever(mesclar(ws, 'A', C.dimensoes, 1, 2), marcaEmTexto(doc), {
      font: fonte(28, { bold: true }),
      alignment: { vertical: 'bottom' },
    })
  }

  const [nome, ...detalhes] = linhasDaEmpresa(doc)
  escrever(ws.getCell('A3'), nome ?? '', {
    font: fonte(8.5, { bold: true }),
    alignment: { vertical: 'bottom' },
  })
  detalhes.forEach((texto, i) => {
    escrever(ws.getCell(`A${4 + i}`), texto, {
      font: fonte(7.5, { color: cor(COR.suave) }),
      alignment: { vertical: 'middle' },
    })
  })

  // Destaque do total; o valor e o detalhe entram depois, apontando para o resumo.
  const [deTotal, ateTotal] = [C.preco, C.caixaMaster]
  for (let linha = 1; linha <= 4; linha++) {
    const celula = mesclar(ws, deTotal, ateTotal, linha)
    for (const col of letrasEntre(deTotal, ateTotal)) {
      ws.getCell(`${col}${linha}`).fill = preencher(COR.totalFundo)
    }
    if (linha === 1) {
      escrever(celula, 'VALOR TOTAL DO PEDIDO', {
        font: fonte(8, { bold: true }),
        alignment: { horizontal: 'right', vertical: 'bottom', indent: 1 },
      })
    }
  }
  // Só as bordas de cima e de baixo, como no PDF.
  for (const col of letrasEntre(deTotal, ateTotal)) {
    somarBorda(ws.getCell(`${col}1`), { top: FORTE })
    somarBorda(ws.getCell(`${col}4`), { bottom: FORTE })
  }

  // Bloco do documento, à direita da caixa do total. Mesclado porque data e
  // número não transbordam para a célula vizinha como texto.
  const bloco = (linha: number) => mesclar(ws, C.quantidade, ULTIMA, linha)
  escrever(bloco(1), doc.tipo === 'MODELO' ? 'TABELA DE PEDIDO' : 'ROMANEIO', {
    font: fonte(15, { bold: true }),
    alignment: { horizontal: 'right', vertical: 'bottom' },
  })

  const direita = (vertical: 'top' | 'middle' = 'middle') => ({
    horizontal: 'right' as const,
    vertical,
  })

  let linha = 2
  if (doc.tipo === 'ROMANEIO') {
    const numero = bloco(2)
    escrever(numero, doc.numero ? Number(doc.numero) : 'Nº ______', {
      numFmt: FORMATO.numero,
      font: fonte(12, { bold: true }),
      alignment: direita('top'),
    })
    if (aMao) {
      liberar(numero)
      numero.dataValidation = {
        type: 'whole',
        operator: 'greaterThan',
        formulae: [0],
        showErrorMessage: true,
        errorTitle: 'Número inválido',
        error: 'Informe o número do romaneio, só com algarismos.',
      }
    }
    linha = 3

    if (doc.numero) {
      const barras = await codigoDeBarras(doc.numero)
      // 135 x 24 pt: o bloco do documento aqui é mais estreito que o do PDF.
      const largura = 135 * ESCALA * PX_POR_PT
      const altura = 24 * ESCALA * PX_POR_PT
      ws.addImage(
        wb.addImage({ buffer: barras as unknown as ExcelJS.Buffer, extension: 'png' }),
        {
          tl: ancora(LARGURA_DA_PLANILHA_PX - largura - 2, 2, 20),
          ext: { width: largura, height: altura },
          editAs: 'oneCell',
        },
      )
      linha = 5
    }
  }

  const emissao = bloco(linha)
  escrever(emissao, aMao ? 'Emitido em __/__/____' : dataDoExcel(doc.emitidoEm), {
    numFmt: doc.tipo === 'MODELO' ? FORMATO.vigencia : FORMATO.emissao,
    font: fonte(7.5, { color: cor(COR.suave) }),
    alignment: direita(linha === 2 ? 'top' : 'middle'),
  })
  if (aMao) {
    liberar(emissao)
    emissao.dataValidation = {
      type: 'date',
      operator: 'greaterThan',
      formulae: [new Date(Date.UTC(2000, 0, 1))],
      showErrorMessage: true,
      errorTitle: 'Data inválida',
      error: 'Informe a data de emissão no formato dd/mm/aaaa.',
    }
  }
  linha++

  if (doc.tipo === 'ROMANEIO' && (doc.vendedor || aMao)) {
    const vendedor = bloco(linha)
    escrever(vendedor, doc.vendedor ?? '______', {
      numFmt: FORMATO.vendedor,
      font: fonte(7.5, { color: cor(COR.suave) }),
      alignment: direita(),
    })
    if (aMao) liberar(vendedor)
  }

  if (doc.cancelado) {
    ws.getRow(7).height = pt(17)
    const carimbo = mesclar(ws, C.caixas, ULTIMA, 7)
    escrever(carimbo, 'CANCELADO', {
      font: fonte(11, { bold: true, color: cor(COR.perigo) }),
      alignment: { horizontal: 'center', vertical: 'middle' },
    })
    contornar(ws, C.caixas, ULTIMA, 7, 7, traco('medium', COR.perigo))
  }
}

/** Valor total e detalhe no topo, apontando para o resumo: um número só, dois lugares. */
function totalNoTopo({ ws, doc }: Contexto, tabela: Tabela, total: string) {
  const t = doc.totais
  const faixa = (col: string) => `${col}${tabela.primeira}:${col}${tabela.ultima}`
  const unidades = `SUM(${faixa(C.quantidade)})`
  const boxes = `ROUND(SUM(${faixa(C.boxes)}),2)`
  const caixas = `ROUND(SUM(${faixa(C.caixas)}),2)`
  const vazio = t.unidades === 0

  escrever(
    ws.getCell(`${C.preco}2`),
    { formula: `IF(${unidades}=0,"",${total})`, result: vazio ? '' : Number(t.total) },
    {
      numFmt: FORMATO.moedaOuVazio,
      font: fonte(22, { bold: true, color: cor(COR.azul) }),
      alignment: {
        horizontal: 'right',
        vertical: 'middle',
        indent: 1,
        shrinkToFit: true,
      },
    },
  )

  // FIXED e a conversão de número em texto usam a vírgula do Excel de quem abre.
  const detalhe = [
    `FIXED(${unidades},0)&" un"`,
    `IF(${boxes}>0,"  ·  "&${boxes}&" box","")`,
    `"  ·  "&${caixas}&" cx master"`,
  ].join('&')
  const resultado = [
    `${quantidade(t.unidades)} un`,
    Number(t.boxes) > 0 ? `${quantidade(t.boxes)} box` : null,
    `${quantidade(t.caixas)} cx master`,
  ]
    .filter(Boolean)
    .join('  ·  ')

  escrever(
    ws.getCell(`${C.preco}3`),
    { formula: `IF(${unidades}=0,"",${detalhe})`, result: vazio ? '' : resultado },
    {
      font: fonte(7.5, { color: cor(COR.forte) }),
      alignment: { horizontal: 'right', vertical: 'top', indent: 1, shrinkToFit: true },
    },
  )
}

// ---------------------------------------------------------------- cliente e condições

const ROTULO = fonte(7.5, { bold: true, color: cor(COR.suave) })

function blocoCliente({ ws, doc }: Contexto) {
  const topo = LINHA.cliente
  alturas(ws, {
    [topo]: 20,
    [topo + 1]: 18,
    [topo + 2]: 18,
    [topo + 3]: 18,
    [topo + 4]: 7,
    [topo + 5]: 8,
  })

  escrever(ws.getCell(`A${topo}`), 'INFORMAÇÕES DO CLIENTE', {
    font: fonte(8, { bold: true }),
    alignment: { vertical: 'middle', indent: 1 },
  })

  const c = doc.cliente
  const campos: Array<{
    linha: number
    rotulo: string
    valor: string | null
    de: string
    ate: string
    direita?: boolean
  }> = [
    {
      linha: topo + 1,
      rotulo: 'R. SOCIAL',
      valor: c?.razaoSocial ?? null,
      de: C.cst,
      ate: ULTIMA,
    },
    {
      linha: topo + 2,
      rotulo: 'CNPJ/CPF',
      valor: c?.documento ? mascararDocumento(c.documento) : null,
      de: C.cst,
      ate: C.dimensoes,
    },
    {
      linha: topo + 2,
      rotulo: 'TEL.',
      valor: c?.telefone ? mascararTelefone(c.telefone) : null,
      de: C.preco,
      ate: ULTIMA,
      direita: true,
    },
    {
      linha: topo + 3,
      rotulo: 'EMAIL',
      valor: c?.email ?? null,
      de: C.cst,
      ate: C.dimensoes,
    },
    {
      linha: topo + 3,
      rotulo: 'END.',
      valor: c?.endereco ?? null,
      de: C.preco,
      ate: ULTIMA,
      direita: true,
    },
  ]

  for (const campo of campos) {
    // Rótulo da metade direita fica encostado no valor, na coluna do produto.
    const rotulo = campo.direita
      ? ws.getCell(`${C.produto}${campo.linha}`)
      : mesclar(ws, 'A', C.ean, campo.linha)
    escrever(rotulo, campo.rotulo, {
      font: ROTULO,
      alignment: campo.direita
        ? { horizontal: 'right', vertical: 'bottom', indent: 1 }
        : { vertical: 'bottom', indent: 1 },
    })

    const valor = mesclar(ws, campo.de, campo.ate, campo.linha)
    escrever(valor, campo.valor, {
      font: fonte(8.5),
      alignment: { vertical: 'bottom', shrinkToFit: true },
    })
    liberar(valor)
    for (const col of letrasEntre(campo.de, campo.ate)) {
      somarBorda(ws.getCell(`${col}${campo.linha}`), { bottom: FINO })
    }
  }

  contornar(ws, 'A', ULTIMA, topo, topo + 4, FINO)
}

function blocoCondicoes({ ws, doc }: Contexto) {
  const topo = LINHA.condicoes
  const obs = LINHA.observacoes
  // Observação longa quebra em mais linhas; cada linha da caixa comporta ~110 caracteres.
  const linhasDeObs = Math.max(1, Math.ceil((doc.observacoes?.length ?? 0) / 110))
  alturas(ws, { [topo]: 20, [obs]: 6 + linhasDeObs * 14, [obs + 1]: 7, [obs + 2]: 10 })

  const fimCondicoes = C.caixaBox
  const campos: Array<[number, string, string | null]> = [
    [topo, 'CONDIÇÕES DE PAGAMENTO', doc.condicoesPagamento],
    [obs, 'OBSERVAÇÕES', doc.observacoes],
  ]
  for (const [linha, rotulo, texto] of campos) {
    escrever(mesclar(ws, 'A', C.cst, linha), rotulo, {
      font: ROTULO,
      alignment: { vertical: linha === topo ? 'bottom' : 'top', indent: 1 },
    })
    const valor = mesclar(ws, C.ncm, fimCondicoes, linha)
    escrever(valor, texto, {
      font: fonte(8.5),
      alignment:
        linha === topo ? { vertical: 'bottom' } : { vertical: 'top', wrapText: true },
    })
    liberar(valor)
  }
  for (const col of letrasEntre(C.ncm, fimCondicoes)) {
    somarBorda(ws.getCell(`${col}${topo}`), { bottom: FINO })
  }
  contornar(ws, 'A', fimCondicoes, topo, obs + 1, FINO)

  // Desconto em caixa própria, separada pela coluna da caixa master.
  escrever(mesclar(ws, C.quantidade, ULTIMA, topo), 'DESCONTO', {
    font: ROTULO,
    alignment: { horizontal: 'center', vertical: 'bottom' },
  })
  const desconto = mesclar(ws, C.quantidade, ULTIMA, obs, obs + 1)
  const temDesconto = Number(doc.descontoPercentual) > 0
  escrever(desconto, Number(doc.descontoPercentual) / 100, {
    // Tabela em branco sem desconto fica em branco, como no PDF.
    numFmt:
      doc.tipo === 'MODELO' && !temDesconto
        ? FORMATO.percentualOuVazio
        : FORMATO.percentual,
    font: fonte(16, { bold: true, color: cor(COR.azul) }),
    alignment: { horizontal: 'center', vertical: 'middle' },
  })
  desconto.dataValidation = {
    type: 'decimal',
    operator: 'between',
    allowBlank: true,
    formulae: [0, 0.9999],
    showErrorMessage: true,
    errorTitle: 'Desconto inválido',
    error: 'Informe um percentual entre 0% e 99,99%.',
  }
  liberar(desconto)
  contornar(ws, C.quantidade, ULTIMA, topo, obs + 1, FINO)
}

function faixaDeItens({ ws, doc }: Contexto) {
  const linha = LINHA.faixaItens
  alturas(ws, { [linha]: pt(15), [linha + 1]: pt(6) })
  const faixa = mesclar(ws, 'A', ULTIMA, linha)
  escrever(faixa, doc.tipo === 'MODELO' ? 'TABELA DE PEDIDO' : 'ITENS DO PEDIDO', {
    font: fonte(9, { bold: true }),
    alignment: { horizontal: 'center', vertical: 'middle' },
  })
  for (const col of letrasEntre('A', ULTIMA)) {
    const celula = ws.getCell(`${col}${linha}`)
    celula.fill = preencher(COR.faixa)
    celula.border = { top: FORTE, bottom: FORTE }
  }
}

// ---------------------------------------------------------------- itens

/**
 * Títulos que o PDF quebra em duas linhas. A quebra vai explícita: a largura
 * do texto muda entre Excel, LibreOffice e visualizadores, e a quebra junto.
 */
const TITULO_EM_DUAS_LINHAS: Partial<Record<ChaveColuna, string>> = {
  precoAplicado: 'Preço c/\ndesc.',
  caixaBox: 'Caixa\nbox',
  caixaMaster: 'Caixa\nmaster',
  caixas: 'Cx\nmaster',
}

const ALTURA_ITEM = pt(18)
const LADO_MINIATURA_PX = Math.round(14 * ESCALA * PX_POR_PT)

/** Preço c/ desc. diferente do de tabela com desconto: foi negociado pelo vendedor. */
function negociadoNaPlanilha(item: ItemDocumento, descontoPercentual: string): boolean {
  return (
    item.precoManualAplicado &&
    !precoComDesconto(item.preco, descontoPercentual).eq(item.precoAplicado)
  )
}

function tabelaDeItens({ ws, doc, aMao, miniaturas }: Contexto): Tabela {
  let linha = LINHA.tabela
  const primeira = linha
  const grupos: Tabela['grupos'] = []

  for (const grupo of doc.grupos) {
    const inicio = linha
    const titulo = tituloDoGrupo(grupo)
    // Título comprido quebra em duas linhas na coluna do produto, como no PDF.
    ws.getRow(linha).height = titulo.length > 32 ? pt(26) : pt(18)

    for (const coluna of COLUNAS) {
      escrever(
        ws.getCell(`${C[coluna.chave]}${linha}`),
        coluna.chave === 'produto'
          ? titulo
          : (TITULO_EM_DUAS_LINHAS[coluna.chave] ?? coluna.titulo),
        {
          font: fonte(coluna.chave === 'produto' ? 8.5 : 6.5, {
            bold: true,
            color: cor(coluna.chave === 'quantidade' ? COR.azul : COR.texto),
          }),
          alignment: { horizontal: coluna.alinhar, vertical: 'middle', wrapText: true },
          fill: preencher(coluna.destacada ? escurecer(grupo.cor, 0.06) : grupo.cor),
          border: { bottom: FORTE },
        },
      )
    }
    // À mão, o vendedor pode renomear a faixa conforme o que for pedido.
    if (aMao) liberar(ws.getCell(`${C.produto}${linha}`))
    linha++

    grupo.itens.forEach((item, indice) => {
      itemDaTabela(ws, doc, item, linha, grupo.cor, indice % 2 === 1, aMao)
      const imagem = miniaturas.get(item.codigo)
      if (imagem != null) {
        ws.addImage(imagem, {
          tl: ancora(
            inicioDaColuna('produto') + 5,
            linha,
            (ALTURA_ITEM - LADO_MINIATURA_PX / PX_POR_PT) / 2,
          ),
          ext: { width: LADO_MINIATURA_PX, height: LADO_MINIATURA_PX },
          editAs: 'oneCell',
        })
      }
      linha++
    })

    ws.getRow(linha).height = pt(6) // respiro entre linhas de produto
    grupos.push({ inicio, fim: linha })
    linha++
  }

  const ultima = linha - 2
  alertas(ws, primeira, ultima)
  return { primeira, ultima, fim: linha, grupos }
}

/** Colunas de identificação: texto, para o Excel não converter EAN em notação científica. */
const COLUNAS_DE_TEXTO: ChaveColuna[] = [
  'codigo',
  'ean',
  'cst',
  'ncm',
  'dun',
  'cest',
  'dimensoes',
  'produto',
]

/**
 * Linha de item. No romaneio à mão ela sai vazia e liberada, para o vendedor
 * digitar só o que foi pedido; as fórmulas usam N() e ISNUMBER() para ficar em
 * branco, sem #VALOR!, enquanto a linha não é preenchida.
 */
function itemDaTabela(
  ws: ExcelJS.Worksheet,
  doc: DocumentoRomaneio,
  item: ItemDocumento,
  r: number,
  corDoGrupo: string,
  zebra: boolean,
  aMao: boolean,
) {
  const ref = (chave: ChaveColuna) => `${C[chave]}${r}`
  const [preco, aplicado, box, master, qtd] = [
    ref('preco'),
    ref('precoAplicado'),
    ref('caixaBox'),
    ref('caixaMaster'),
    ref('quantidade'),
  ]
  const comQuantidade = !aMao && item.quantidade > 0
  const negociado = !aMao && negociadoNaPlanilha(item, doc.descontoPercentual)
  const descontado = `ROUND(${preco}*(1-${CELULA_DESCONTO}),2)`

  const formulas = {
    precoAplicado: {
      formula: `IF(ISNUMBER(${preco}),${descontado},"")`,
      result: aMao ? '' : Number(item.precoAplicado),
    },
    boxes: {
      formula: `IF(N(${qtd})>0,IF(N(${box})>0,ROUND(${qtd}/${box},2),"–"),"")`,
      result: comQuantidade ? (item.boxes == null ? '–' : Number(item.boxes)) : '',
    },
    caixas: {
      formula: `IF(AND(N(${qtd})>0,N(${master})>0),ROUND(${qtd}/${master},2),"")`,
      result: comQuantidade ? Number(item.caixas) : '',
    },
    total: { formula: `N(${qtd})*N(${aplicado})`, result: aMao ? 0 : Number(item.total) },
  } satisfies Partial<Record<ChaveColuna, ExcelJS.CellFormulaValue>>

  const valores: Record<ChaveColuna, ExcelJS.CellValue> = aMao
    ? {
        codigo: null,
        ean: null,
        cst: null,
        ncm: null,
        dun: null,
        cest: null,
        dimensoes: null,
        produto: null,
        preco: null,
        caixaBox: null,
        caixaMaster: null,
        quantidade: null,
        ...formulas,
      }
    : {
        codigo: item.codigo,
        ean: item.ean ?? '',
        cst: item.cstCsosn,
        ncm: item.ncm,
        dun: item.dun14 ?? '',
        cest: item.cest ?? '',
        dimensoes: dimensoesCm(item.comprimentoCm, item.larguraCm, item.alturaCm),
        produto: item.nome,
        preco: Number(item.preco),
        caixaBox: item.caixaBox ?? '–',
        caixaMaster: item.caixaMaster,
        quantidade: comQuantidade ? item.quantidade : null,
        ...formulas,
        // Preço manual é valor fixo: mudar o desconto não o altera, como no sistema.
        precoAplicado: item.precoManualAplicado
          ? Number(item.precoAplicado)
          : formulas.precoAplicado,
      }

  ws.getRow(r).height = ALTURA_ITEM
  for (const coluna of COLUNAS) {
    const celula = ws.getCell(ref(coluna.chave))
    const moeda = coluna.chave === 'preco' || coluna.chave === 'precoAplicado'
    const destaque = coluna.chave === 'quantidade' || coluna.chave === 'total'
    const fundo = zebra
      ? coluna.destacada
        ? corDoGrupo
        : clarear(corDoGrupo, 0.45)
      : null

    escrever(celula, valores[coluna.chave], {
      font: fonte(coluna.chave === 'produto' ? 8 : 7.5, {
        bold: destaque,
        color: cor(coluna.chave === 'quantidade' ? COR.azul : COR.texto),
      }),
      alignment: {
        horizontal: coluna.alinhar,
        vertical: 'middle',
        // Recuo abre espaço para a miniatura, que só existe com produto.
        indent: coluna.chave === 'produto' && !aMao ? 4 : undefined,
      },
      numFmt: moeda
        ? FORMATO.moeda
        : coluna.chave === 'total'
          ? FORMATO.moedaOuVazio
          : coluna.chave === 'boxes' || coluna.chave === 'caixas'
            ? FORMATO.contagem
            : COLUNAS_DE_TEXTO.includes(coluna.chave)
              ? '@'
              : undefined,
      fill: fundo ? preencher(fundo) : undefined,
      border: { bottom: FINO },
    })
  }

  if (negociado) {
    // Estilo gravado além da regra condicional: aparece até em visualizador sem fórmula.
    Object.assign(ws.getCell(aplicado), {
      font: fonte(7.5, { bold: true, color: cor(COR.manual) }),
      fill: preencher(COR.manualFundo),
      numFmt: FORMATO.moedaNegociada,
    })
  }

  const auxiliares: Record<keyof typeof AUX, ExcelJS.CellValue> = {
    // Marca fixa de linha de item: as regras condicionais só valem nela.
    item: 1,
    bruto: { formula: `N(${qtd})*N(${preco})`, result: aMao ? 0 : Number(item.bruto) },
    manual: {
      formula:
        `IF(AND(N(${qtd})>0,ISNUMBER(${aplicado}),ISNUMBER(${preco})),` +
        `IF(${aplicado}<>${descontado},1,0),0)`,
      result: comQuantidade && negociado ? 1 : 0,
    },
    // Mesma regra do sistema: box quando o produto tem, caixa master quando não.
    aberta: {
      formula:
        `IF(N(${qtd})>0,IF(N(${box})>0,IF(MOD(${qtd},${box})<>0,1,0),` +
        `IF(N(${master})>0,IF(MOD(${qtd},${master})<>0,1,0),0)),0)`,
      result: comQuantidade && !item.embalagemFechada ? 1 : 0,
    },
  }
  for (const [chave, valor] of Object.entries(auxiliares)) {
    ws.getCell(`${AUX[chave as keyof typeof AUX]}${r}`).value = valor
  }

  const quantidadeCelula = ws.getCell(qtd)
  liberar(quantidadeCelula)
  quantidadeCelula.dataValidation = {
    type: 'whole',
    operator: 'between',
    allowBlank: true,
    formulae: [0, 1_000_000],
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Quantidade inválida',
    error: 'Informe um número inteiro de unidades, sem vírgula.',
    showInputMessage: !aMao,
    promptTitle: item.nome.slice(0, 32),
    prompt: item.caixaBox
      ? `Box com ${item.caixaBox} un. Caixa master com ${item.caixaMaster} un.`
      : `Caixa master com ${item.caixaMaster} unidades.`,
  }

  if (!aMao) return

  for (const chave of [
    ...COLUNAS_DE_TEXTO,
    'preco',
    'caixaBox',
    'caixaMaster',
  ] as const) {
    liberar(ws.getCell(ref(chave)))
  }
  for (const [chave, titulo] of [
    ['caixaBox', 'Caixa box'],
    ['caixaMaster', 'Caixa master'],
  ] as const) {
    ws.getCell(ref(chave)).dataValidation = {
      type: 'whole',
      operator: 'greaterThan',
      allowBlank: true,
      formulae: [0],
      showErrorMessage: true,
      errorTitle: `${titulo} inválida`,
      error: 'Informe quantas unidades vêm na embalagem, em número inteiro.',
    }
  }
  ws.getCell(preco).dataValidation = {
    type: 'decimal',
    operator: 'greaterThan',
    allowBlank: true,
    formulae: [0],
    showErrorMessage: true,
    errorTitle: 'Preço inválido',
    error: 'Informe o preço de tabela por unidade, maior que zero.',
  }

  const precoCelula = ws.getCell(aplicado)
  liberar(precoCelula)
  precoCelula.dataValidation = {
    type: 'decimal',
    operator: 'greaterThan',
    allowBlank: true,
    formulae: [0],
    showErrorMessage: true,
    errorTitle: 'Preço inválido',
    error: 'Informe o preço unitário negociado, maior que zero.',
    showInputMessage: true,
    promptTitle: 'Preço negociado',
    prompt:
      'Digite um valor para negociar este item: ele deixa de seguir o desconto geral.',
  }
}

/**
 * Regras que acompanham a edição: embalagem aberta em laranja com *, preço
 * negociado em roxo com † e quantidade vazia com a caixa azul de preencher.
 * Só valem nas linhas de item, marcadas na coluna auxiliar.
 */
function alertas(ws: ExcelJS.Worksheet, primeira: number, ultima: number) {
  const r = primeira
  const item = `$${AUX.item}${r}=1`
  const aberta = `$${AUX.aberta}${r}=1`
  const temBox = `N($${C.caixaBox}${r})>0`
  const faixa = (col: string) => `${col}${primeira}:${col}${ultima}`
  const estiloAlerta: Partial<ExcelJS.Style> = {
    fill: { type: 'pattern', pattern: 'solid', bgColor: cor(COR.alertaFundo) },
    font: { color: cor(COR.alertaTexto) },
    numFmt: FORMATO.contagemComAlerta,
  }
  const azul = traco('thin', COR.azul)

  ws.addConditionalFormatting({
    ref: faixa(C.boxes),
    rules: [
      {
        type: 'expression',
        priority: 1,
        formulae: [`AND(${aberta},${temBox})`],
        style: estiloAlerta,
      },
    ],
  })
  ws.addConditionalFormatting({
    ref: faixa(C.caixas),
    rules: [
      {
        type: 'expression',
        priority: 2,
        formulae: [`AND(${aberta},NOT(${temBox}))`],
        style: estiloAlerta,
      },
    ],
  })
  ws.addConditionalFormatting({
    ref: faixa(C.precoAplicado),
    rules: [
      {
        type: 'expression',
        priority: 3,
        formulae: [
          `AND(${item},ISNUMBER($${C.precoAplicado}${r}),` +
            `$${C.precoAplicado}${r}<>ROUND($${C.preco}${r}*(1-${CELULA_DESCONTO}),2))`,
        ],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: cor(COR.manualFundo) },
          font: { bold: true, color: cor(COR.manual) },
          numFmt: FORMATO.moedaNegociada,
        },
      },
    ],
  })
  ws.addConditionalFormatting({
    ref: faixa(C.quantidade),
    rules: [
      {
        type: 'expression',
        priority: 4,
        formulae: [`AND(${item},ISBLANK($${C.quantidade}${r}))`],
        style: { border: { top: azul, left: azul, bottom: azul, right: azul } },
      },
    ],
  })
}

// ---------------------------------------------------------------- resumo

const TEXTO = {
  negociado: '† Preço negociado pelo vendedor: não segue o desconto geral do pedido.',
  preencher:
    'Preencha a coluna Quant. com o número de unidades. As colunas Caixa box e ' +
    'Caixa master indicam quantas unidades vêm em cada embalagem.',
  preencherAMao:
    'Preencha uma linha por produto pedido: código, produto, preço, embalagens e ' +
    'quantidade. Preço c/ desc., caixas e totais são calculados.',
  precos: 'Preços em reais, por unidade. Valores sujeitos à confirmação no faturamento.',
}
const aberturas = (n: number) =>
  `* ${n === 1 ? '1 item não fecha' : `${n} itens não fecham`} ` +
  'embalagem inteira (box, quando o produto tem; caixa master, quando não).'

/** Faixa de totais, legenda e aceite, como no fim do PDF. */
function resumo(
  { ws, doc, aMao }: Contexto,
  tabela: Tabela,
): { total: string; ultimaLinha: number } {
  const t = doc.totais
  const vazio = t.unidades === 0
  const faixa = (col: string) => `${col}${tabela.primeira}:${col}${tabela.ultima}`
  const unidades = `SUM(${faixa(C.quantidade)})`
  const seHouver = (formula: string) => `IF(${unidades}=0,"",${formula})`
  const rotulos = tabela.fim
  const valores = rotulos + 1
  alturas(ws, { [rotulos]: pt(13), [valores]: pt(22), [valores + 1]: pt(6) })

  const bruto = `${C.produto}${valores}`
  const total = `${C.caixaMaster}${valores}`
  const indicadores: Array<{
    de: string
    ate: string
    rotulo: ExcelJS.CellValue
    formula: string
    resultado: number | string
    numFmt: string
  }> = [
    {
      de: 'A',
      ate: C.ean,
      rotulo: 'Itens pedidos',
      formula: seHouver(`COUNTIF(${faixa(C.quantidade)},">0")`),
      resultado: t.itensComQuantidade,
      numFmt: '0',
    },
    {
      de: C.cst,
      ate: C.ncm,
      rotulo: 'Unidades',
      formula: seHouver(unidades),
      resultado: t.unidades,
      numFmt: FORMATO.inteiro,
    },
    {
      de: C.dun,
      ate: C.dun,
      rotulo: 'Boxes',
      formula: seHouver(`ROUND(SUM(${faixa(C.boxes)}),2)`),
      resultado: Number(t.boxes),
      numFmt: 'General',
    },
    {
      de: C.cest,
      ate: C.dimensoes,
      rotulo: 'Caixas master',
      formula: seHouver(`ROUND(SUM(${faixa(C.caixas)}),2)`),
      resultado: Number(t.caixas),
      numFmt: 'General',
    },
    {
      de: C.produto,
      ate: C.produto,
      rotulo: 'Valor bruto',
      formula: seHouver(`SUM(${faixa(AUX.bruto)})`),
      resultado: Number(t.bruto),
      numFmt: FORMATO.moeda,
    },
    {
      de: C.preco,
      ate: C.caixaBox,
      rotulo: {
        formula: `IF(${unidades}=0,"Desconto","Desconto ("&FIXED(${CELULA_DESCONTO}*100,2)&"%)")`,
        result: vazio ? 'Desconto' : `Desconto (${percentual(doc.descontoPercentual)})`,
      },
      formula: seHouver(`${bruto}-${total}`),
      resultado: Number(t.desconto),
      numFmt: FORMATO.desconto,
    },
  ]

  for (const ind of indicadores) {
    escrever(mesclar(ws, ind.de, ind.ate, rotulos), ind.rotulo, {
      font: fonte(6.5, { color: cor(COR.suave) }),
      alignment: { vertical: 'bottom', indent: 1 },
    })
    escrever(
      mesclar(ws, ind.de, ind.ate, valores),
      { formula: ind.formula, result: vazio ? '' : ind.resultado },
      {
        numFmt: ind.numFmt,
        font: fonte(10, { bold: true }),
        alignment: {
          horizontal: 'left',
          vertical: 'middle',
          indent: 1,
          shrinkToFit: true,
        },
      },
    )
    for (const linha of [rotulos, valores]) {
      somarBorda(ws.getCell(`${ind.ate}${linha}`), { right: FINO })
    }
  }

  const rotuloTotal = mesclar(ws, C.caixaMaster, ULTIMA, rotulos)
  escrever(rotuloTotal, 'VALOR TOTAL DO PEDIDO', {
    font: fonte(7.5, { bold: true }),
    alignment: { horizontal: 'right', vertical: 'bottom', indent: 1 },
  })
  escrever(
    mesclar(ws, C.caixaMaster, ULTIMA, valores),
    { formula: seHouver(`SUM(${faixa(C.total)})`), result: vazio ? '' : Number(t.total) },
    {
      numFmt: FORMATO.moedaOuVazio,
      font: fonte(16, { bold: true, color: cor(COR.azul) }),
      alignment: {
        horizontal: 'right',
        vertical: 'middle',
        indent: 1,
        shrinkToFit: true,
      },
    },
  )
  for (const linha of [rotulos, valores]) {
    for (const col of letrasEntre(C.caixaMaster, ULTIMA)) {
      ws.getCell(`${col}${linha}`).fill = preencher(COR.totalFundo)
    }
  }
  for (const col of letrasEntre('A', ULTIMA)) {
    somarBorda(ws.getCell(`${col}${rotulos}`), { top: FORTE })
    somarBorda(ws.getCell(`${col}${valores}`), { bottom: FORTE })
  }

  const primeiraLegenda = valores + 2
  legenda(ws, doc, aMao, tabela, primeiraLegenda)
  const ultimaLinha = primeiraLegenda + 2

  // Aceite na altura da última linha da legenda, à direita, como no PDF.
  const assinatura = (de: string, ate: string, texto: string) => {
    escrever(mesclar(ws, de, ate, ultimaLinha), texto, {
      font: fonte(7.5, { color: cor(COR.suave) }),
      alignment: { vertical: 'top' },
    })
    for (const col of letrasEntre(de, ate)) {
      somarBorda(ws.getCell(`${col}${ultimaLinha}`), { top: ASSINATURA })
    }
  }
  assinatura(C.preco, C.quantidade, 'Aceite do cliente')
  assinatura(C.caixas, ULTIMA, 'Data')

  return { total, ultimaLinha }
}

/**
 * Legenda que acompanha a edição, na ordem do PDF e sem linha vazia no meio:
 * preço negociado, embalagem aberta e a nota de preços; na tabela vazia, a
 * instrução de preenchimento no lugar das duas primeiras.
 */
function legenda(
  ws: ExcelJS.Worksheet,
  doc: DocumentoRomaneio,
  aMao: boolean,
  tabela: Tabela,
  inicio: number,
) {
  const faixa = (col: string) => `${col}${tabela.primeira}:${col}${tabela.ultima}`
  const u = `SUM(${faixa(C.quantidade)})`
  const m = `SUM(${faixa(AUX.manual)})`
  const a = `SUM(${faixa(AUX.aberta)})`
  const instrucao = aMao ? TEXTO.preencherAMao : TEXTO.preencher
  const texto = (valor: string) => `"${valor}"`
  const tAberta = `IF(${a}=1,"* 1 item não fecha","* "&${a}&" itens não fecham")&" embalagem inteira (box, quando o produto tem; caixa master, quando não)."`

  const formulas = [
    `IF(${u}=0,${texto(instrucao)},IF(${m}>0,${texto(TEXTO.negociado)},IF(${a}>0,${tAberta},${texto(TEXTO.precos)})))`,
    `IF(${u}=0,${texto(TEXTO.precos)},IF(${m}>0,IF(${a}>0,${tAberta},${texto(TEXTO.precos)}),IF(${a}>0,${texto(TEXTO.precos)},"")))`,
    `IF(AND(${u}>0,${m}>0,${a}>0),${texto(TEXTO.precos)},"")`,
  ]

  // Mesmas linhas calculadas aqui, para o resultado gravado junto da fórmula.
  const negociados = doc.grupos
    .flatMap((g) => g.itens)
    .filter(
      (i) => i.quantidade > 0 && negociadoNaPlanilha(i, doc.descontoPercentual),
    ).length
  const linhas =
    doc.totais.unidades === 0
      ? [instrucao, TEXTO.precos]
      : [
          negociados > 0 ? TEXTO.negociado : null,
          doc.totais.embalagensAbertas > 0
            ? aberturas(doc.totais.embalagensAbertas)
            : null,
          TEXTO.precos,
        ].filter((l): l is string => l != null)

  const corDaLinha = (texto: string) =>
    texto.startsWith('†')
      ? COR.manual
      : texto.startsWith('*')
        ? COR.alertaTexto
        : COR.suave

  formulas.forEach((formula, i) => {
    const linha = inicio + i
    ws.getRow(linha).height = pt(10)
    const resultado = linhas[i] ?? ''
    // Sem mesclar: o texto transborda para as células vazias ao lado.
    escrever(
      ws.getCell(`A${linha}`),
      { formula, result: resultado },
      {
        font: fonte(7, { color: cor(corDaLinha(resultado)) }),
        alignment: { vertical: 'middle' },
      },
    )
  })

  ws.addConditionalFormatting({
    ref: `A${inicio}:A${inicio + formulas.length - 1}`,
    rules: [
      {
        type: 'expression',
        priority: 10,
        formulae: [`LEFT(A${inicio},1)="†"`],
        style: { font: { color: cor(COR.manual) } },
      },
      {
        type: 'expression',
        priority: 11,
        formulae: [`LEFT(A${inicio},1)="*"`],
        style: { font: { color: cor(COR.alertaTexto) } },
      },
      {
        type: 'expression',
        priority: 12,
        formulae: [`LEN(A${inicio})>0`],
        style: { font: { color: cor(COR.suave) } },
      },
    ],
  })
}

// ---------------------------------------------------------------- impressão

/**
 * Quebras de página como as do PDF: grupo de produto nunca se divide, e o
 * último vai para a página do resumo junto com ele.
 */
function quebrarPaginas(ws: ExcelJS.Worksheet, tabela: Tabela, ultimaLinha: number) {
  const util =
    (PAGINA.altura - PAGINA.margemTopo - PAGINA.margemBase) * ESCALA * FOLGA_DE_PAGINA
  const altura = (de: number, ate: number) => {
    let soma = 0
    for (let linha = de; linha <= ate; linha++) soma += ws.getRow(linha).height ?? pt(12)
    return soma
  }

  const primeiro = tabela.grupos[0]
  if (!primeiro) return
  let usada = altura(1, primeiro.inicio - 1)
  tabela.grupos.forEach((grupo, i) => {
    const fim = i === tabela.grupos.length - 1 ? ultimaLinha : grupo.fim
    const necessaria = altura(grupo.inicio, fim)
    if (usada + necessaria > util) {
      ws.getRow(grupo.inicio - 1).addPageBreak()
      usada = 0
    }
    usada += necessaria
  })
}
