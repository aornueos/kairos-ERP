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
  tituloDoDocumento,
  tituloDoGrupo,
} from './comum'

/**
 * Romaneio em Excel: a versão melhorada da planilha que o comercial já usava.
 *
 * Mantém a estrutura e as colunas da original e acrescenta o que ela não tinha:
 * fórmulas que recalculam quando o cliente muda a quantidade ou o desconto,
 * campos de preenchimento destacados em azul e liberados, o resto protegido
 * contra edição acidental (sem senha), validação de quantidade, contagem de
 * caixas master com alerta de caixa aberta, dados do fornecedor e impressão
 * pronta em A4 paisagem.
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

const MOEDA = '"R$" #,##0.00'
const CAIXAS = '#,##0.00;-#,##0.00;"–"'
const PERCENTUAL = '0.00%'

const argb = (hex: string) => `FF${hex.replace('#', '').toUpperCase()}`

/** Colunas na ordem da planilha original; O é auxiliar (valor bruto) e fica oculta. */
const COLUNAS = [
  { titulo: 'CÓD.', largura: 7 },
  { titulo: 'EAN', largura: 15.5 },
  { titulo: 'CST/CSOSN', largura: 10.5 },
  { titulo: 'NCM', largura: 10.5 },
  { titulo: 'DUN-14', largura: 16.5 },
  { titulo: 'CEST', largura: 9.5 },
  { titulo: 'C x L x A (cm)', largura: 13.5 },
  { titulo: '', largura: 40 },
  { titulo: 'Preço', largura: 10.5 },
  { titulo: 'Preço c/ desc.', largura: 12.5 },
  { titulo: 'Caixa master', largura: 9.5 },
  { titulo: 'Quant.', largura: 10 },
  { titulo: 'Caixas', largura: 9 },
  { titulo: 'Total', largura: 17 },
  { titulo: 'Bruto', largura: 12, oculta: true },
] as const

/** Colunas que, na original, têm tom mais forte na faixa zebrada. */
const COLUNAS_DESTACADAS = new Set([1, 3, 5, 7])

const CELULA_DESCONTO = '$M$12'

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

/** Texto no rodapé de impressão: & é caractere de controle e precisa dobrar. */
const rodape = (texto: string) => texto.replace(/&/g, '&&')

export async function gerarXlsx(doc: DocumentoRomaneio): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = doc.empresa.nomeFantasia ?? doc.empresa.razaoSocial
  wb.created = doc.geradoEm
  wb.title = tituloDoDocumento(doc)

  const ws = wb.addWorksheet(
    doc.tipo === 'MODELO' ? 'Tabela de pedido' : `Romaneio ${doc.numero}`,
    {
      views: [{ showGridLines: false }],
      properties: { defaultRowHeight: 16 },
    },
  )

  ws.columns = COLUNAS.map((c) => ({
    width: c.largura,
    hidden: 'oculta' in c ? c.oculta : false,
    style: { font: { name: 'Calibri', size: 10, color: { argb: TEXTO } } },
  }))

  await cabecalho(wb, ws, doc)
  blocoCliente(ws, doc)
  blocoCondicoes(ws, doc)
  const { primeira, ultima } = tabela(ws, doc)
  const fim = rodapeDoPedido(ws, doc, primeira, ultima)

  ws.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    printArea: `A1:N${fim}`,
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

async function cabecalho(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  doc: DocumentoRomaneio,
) {
  ws.getRow(1).height = 30
  ws.getRow(2).height = 18
  ws.getRow(3).height = 30

  const titulo =
    doc.tipo === 'MODELO'
      ? 'TABELA DE PEDIDO'
      : `ROMANEIO Nº ${doc.numero}${doc.cancelado ? '  —  CANCELADO' : ''}`

  ws.mergeCells('A1:G1')
  aplicar(ws.getCell('A1'), {
    font: {
      name: 'Calibri',
      size: 18,
      bold: true,
      color: { argb: doc.cancelado ? 'FFC00000' : TEXTO },
    },
    alignment: { vertical: 'middle' },
  })
  ws.getCell('A1').value = titulo

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
    ws.addImage(id, { tl: { col: 11, row: 0.2 }, ext: { width: 210, height: 60 } })
  } else {
    ws.mergeCells('K1:N3')
    ws.getCell('K1').value = marcaEmTexto(doc)
    aplicar(ws.getCell('K1'), {
      font: { name: 'Arial Black', size: 30, bold: true, color: { argb: 'FF000000' } },
      alignment: { horizontal: 'right', vertical: 'middle' },
    })
  }
}

