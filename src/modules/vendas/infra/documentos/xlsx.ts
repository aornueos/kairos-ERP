import ExcelJS from 'exceljs'
import {
  data,
  dimensoesCm,
  mascararDocumento,
  mascararTelefone,
} from '@/shared/i18n/formato'
import type { DocumentoRomaneio } from '../../application/documento'
import {
  carregarLogo,
  clarear,
  codigoDeBarras,
  escurecer,
  linhasDaEmpresa,
  marcaEmTexto,
  miniaturasDoDocumento,
  tituloDoDocumento,
  tituloDoGrupo,
} from './comum'

/**
 * Romaneio em Excel: a versão melhorada da planilha que o comercial já usava.
 *
 * Mantém a estrutura e as colunas da original e acrescenta o que ela não tinha:
 * fórmulas que recalculam quando o cliente muda a quantidade ou o desconto,
 * campos de preenchimento destacados em azul e liberados, o resto protegido
 * contra edição acidental (sem senha), validação de quantidade, caixa box e
 * caixa master com contagem e alerta de embalagem aberta, preço negociado pelo
 * vendedor, miniatura do produto, valor total no topo, dados do fornecedor e
 * impressão pronta em A4 paisagem.
 *
 * Cada fórmula leva também o resultado calculado: pré-visualização de e-mail e
 * de WhatsApp não recalcula, e mostraria zero sem isso.
 */

const AZUL = 'FF1F4FD8'
const TEXTO = 'FF262626'
const TEXTO_SUAVE = 'FF595959'
const BORDA = 'FFBFBFBF'
const BORDA_FORTE = 'FF404040'
const FAIXA = 'FFEDEDED'
const TOTAL_FUNDO = 'FFD9D9D9'
const ALERTA_FUNDO = 'FFFCE4C8'
const ALERTA_TEXTO = 'FF9C4A00'
const MANUAL_TEXTO = 'FF6B2FA3'
const MANUAL_FUNDO = 'FFEFE5F8'

const MOEDA = '"R$" #,##0.00'
// "Geral" mostra 12 e 0,5 sem vírgula sobrando; a fórmula já arredonda a 2 casas.
const CONTAGEM = 'General;-General;"–"'
const PERCENTUAL = '0.00%'

const argb = (hex: string) => `FF${hex.replace('#', '').toUpperCase()}`

/**
 * Colunas da tabela, na ordem da planilha original com box e contagens
 * acrescentados. Q é auxiliar (valor bruto) e fica oculta.
 */
const C = {
  codigo: 'A',
  ean: 'B',
  cst: 'C',
  ncm: 'D',
  dun: 'E',
  cest: 'F',
  dimensoes: 'G',
  produto: 'H',
  preco: 'I',
  precoAplicado: 'J',
  caixaBox: 'K',
  caixaMaster: 'L',
  quantidade: 'M',
  boxes: 'N',
  caixas: 'O',
  total: 'P',
  bruto: 'Q',
} as const

type Chave = keyof typeof C

const COLUNAS: Array<{
  chave: Chave
  titulo: string
  largura: number
  destacada?: boolean
}> = [
  { chave: 'codigo', titulo: 'CÓD.', largura: 7 },
  { chave: 'ean', titulo: 'EAN', largura: 15.5, destacada: true },
  { chave: 'cst', titulo: 'CST/CSOSN', largura: 10.5 },
  { chave: 'ncm', titulo: 'NCM', largura: 10.5, destacada: true },
  { chave: 'dun', titulo: 'DUN-14', largura: 16.5 },
  { chave: 'cest', titulo: 'CEST', largura: 9.5, destacada: true },
  { chave: 'dimensoes', titulo: 'C x L x A (cm)', largura: 13.5 },
  { chave: 'produto', titulo: '', largura: 42, destacada: true },
  { chave: 'preco', titulo: 'Preço', largura: 10.5 },
  { chave: 'precoAplicado', titulo: 'Preço c/ desc.', largura: 12.5 },
  { chave: 'caixaBox', titulo: 'Caixa box', largura: 8.5 },
  { chave: 'caixaMaster', titulo: 'Caixa master', largura: 9 },
  { chave: 'quantidade', titulo: 'Quant.', largura: 10 },
  { chave: 'boxes', titulo: 'Box', largura: 8 },
  { chave: 'caixas', titulo: 'Cx master', largura: 9 },
  { chave: 'total', titulo: 'Total', largura: 17 },
  { chave: 'bruto', titulo: 'Bruto', largura: 12 },
]

