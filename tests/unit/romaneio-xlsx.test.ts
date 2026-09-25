import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  montarDocumento,
  type EntradaDocumento,
  type ItemEntrada,
} from '@/modules/vendas/application/documento'
import { gerarXlsx } from '@/modules/vendas/infra/documentos/xlsx'

/**
 * O Excel do romaneio é lido de volta: fórmulas, resultados gravados e campos
 * liberados precisam bater com o documento que gerou o PDF.
 */

function item(codigo: string, quantidade: number, extra: Partial<ItemEntrada> = {}) {
  return {
    codigo,
    nome: `Produto ${codigo}`,
    ean: null,
    dun14: null,
    ncm: '33051000',
    cest: null,
    cstCsosn: '101',
    comprimentoCm: null,
    larguraCm: null,
    alturaCm: null,
    preco: '6.50',
    precoManual: null,
    caixaMaster: 144,
    caixaBox: 12,
    quantidade,
    ...extra,
  }
}

function entrada(extra: Partial<EntradaDocumento> = {}): EntradaDocumento {
  return {
    tipo: 'ROMANEIO',
    numero: 7,
    cancelado: false,
    emitidoEm: new Date('2026-09-24T03:40:00Z'),
    vendedor: 'Vendedora',
    empresa: {
      razaoSocial: 'Pure.us Cosméticos Ltda',
      nomeFantasia: 'Pure.us',
      cnpj: '00000000000000',
      inscricaoEstadual: null,
      endereco: null,
      telefone: null,
      email: null,
    },
    cliente: {
      razaoSocial: 'Salão Teste',
      documento: null,
      telefone: null,
      email: null,
      endereco: null,
    },
    condicoesPagamento: '30 dias',
    descontoPercentual: '7.00',
    observacoes: null,
    grupos: [
      {
        nome: 'Renova',
        apelo: null,
        cor: '#F4CCE4',
        itens: [
          item('1', 144),
          item('2', 150),
          item('3', 288, { precoManual: '5.90' }),
          item('4', 0, { caixaBox: null }),
        ],
      },
    ],
    ...extra,
  }
}

async function planilha(dados: EntradaDocumento) {
  const doc = montarDocumento(dados, dados.emitidoEm)
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load((await gerarXlsx(doc)) as unknown as ExcelJS.Buffer)
  const ws = wb.worksheets[0]
  if (!ws) throw new Error('planilha sem aba')

  const linhaDo = (codigo: string) => {
    for (let r = 1; r <= ws.rowCount; r++) {
      if (ws.getCell(`A${r}`).value === codigo) return r
    }
    throw new Error(`produto ${codigo} não encontrado`)
  }
  const formula = (endereco: string) =>
    ws.getCell(endereco).value as ExcelJS.CellFormulaValue
  return { doc, ws, linhaDo, formula }
}