function blocoCliente(ws: ExcelJS.Worksheet, doc: DocumentoRomaneio) {
  ws.getCell('A5').value = 'INFORMAÇÕES DO CLIENTE'
  aplicar(ws.getCell('A5'), { font: { name: 'Calibri', size: 11, bold: true } })

  ws.mergeCells('I5:N5')
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

    for (const col of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      ws.getCell(`${col}${linha}`).border = {
        bottom: { style: 'thin', color: { argb: BORDA } },
      }
    }
  })

  linhasDaEmpresa(doc).forEach((texto, i) => {
    const linha = 6 + i
    ws.mergeCells(`I${linha}:N${linha}`)
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

function blocoCondicoes(ws: ExcelJS.Worksheet, doc: DocumentoRomaneio) {
  ws.getRow(12).height = 20
  ws.mergeCells('A12:B12')
  ws.getCell('A12').value = 'Condições de pagamento:'
  aplicar(ws.getCell('A12'), {
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { vertical: 'middle' },
  })

  ws.mergeCells('C12:J12')
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

  ws.mergeCells('K12:L12')
  ws.getCell('K12').value = 'Desconto'
  aplicar(ws.getCell('K12'), {
    font: { name: 'Calibri', size: 11, bold: true },
    alignment: { horizontal: 'right', vertical: 'middle' },
  })

  ws.mergeCells('M12:N12')
  const desconto = ws.getCell('M12')
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

  for (const col of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
    ws.getCell(`${col}12`).border = {
      bottom: { style: 'medium', color: { argb: BORDA_FORTE } },
    }
  }
  for (const col of ['K', 'L', 'M', 'N']) {
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
  ws.mergeCells('C13:N13')
  const obs = ws.getCell('C13')
  obs.value = doc.observacoes ?? ''
  aplicar(obs, {
    font: { name: 'Calibri', size: 10, color: { argb: AZUL } },
    alignment: { vertical: 'top', wrapText: true },
  })
  liberar(obs)

  ws.getRow(15).height = 22
  ws.mergeCells('A15:N15')
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

function tabela(ws: ExcelJS.Worksheet, doc: DocumentoRomaneio) {
  let linha = 17
  const primeira = linha

  for (const grupo of doc.grupos) {
    const base = grupo.cor
    const cabecalho = ws.getRow(linha)
    cabecalho.height = 22

    COLUNAS.slice(0, 14).forEach((coluna, i) => {
      const celula = cabecalho.getCell(i + 1)
      celula.value = i === 7 ? tituloDoGrupo(grupo) : coluna.titulo
      aplicar(celula, {
        font: {
          name: 'Calibri',
          size: i === 7 ? 11 : 9,
          bold: true,
          color: { argb: i === 11 ? AZUL : TEXTO },
        },
        alignment: {
          horizontal: i === 7 || i === 0 ? 'left' : 'center',
          vertical: 'middle',
          wrapText: true,
        },
        fill: preencher(argb(COLUNAS_DESTACADAS.has(i) ? escurecer(base, 0.06) : base)),
        border: { bottom: { style: 'medium', color: { argb: BORDA_FORTE } } },
      })
    })
    linha++

    const inicioGrupo = linha
    grupo.itens.forEach((item, indice) => {
      const r = linha
      const zebra = indice % 2 === 1
      const valores: ExcelJS.CellValue[] = [
        item.codigo,
        item.ean ?? '',
        item.cstCsosn,
        item.ncm,
        item.dun14 ?? '',
        item.cest ?? '',
        dimensoesCm(item.comprimentoCm, item.larguraCm, item.alturaCm),
        item.nome,
        Number(item.preco),
        {
          formula: `ROUND(I${r}*(1-${CELULA_DESCONTO}),2)`,
          result: Number(item.precoComDesconto),
        },
        item.caixaMaster,
        item.quantidade > 0 ? item.quantidade : null,
        { formula: `IF(K${r}>0,L${r}/K${r},0)`, result: Number(item.caixas) },
        { formula: `L${r}*J${r}`, result: Number(item.total) },
        { formula: `L${r}*I${r}`, result: Number(item.bruto) },
      ]

      const row = ws.getRow(r)
      row.height = 17
      valores.forEach((valor, i) => {
        const celula = row.getCell(i + 1)
        celula.value = valor
        const fundo = zebra
          ? COLUNAS_DESTACADAS.has(i)
            ? base
            : clarear(base, 0.45)
          : null

        aplicar(celula, {
          font: {
            name: 'Calibri',
            size: 10,
            bold: i === 11,
            color: { argb: i === 11 ? AZUL : TEXTO },
          },
          alignment: {
            horizontal:
              i === 7 || i === 0
                ? 'left'
                : i >= 8 && i !== 10 && i !== 11
                  ? 'right'
                  : 'center',
            vertical: 'middle',
          },
          numFmt:
            i === 8 || i === 9 || i === 13 || i === 14
              ? MOEDA
              : i === 12
                ? CAIXAS
                : undefined,
          fill: fundo && i < 14 ? preencher(argb(fundo)) : undefined,
          border: { bottom: { style: 'hair', color: { argb: BORDA } } },
        })
      })

      const quantidade = row.getCell(12)
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
        prompt: `Caixa master com ${item.caixaMaster} unidades.`,
      }

      linha++
    })

    if (grupo.itens.length > 0) {
      ws.addConditionalFormatting({
        ref: `M${inicioGrupo}:M${linha - 1}`,
        rules: [
          {
            type: 'expression',
            priority: 1,
            formulae: [`AND(L${inicioGrupo}>0,MOD(L${inicioGrupo},K${inicioGrupo})<>0)`],
            style: {
              fill: {
                type: 'pattern',
                pattern: 'solid',
                bgColor: { argb: ALERTA_FUNDO },
              },
              font: { bold: true, color: { argb: ALERTA_TEXTO } },
            },
          },
        ],
      })
    }

    linha++ // respiro entre linhas, como na original
  }

  return { primeira, ultima: linha - 2 }
}

function rodapeDoPedido(
  ws: ExcelJS.Worksheet,
  doc: DocumentoRomaneio,
  primeira: number,
  ultima: number,
): number {
  const t = doc.totais
  const inicio = ultima + 2
  const faixa = (col: string) => `${col}${primeira}:${col}${ultima}`

  const linhas: Array<{
    rotulo: string
    formula: string
    resultado: number
    formato?: string
  }> = [
    {
      rotulo: 'Itens pedidos',
      formula: `COUNTIF(${faixa('L')},">0")`,
      resultado: t.itensComQuantidade,
      formato: '0',
    },
    {
      rotulo: 'Unidades',
      formula: `SUM(${faixa('L')})`,
      resultado: t.unidades,
      formato: '#,##0',
    },
    {
      rotulo: 'Caixas master',
      formula: `SUM(${faixa('M')})`,
      resultado: Number(t.caixas),
      formato: '#,##0.00',
    },
    { rotulo: 'Valor bruto', formula: `SUM(${faixa('O')})`, resultado: Number(t.bruto) },
    {
      rotulo: 'Desconto',
      formula: `N${inicio + 3}-N${inicio + 5}`,
      resultado: Number(t.desconto),
    },
  ]

  linhas.forEach((l, i) => {
    const r = inicio + i
    ws.getRow(r).height = 17
    ws.mergeCells(`K${r}:M${r}`)
    const rotulo = ws.getCell(`K${r}`)
    rotulo.value = l.rotulo
    aplicar(rotulo, {
      font: { name: 'Calibri', size: 10, color: { argb: TEXTO_SUAVE } },
      alignment: { horizontal: 'right', vertical: 'middle' },
    })
    const valor = ws.getCell(`N${r}`)
    valor.value = { formula: l.formula, result: l.resultado }
    aplicar(valor, {
      numFmt: l.formato ?? MOEDA,
      font: { name: 'Calibri', size: 10 },
      alignment: { horizontal: 'right', vertical: 'middle' },
    })
  })

  const r = inicio + linhas.length
  ws.getRow(r).height = 30
  ws.mergeCells(`K${r}:M${r}`)
  const rotuloTotal = ws.getCell(`K${r}`)
  rotuloTotal.value = 'VALOR TOTAL DO PEDIDO'
  const valorTotal = ws.getCell(`N${r}`)
  valorTotal.value = { formula: `SUM(${faixa('N')})`, result: Number(t.total) }

  for (const col of ['K', 'L', 'M', 'N']) {
    const celula = ws.getCell(`${col}${r}`)
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
    'Caixas destacadas em laranja indicam quantidade que não fecha a caixa master.',
  ]
  legenda.forEach((texto, i) => {
    const linhaLegenda = inicio + i
    ws.mergeCells(`A${linhaLegenda}:H${linhaLegenda}`)
    const celula = ws.getCell(`A${linhaLegenda}`)
    celula.value = texto
    aplicar(celula, {
      font: { name: 'Calibri', size: 9, italic: true, color: { argb: TEXTO_SUAVE } },
    })
  })

  // Duas linhas de assinatura separadas pela coluna F vazia.
  const aceite = inicio + 4
  ws.getRow(aceite - 1).height = 28
  const assinatura = (
    inicioCol: string,
    fimCol: string,
    colunas: string[],
    texto: string,
  ) => {
    ws.mergeCells(`${inicioCol}${aceite}:${fimCol}${aceite}`)
    const celula = ws.getCell(`${inicioCol}${aceite}`)
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
  assinatura('A', 'E', ['A', 'B', 'C', 'D', 'E'], 'Aceite do cliente')
  assinatura('G', 'H', ['G', 'H'], 'Data')

  return r
}