const ULTIMA = C.total
const CELULA_DESCONTO = `$${C.boxes}$12`

type Estilo = Partial<
  Pick<ExcelJS.Style, 'font' | 'alignment' | 'numFmt' | 'fill' | 'border'>
>

function preencher(hex: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: hex } }
}

function aplicar(celula: ExcelJS.Cell, estilo: Estilo) {
  Object.assign(celula, estilo)
}

/** Campo que o cliente preenche: azul, destravado. */
function liberar(celula: ExcelJS.Cell) {
  celula.protection = { locked: false }
}

function letrasEntre(inicio: string, fim: string): string[] {
  const a = inicio.charCodeAt(0)
  const b = fim.charCodeAt(0)
  return Array.from({ length: b - a + 1 }, (_, i) => String.fromCharCode(a + i))
}

/** Texto no rodapé de impressão: & é caractere de controle e precisa dobrar. */
const rodape = (texto: string) => texto.replace(/&/g, '&&')

interface Contexto {
  wb: ExcelJS.Workbook
  ws: ExcelJS.Worksheet
  doc: DocumentoRomaneio
  /** Id da imagem no arquivo, por código de produto. */
  imagens: Map<string, number>
}

export async function gerarXlsx(doc: DocumentoRomaneio): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = doc.empresa.nomeFantasia ?? doc.empresa.razaoSocial
  wb.created = doc.geradoEm
  wb.title = tituloDoDocumento(doc)

  const ws = wb.addWorksheet(
    doc.tipo === 'MODELO' ? 'Tabela de pedido' : `Romaneio ${doc.numero}`,
    { views: [{ showGridLines: false }], properties: { defaultRowHeight: 16 } },
  )

  ws.columns = COLUNAS.map((c) => ({
    width: c.largura,
    hidden: c.chave === 'bruto',
    style: { font: { name: 'Calibri', size: 10, color: { argb: TEXTO } } },
  }))

  const ctx: Contexto = { wb, ws, doc, imagens: await registrarMiniaturas(wb, doc) }

  await cabecalho(ctx)
  blocoCliente(ctx)
  blocoCondicoes(ctx)
  const { primeira, ultima } = tabela(ctx)
  const linhaTotal = rodapeDoPedido(ctx, primeira, ultima)
  totalNoTopo(ctx, linhaTotal)

  ws.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    printArea: `A1:${ULTIMA}${linhaTotal + 3}`,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.5, header: 0.2, footer: 0.25 },
  }
  ws.headerFooter = {
    oddFooter: `&L&8${rodape(tituloDoDocumento(doc))}&C&8${rodape(doc.empresa.razaoSocial)}&R&8Página &P de &N`,
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

async function cabecalho({ wb, ws, doc }: Contexto) {
  ws.getRow(1).height = 30
  ws.getRow(2).height = 18
  ws.getRow(3).height = 34

  const titulo =
    doc.tipo === 'MODELO'
      ? 'TABELA DE PEDIDO'
      : `ROMANEIO Nº ${doc.numero}${doc.cancelado ? '  —  CANCELADO' : ''}`

  ws.mergeCells('A1:G1')
  const celulaTitulo = ws.getCell('A1')
  celulaTitulo.value = titulo
  aplicar(celulaTitulo, {
    font: {
      name: 'Calibri',
      size: 18,
      bold: true,
      color: { argb: doc.cancelado ? 'FFC00000' : TEXTO },
    },
    alignment: { vertical: 'middle' },
  })

  ws.mergeCells('A2:G2')
  ws.getCell('A2').value =
    doc.tipo === 'MODELO'
      ? `Preços vigentes em ${data(doc.emitidoEm)}`
      : [
          `Emitido em ${data(doc.emitidoEm)}`,
          doc.vendedor ? `Vendedor: ${doc.vendedor}` : null,
        ]
          .filter(Boolean)
          .join('   ·   ')
  aplicar(ws.getCell('A2'), {
    font: { name: 'Calibri', size: 10, color: { argb: TEXTO_SUAVE } },
  })

  if (doc.numero) {
    const barras = await codigoDeBarras(doc.numero)
    const id = wb.addImage({
      buffer: barras as unknown as ExcelJS.Buffer,
      extension: 'png',
    })
    ws.addImage(id, { tl: { col: 0.1, row: 2.15 }, ext: { width: 190, height: 32 } })
  }

  const logo = await carregarLogo()
  if (logo) {
    const id = wb.addImage({
      buffer: logo as unknown as ExcelJS.Buffer,
      extension: 'png',
    })
    ws.addImage(id, { tl: { col: 13, row: 0.2 }, ext: { width: 210, height: 50 } })
  } else {
    ws.mergeCells(`${C.quantidade}1:${ULTIMA}2`)
    const marca = ws.getCell(`${C.quantidade}1`)
    marca.value = marcaEmTexto(doc)
    aplicar(marca, {
      font: { name: 'Arial Black', size: 28, bold: true, color: { argb: 'FF000000' } },
      alignment: { horizontal: 'right', vertical: 'middle' },
    })
  }
}

/** Valor total no topo, apontando para o total do rodapé: um número só, dois lugares. */
function totalNoTopo({ ws, doc }: Contexto, linhaTotal: number) {
  ws.mergeCells(`${C.caixaMaster}3:${C.boxes}3`)
  const rotulo = ws.getCell(`${C.caixaMaster}3`)
  rotulo.value = 'VALOR TOTAL DO PEDIDO'

  ws.mergeCells(`${C.caixas}3:${ULTIMA}3`)
  const valor = ws.getCell(`${C.caixas}3`)
  valor.value = { formula: `${C.total}${linhaTotal}`, result: Number(doc.totais.total) }

  for (const col of letrasEntre(C.caixaMaster, ULTIMA)) {
    const celula = ws.getCell(`${col}3`)
    celula.fill = preencher(TOTAL_FUNDO)
    celula.border = {
      top: { style: 'medium', color: { argb: BORDA_FORTE } },
      bottom: { style: 'medium', color: { argb: BORDA_FORTE } },
    }
  }
  aplicar(rotulo, {
    font: { name: 'Calibri', size: 11, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })
  aplicar(valor, {
    numFmt: MOEDA,
    font: { name: 'Calibri', size: 18, bold: true, color: { argb: AZUL } },
    alignment: { horizontal: 'right', vertical: 'middle' },
  })
}

function blocoCliente({ ws, doc }: Contexto) {
  ws.getCell('A5').value = 'INFORMAÇÕES DO CLIENTE'
  aplicar(ws.getCell('A5'), { font: { name: 'Calibri', size: 11, bold: true } })

  ws.mergeCells(`I5:${ULTIMA}5`)
  ws.getCell('I5').value = 'FORNECEDOR'
  aplicar(ws.getCell('I5'), { font: { name: 'Calibri', size: 11, bold: true } })

  const c = doc.cliente
  const campos: Array<[string, string | null]> = [
    ['R. SOCIAL:', c?.razaoSocial ?? null],
    ['CNPJ/CPF:', c?.documento ? mascararDocumento(c.documento) : null],
    ['TEL.:', c?.telefone ? mascararTelefone(c.telefone) : null],
    ['EMAIL:', c?.email ?? null],
    ['END.:', c?.endereco ?? null],
  ]

  campos.forEach(([rotulo, valor], i) => {
    const linha = 6 + i
    ws.getRow(linha).height = 17
    ws.mergeCells(`A${linha}:B${linha}`)
    ws.mergeCells(`C${linha}:G${linha}`)

    const r = ws.getCell(`A${linha}`)
    r.value = rotulo
    aplicar(r, { font: { name: 'Calibri', size: 10, bold: true } })

    const v = ws.getCell(`C${linha}`)
    v.value = valor ?? 'PREENCHA AQUI'
    aplicar(v, {
      font: { name: 'Calibri', size: 10, color: { argb: AZUL }, bold: Boolean(valor) },
      alignment: { vertical: 'middle' },
    })
    liberar(v)

    for (const col of letrasEntre('A', 'G')) {
      ws.getCell(`${col}${linha}`).border = {
        bottom: { style: 'thin', color: { argb: BORDA } },
      }
    }
  })

  linhasDaEmpresa(doc).forEach((texto, i) => {
    const linha = 6 + i
    ws.mergeCells(`I${linha}:${ULTIMA}${linha}`)
    const celula = ws.getCell(`I${linha}`)
    celula.value = texto
    aplicar(celula, {
      font: {
        name: 'Calibri',
        size: i === 0 ? 10 : 9,
        bold: i === 0,
        color: { argb: i === 0 ? TEXTO : TEXTO_SUAVE },
      },
    })
  })
}

function blocoCondicoes({ ws, doc }: Contexto) {
  ws.getRow(12).height = 20
  ws.mergeCells('A12:B12')
  ws.getCell('A12').value = 'Condições de pagamento:'
  aplicar(ws.getCell('A12'), {
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { vertical: 'middle' },
  })

  ws.mergeCells(`C12:${C.caixaBox}12`)
  const condicoes = ws.getCell('C12')
  condicoes.value = doc.condicoesPagamento ?? 'PREENCHA AQUI'
  aplicar(condicoes, {
    font: {
      name: 'Calibri',
      size: 10,
      color: { argb: AZUL },
      bold: Boolean(doc.condicoesPagamento),
    },
    alignment: { vertical: 'middle' },
  })
  liberar(condicoes)

  ws.mergeCells(`${C.caixaMaster}12:${C.quantidade}12`)
  ws.getCell(`${C.caixaMaster}12`).value = 'Desconto'
  aplicar(ws.getCell(`${C.caixaMaster}12`), {
    font: { name: 'Calibri', size: 11, bold: true },
    alignment: { horizontal: 'right', vertical: 'middle' },
  })

  ws.mergeCells(`${C.boxes}12:${ULTIMA}12`)
  const desconto = ws.getCell(`${C.boxes}12`)
  desconto.value = Number(doc.descontoPercentual) / 100
  aplicar(desconto, {
    numFmt: PERCENTUAL,
    font: { name: 'Calibri', size: 13, bold: true, color: { argb: AZUL } },
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

  for (const col of letrasEntre('A', ULTIMA)) {
    ws.getCell(`${col}12`).border = {
      bottom: { style: 'medium', color: { argb: BORDA_FORTE } },
    }
  }

  ws.getRow(13).height = 30
  ws.mergeCells('A13:B13')
  ws.getCell('A13').value = 'Observações:'
  aplicar(ws.getCell('A13'), {
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { vertical: 'top' },
  })
  ws.mergeCells(`C13:${ULTIMA}13`)
  const obs = ws.getCell('C13')
  obs.value = doc.observacoes ?? ''
  aplicar(obs, {
    font: { name: 'Calibri', size: 10, color: { argb: AZUL } },
    alignment: { vertical: 'top', wrapText: true },
  })
  liberar(obs)

  ws.getRow(15).height = 22
  ws.mergeCells(`A15:${ULTIMA}15`)
  const faixa = ws.getCell('A15')
  faixa.value = doc.tipo === 'MODELO' ? 'TABELA DE PEDIDO' : 'ITENS DO PEDIDO'
  aplicar(faixa, {
    font: { name: 'Calibri', size: 11, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: preencher(FAIXA),
    border: {
      top: { style: 'medium', color: { argb: BORDA_FORTE } },
      bottom: { style: 'medium', color: { argb: BORDA_FORTE } },
    },
  })
}

function tabela({ ws, doc, imagens }: Contexto) {
  let linha = 17
  const primeira = linha
  const visiveis = COLUNAS.filter((c) => c.chave !== 'bruto')

  for (const grupo of doc.grupos) {
    const base = grupo.cor
    const cabecalho = ws.getRow(linha)
    cabecalho.height = 26

    for (const coluna of visiveis) {
      const celula = ws.getCell(`${C[coluna.chave]}${linha}`)
      celula.value = coluna.chave === 'produto' ? tituloDoGrupo(grupo) : coluna.titulo
      aplicar(celula, {
        font: {
          name: 'Calibri',
          size: coluna.chave === 'produto' ? 11 : 9,
          bold: true,
          color: { argb: coluna.chave === 'quantidade' ? AZUL : TEXTO },
        },
        alignment: {
          horizontal:
            coluna.chave === 'produto' || coluna.chave === 'codigo' ? 'left' : 'center',
          vertical: 'middle',
          wrapText: true,
        },
        fill: preencher(argb(coluna.destacada ? escurecer(base, 0.06) : base)),
        border: { bottom: { style: 'medium', color: { argb: BORDA_FORTE } } },
      })
    }
    linha++

    const inicioGrupo = linha
    grupo.itens.forEach((item, indice) => {
      const r = linha
      const zebra = indice % 2 === 1
      const ref = (chave: Chave) => `${C[chave]}${r}`

      const valores: Record<Chave, ExcelJS.CellValue> = {
        codigo: item.codigo,
        ean: item.ean ?? '',
        cst: item.cstCsosn,
        ncm: item.ncm,
        dun: item.dun14 ?? '',
        cest: item.cest ?? '',
        dimensoes: dimensoesCm(item.comprimentoCm, item.larguraCm, item.alturaCm),
        produto: item.nome,
        preco: Number(item.preco),
        // Preço manual é valor fixo: mudar o desconto no Excel não o altera,
        // exatamente como no sistema.
        precoAplicado: item.precoManualAplicado
          ? Number(item.precoAplicado)
          : {
              formula: `ROUND(${ref('preco')}*(1-${CELULA_DESCONTO}),2)`,
              result: Number(item.precoAplicado),
            },
        caixaBox: item.caixaBox,
        caixaMaster: item.caixaMaster,
        quantidade: item.quantidade > 0 ? item.quantidade : null,
        boxes: {
          formula: `IF(${ref('caixaBox')}>0,ROUND(${ref('quantidade')}/${ref('caixaBox')},2),"")`,
          result: item.boxes == null ? '' : Number(item.boxes),
        },
        caixas: {
          formula: `IF(${ref('caixaMaster')}>0,ROUND(${ref('quantidade')}/${ref('caixaMaster')},2),0)`,
          result: Number(item.caixas),
        },
        total: {
          formula: `${ref('quantidade')}*${ref('precoAplicado')}`,
          result: Number(item.total),
        },
        bruto: {
          formula: `${ref('quantidade')}*${ref('preco')}`,
          result: Number(item.bruto),
        },
      }

      ws.getRow(r).height = 20
      for (const coluna of COLUNAS) {
        const celula = ws.getCell(ref(coluna.chave))
        celula.value = valores[coluna.chave]
        const fundo = zebra ? (coluna.destacada ? base : clarear(base, 0.45)) : null
        const moeda = ['preco', 'precoAplicado', 'total', 'bruto'].includes(coluna.chave)
        const numero = ['boxes', 'caixas'].includes(coluna.chave)

        aplicar(celula, {
          font: {
            name: 'Calibri',
            size: 10,
            bold: coluna.chave === 'quantidade' || coluna.chave === 'total',
            color: { argb: coluna.chave === 'quantidade' ? AZUL : TEXTO },
          },
          alignment: {
            horizontal:
              coluna.chave === 'produto' || coluna.chave === 'codigo'
                ? 'left'
                : moeda
                  ? 'right'
                  : 'center',
            vertical: 'middle',
            // Recuo abre espaço para a miniatura do produto.
            indent: coluna.chave === 'produto' ? 3 : undefined,
          },
          numFmt: moeda ? MOEDA : numero ? CONTAGEM : undefined,
          fill: fundo && coluna.chave !== 'bruto' ? preencher(argb(fundo)) : undefined,
          border: { bottom: { style: 'hair', color: { argb: BORDA } } },
        })
      }

      if (item.precoManualAplicado) {
        const celula = ws.getCell(ref('precoAplicado'))
        celula.font = {
          name: 'Calibri',
          size: 10,
          bold: true,
          color: { argb: MANUAL_TEXTO },
        }
        celula.fill = preencher(MANUAL_FUNDO)
        celula.note =
          'Preço negociado pelo vendedor: não segue o desconto geral do pedido.'
      }

      const idImagem = imagens.get(item.codigo)
      if (idImagem != null) {
        // Coluna H é a oitava (índice 7); a fração desloca alguns pixels da borda.
        ws.addImage(idImagem, {
          tl: { col: 7.012, row: r - 1 + 0.1 },
          ext: { width: 20, height: 20 },
          editAs: 'oneCell',
        })
      }

      const quantidade = ws.getCell(ref('quantidade'))
      liberar(quantidade)
      quantidade.dataValidation = {
        type: 'whole',
        operator: 'between',
        allowBlank: true,
        formulae: [0, 1_000_000],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Quantidade inválida',
        error: 'Informe um número inteiro de unidades, sem vírgula.',
        showInputMessage: true,
        promptTitle: item.nome.slice(0, 32),
        prompt: item.caixaBox
          ? `Box com ${item.caixaBox} un. Caixa master com ${item.caixaMaster} un.`
          : `Caixa master com ${item.caixaMaster} unidades.`,
      }

      linha++
    })

    if (grupo.itens.length > 0) {
      const q = `${C.quantidade}${inicioGrupo}`
      const box = `${C.caixaBox}${inicioGrupo}`
      const master = `${C.caixaMaster}${inicioGrupo}`
      const estiloAlerta: Partial<ExcelJS.Style> = {
        fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: ALERTA_FUNDO } },
        font: { bold: true, color: { argb: ALERTA_TEXTO } },
      }
      // Box, quando o produto tem; caixa master, quando não. Mesma regra do sistema.
      ws.addConditionalFormatting({
        ref: `${C.boxes}${inicioGrupo}:${C.boxes}${linha - 1}`,
        rules: [
          {
            type: 'expression',
            priority: 1,
            formulae: [`AND(${q}>0,${box}>0,MOD(${q},${box})<>0)`],
            style: estiloAlerta,
          },
        ],
      })
      ws.addConditionalFormatting({
        ref: `${C.caixas}${inicioGrupo}:${C.caixas}${linha - 1}`,
        rules: [
          {
            type: 'expression',
            priority: 2,
            formulae: [`AND(${q}>0,NOT(${box}>0),MOD(${q},${master})<>0)`],
            style: estiloAlerta,
          },
        ],
      })
    }

    linha++ // respiro entre linhas de produto, como na original
  }

  return { primeira, ultima: linha - 2 }
}

function rodapeDoPedido({ ws, doc }: Contexto, primeira: number, ultima: number): number {
  const t = doc.totais
  const inicio = ultima + 2
  const faixa = (chave: Chave) => `${C[chave]}${primeira}:${C[chave]}${ultima}`
  const linhaBruto = inicio + 4
  const linhaTotal = inicio + 6

  const linhas: Array<{
    rotulo: string
    formula: string
    resultado: number
    formato?: string
  }> = [
    {
      rotulo: 'Itens pedidos',
      formula: `COUNTIF(${faixa('quantidade')},">0")`,
      resultado: t.itensComQuantidade,
      formato: '0',
    },
    {
      rotulo: 'Unidades',
      formula: `SUM(${faixa('quantidade')})`,
      resultado: t.unidades,
      formato: '#,##0',
    },
    {
      rotulo: 'Boxes',
      formula: `SUM(${faixa('boxes')})`,
      resultado: Number(t.boxes),
      formato: 'General',
    },
    {
      rotulo: 'Caixas master',
      formula: `SUM(${faixa('caixas')})`,
      resultado: Number(t.caixas),
      formato: 'General',
    },
    {
      rotulo: 'Valor bruto',
      formula: `SUM(${faixa('bruto')})`,
      resultado: Number(t.bruto),
    },
    {
      rotulo: 'Desconto',
      formula: `${C.total}${linhaBruto}-${C.total}${linhaTotal}`,
      resultado: Number(t.desconto),
    },
  ]

  linhas.forEach((l, i) => {
    const r = inicio + i
    ws.getRow(r).height = 17
    ws.mergeCells(`${C.quantidade}${r}:${C.caixas}${r}`)
    const rotulo = ws.getCell(`${C.quantidade}${r}`)
    rotulo.value = l.rotulo
    aplicar(rotulo, {
      font: { name: 'Calibri', size: 10, color: { argb: TEXTO_SUAVE } },
      alignment: { horizontal: 'right', vertical: 'middle' },
    })
    const valor = ws.getCell(`${C.total}${r}`)
    valor.value = { formula: l.formula, result: l.resultado }
    aplicar(valor, {
      numFmt: l.formato ?? MOEDA,
      font: { name: 'Calibri', size: 10 },
      alignment: { horizontal: 'right', vertical: 'middle' },
    })
  })

  ws.getRow(linhaTotal).height = 30
  ws.mergeCells(`${C.quantidade}${linhaTotal}:${C.caixas}${linhaTotal}`)
  const rotuloTotal = ws.getCell(`${C.quantidade}${linhaTotal}`)
  rotuloTotal.value = 'VALOR TOTAL DO PEDIDO'
  const valorTotal = ws.getCell(`${C.total}${linhaTotal}`)
  valorTotal.value = { formula: `SUM(${faixa('total')})`, result: Number(t.total) }

  for (const col of letrasEntre(C.quantidade, C.total)) {
    const celula = ws.getCell(`${col}${linhaTotal}`)
    celula.fill = preencher(TOTAL_FUNDO)
    celula.border = {
      top: { style: 'medium', color: { argb: BORDA_FORTE } },
      bottom: { style: 'medium', color: { argb: BORDA_FORTE } },
    }
  }
  aplicar(rotuloTotal, {
    font: { name: 'Calibri', size: 11, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })
  aplicar(valorTotal, {
    numFmt: MOEDA,
    font: { name: 'Calibri', size: 14, bold: true, color: { argb: AZUL } },
    alignment: { horizontal: 'right', vertical: 'middle' },
  })

  // Lado esquerdo: legenda e aceite.
  const legenda = [
    'Campos em azul são preenchidos pelo cliente; o restante é calculado.',
    'Box ou caixa master destacados em laranja indicam quantidade que não fecha a embalagem.',
    'Preço c/ desc. em roxo foi negociado pelo vendedor e não segue o desconto geral.',
  ]
  legenda.forEach((texto, i) => {
    const r = inicio + i
    ws.mergeCells(`A${r}:H${r}`)
    const celula = ws.getCell(`A${r}`)
    celula.value = texto
    aplicar(celula, {
      font: { name: 'Calibri', size: 9, italic: true, color: { argb: TEXTO_SUAVE } },
    })
  })

  // Assinaturas abaixo dos totais, separadas pela coluna F vazia. A linha de
  // cima fica alta para caber a assinatura à mão.
  const aceite = linhaTotal + 3
  ws.getRow(aceite - 1).height = 30
  const assinatura = (colunas: string[], texto: string) => {
    ws.mergeCells(`${colunas[0]}${aceite}:${colunas.at(-1)}${aceite}`)
    const celula = ws.getCell(`${colunas[0]}${aceite}`)
    celula.value = texto
    aplicar(celula, {
      font: { name: 'Calibri', size: 9, color: { argb: TEXTO_SUAVE } },
      alignment: { vertical: 'top' },
    })
    for (const col of colunas) {
      ws.getCell(`${col}${aceite}`).border = {
        top: { style: 'thin', color: { argb: BORDA_FORTE } },
      }
    }
  }
  assinatura(letrasEntre('A', 'E'), 'Aceite do cliente')
  assinatura(['G', 'H'], 'Data')

  return linhaTotal
}