describe('romaneio em Excel', () => {
  it('grava o total do domínio no topo, apontando para a soma dos itens', async () => {
    const { doc, formula } = await planilha(entrada())
    const topo = formula('I2')
    expect(topo.formula).toMatch(/^IF\(SUM\(M\d+:M\d+\)=0,"",L\d+\)$/)
    expect(topo.result).toBe(Number(doc.totais.total))
    // 144 e 150 a 6,05 (6,50 com 7%); 288 a 5,90 negociado.
    expect(doc.totais.total).toBe('3477.90')
  })

  it('preço c/ desc. é fórmula do desconto, e o negociado é valor fixo', async () => {
    const { ws, linhaDo, formula } = await planilha(entrada())
    const comDesconto = formula(`J${linhaDo('1')}`)
    const r = linhaDo('1')
    expect(comDesconto.formula).toBe(`IF(ISNUMBER(I${r}),ROUND(I${r}*(1-$M$15),2),"")`)
    expect(comDesconto.result).toBe(6.05)

    const negociado = ws.getCell(`J${linhaDo('3')}`)
    expect(negociado.value).toBe(5.9)
    expect(negociado.numFmt).toContain('†')
  })

  it('marca embalagem aberta e preço negociado para a legenda', async () => {
    const { linhaDo, formula, ws } = await planilha(entrada())
    expect(formula(`T${linhaDo('2')}`).result).toBe(1) // 150 não fecha box de 12
    // O arquivo grava 0 e texto vazio; a leitura do exceljs devolve undefined para os dois.
    expect(formula(`T${linhaDo('1')}`).result ?? 0).toBe(0)
    expect(formula(`S${linhaDo('3')}`).result).toBe(1)
    expect(formula(`N${linhaDo('4')}`).result ?? '').toBe('') // sem quantidade

    const legendas: string[] = []
    for (let r = linhaDo('4') + 1; r <= ws.rowCount; r++) {
      const v = ws.getCell(`A${r}`).value
      if (v && typeof v === 'object' && 'formula' in v && typeof v.result === 'string') {
        legendas.push(v.result)
      }
    }
    expect(legendas[0]).toMatch(/^† Preço negociado/)
    expect(legendas[1]).toMatch(/^\* 1 item não fecha/)
    expect(legendas[2]).toMatch(/^Preços em reais/)
  })

  it('libera só os campos do cliente no romaneio emitido pelo sistema', async () => {
    const { ws, linhaDo } = await planilha(entrada())
    const r = linhaDo('1')
    expect(ws.getCell(`M${r}`).protection?.locked).toBe(false) // quantidade
    expect(ws.getCell('M15').protection?.locked).toBe(false) // desconto
    expect(ws.getCell('C9').protection?.locked).toBe(false) // razão social
    expect(ws.getCell(`J${r}`).protection?.locked).not.toBe(false) // preço
    expect(ws.getCell('M2').protection?.locked).not.toBe(false) // número
    expect(ws.getCell('M2').value).toBe(7)
    // Miniaturas dos 4 produtos e o código de barras do número.
    expect(ws.getImages()).toHaveLength(5)
  })

  it('romaneio sem número é preenchido à mão: número, emissão, vendedor e preço liberados', async () => {
    const { ws } = await planilha(
      entrada({ numero: null, vendedor: null, cliente: null }),
    )
    for (const endereco of ['M2', 'M3', 'M4']) {
      expect(ws.getCell(endereco).protection?.locked, endereco).toBe(false)
    }
    expect(ws.getCell('M2').value).toBe('Nº ______')
    expect(ws.name).toBe('Romaneio')
    expect(ws.headerFooter.oddFooter).not.toContain('null')
    // Sem número não há código de barras, e sem produto não há miniatura.
    expect(ws.getImages()).toHaveLength(0)
  })

  it('no romaneio à mão as linhas de produto saem vazias e liberadas', async () => {
    const { ws } = await planilha(
      entrada({ numero: null, vendedor: null, cliente: null }),
    )
    const tabela = 20
    const cabecalho = ws.getRow(tabela)
    expect(cabecalho.getCell('B').value).toBe('EAN')

    // Quatro produtos no catálogo da linha: quatro linhas em branco.
    for (let r = tabela + 1; r <= tabela + 4; r++) {
      for (const col of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M']) {
        const celula = ws.getCell(`${col}${r}`)
        expect(celula.value ?? null, `${col}${r}`).toBeNull()
        expect(celula.protection?.locked, `${col}${r}`).toBe(false)
      }
      // EAN como texto: o Excel não vira 7898649053791 em 7,89865E+12.
      expect(ws.getCell(`B${r}`).numFmt).toBe('@')
      // Fórmulas ficam em branco até a linha ser preenchida.
      const total = ws.getCell(`P${r}`).value as ExcelJS.CellFormulaValue
      expect(total.formula).toBe(`N(M${r})*N(J${r})`)
    }
  })
})
