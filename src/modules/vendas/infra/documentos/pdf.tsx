import {
  Document,
  Font,
  Image,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import {
  data,
  dataHora,
  dimensoesCm,
  mascararDocumento,
  mascararTelefone,
  moeda,
  percentual,
  quantidade,
} from '@/shared/i18n/formato'
import type {
  DocumentoRomaneio,
  GrupoDocumento,
  ItemDocumento,
} from '../../application/documento'
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
 * Romaneio em PDF, A4 paisagem.
 *
 * Mesmo conteúdo da planilha original, organizado para leitura e impressão:
 * cabeçalho com fornecedor e código de barras do número, cliente, condições,
 * uma faixa por linha de produto e o resumo do pedido com aceite.
 *
 * Romaneio com quantidades mostra só o que foi pedido. Romaneio sem quantidade
 * e tabela em branco mostram o catálogo inteiro, com a coluna de quantidade em
 * aberto para preencher à mão.
 */

const COR = {
  texto: '#262626',
  suave: '#666666',
  borda: '#BFBFBF',
  forte: '#404040',
  azul: '#1F4FD8',
  faixa: '#EDEDED',
  alertaFundo: '#FCE4C8',
  alertaTexto: '#9C4A00',
  perigo: '#C00000',
}

/** Larguras em pontos. A4 paisagem com margem de 24pt deixa 794pt úteis. */
const COLUNAS: Array<{
  titulo: string
  largura: number
  alinhar: 'left' | 'center' | 'right'
}> = [
  { titulo: 'CÓD.', largura: 28, alinhar: 'left' },
  { titulo: 'EAN', largura: 60, alinhar: 'center' },
  { titulo: 'CST/CSOSN', largura: 44, alinhar: 'center' },
  { titulo: 'NCM', largura: 42, alinhar: 'center' },
  { titulo: 'DUN-14', largura: 66, alinhar: 'center' },
  { titulo: 'CEST', largura: 36, alinhar: 'center' },
  { titulo: 'C x L x A (cm)', largura: 54, alinhar: 'center' },
  { titulo: '', largura: 0, alinhar: 'left' },
  { titulo: 'Preço', largura: 44, alinhar: 'right' },
  { titulo: 'Preço c/ desc.', largura: 50, alinhar: 'right' },
  { titulo: 'Caixa master', largura: 36, alinhar: 'center' },
  { titulo: 'Quant.', largura: 40, alinhar: 'center' },
  { titulo: 'Caixas', largura: 36, alinhar: 'center' },
  { titulo: 'Total', largura: 60, alinhar: 'right' },
]

const DESTACADAS = new Set([1, 3, 5, 7])

// Nome de produto e de linha nunca quebra no meio da palavra: "Cachead-os"
// num documento comercial parece erro de impressão.
Font.registerHyphenationCallback((palavra) => [palavra])

const s = StyleSheet.create({
  pagina: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: COR.texto,
  },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  marca: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 28,
    letterSpacing: -1,
    marginBottom: 2,
  },
  empresaLinha: { fontSize: 7.5, color: COR.suave, marginTop: 1.5 },
  empresaNome: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: COR.texto },
  documento: { alignItems: 'flex-end', width: 240 },
  titulo: { fontFamily: 'Helvetica-Bold', fontSize: 16, letterSpacing: 0.5 },
  numero: { fontFamily: 'Helvetica-Bold', fontSize: 12, marginTop: 2 },
  meta: { fontSize: 7.5, color: COR.suave, marginTop: 3 },
  carimbo: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: COR.perigo,
    color: COR.perigo,
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  caixa: {
    borderWidth: 0.75,
    borderColor: COR.borda,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  caixaTitulo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  campo: { width: '50%', flexDirection: 'row', marginBottom: 3, paddingRight: 8 },
  campoLargo: { width: '100%', flexDirection: 'row', marginBottom: 3 },
  rotulo: { fontFamily: 'Helvetica-Bold', width: 62, fontSize: 7.5, color: COR.suave },
  valor: {
    flex: 1,
    fontSize: 8.5,
    borderBottomWidth: 0.5,
    borderBottomColor: COR.borda,
    paddingBottom: 1.5,
    minHeight: 11,
  },
  condicoes: { flexDirection: 'row', marginBottom: 8 },
  faixa: {
    backgroundColor: COR.faixa,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COR.forte,
    paddingVertical: 3,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 6,
  },
  grupo: { marginBottom: 6 },
  linhaTabela: { flexDirection: 'row', alignItems: 'center', minHeight: 13 },
  celula: { paddingHorizontal: 3, paddingVertical: 2 },
  cabecalhoTabela: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
    borderBottomWidth: 1,
    borderBottomColor: COR.forte,
  },
  cabecalhoTexto: { fontFamily: 'Helvetica-Bold', fontSize: 6.5 },
  faixaTotais: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COR.forte,
    marginTop: 2,
  },
  indicador: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRightWidth: 0.5,
    borderRightColor: COR.borda,
  },
  indicadorRotulo: { fontSize: 6.5, color: COR.suave, marginBottom: 2 },
  indicadorValor: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  indicadorTotal: {
    width: 200,
    backgroundColor: '#D9D9D9',
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
  },
  totalFinalRotulo: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, marginBottom: 1 },
  totalFinalValor: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: COR.azul },
  fechamento: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  legenda: { fontSize: 7, color: COR.suave, marginBottom: 2 },
  assinaturas: { flexDirection: 'row', marginTop: 16 },
  assinatura: {
    borderTopWidth: 0.75,
    borderTopColor: COR.forte,
    paddingTop: 3,
    fontSize: 7.5,
    color: COR.suave,
  },
  rodape: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: COR.suave,
    borderTopWidth: 0.5,
    borderTopColor: COR.borda,
    paddingTop: 4,
  },
})

const LARGURA_UTIL = 794
const LARGURA_PRODUTO = LARGURA_UTIL - COLUNAS.reduce((soma, c) => soma + c.largura, 0)

const larguraDa = (i: number) => (i === 7 ? LARGURA_PRODUTO : COLUNAS[i]!.largura)

export async function gerarPdf(doc: DocumentoRomaneio): Promise<Buffer> {
  const [barras, logo] = await Promise.all([
    doc.numero ? codigoDeBarras(doc.numero) : Promise.resolve(null),
    carregarLogo(),
  ])
  return renderToBuffer(<RomaneioPdf doc={doc} barras={barras} logo={logo} />)
}

function gruposVisiveis(doc: DocumentoRomaneio): GrupoDocumento[] {
  const soPedidos = doc.tipo === 'ROMANEIO' && doc.totais.itensComQuantidade > 0
  if (!soPedidos) return doc.grupos
  return doc.grupos
    .map((g) => ({ ...g, itens: g.itens.filter((i) => i.quantidade > 0) }))
    .filter((g) => g.itens.length > 0)
}

function RomaneioPdf({
  doc,
  barras,
  logo,
}: {
  doc: DocumentoRomaneio
  barras: Buffer | null
  logo: Buffer | null
}) {
  const emBranco = doc.tipo === 'MODELO' || doc.totais.itensComQuantidade === 0
  const grupos = gruposVisiveis(doc)
  const ultimo = grupos.at(-1)

  return (
    <Document
      title={tituloDoDocumento(doc)}
      author={doc.empresa.razaoSocial}
      creator={doc.empresa.razaoSocial}
      producer={doc.empresa.razaoSocial}
      language="pt-BR"
    >
      <Page size="A4" orientation="landscape" style={s.pagina}>
        <Cabecalho doc={doc} barras={barras} logo={logo} />
        <Cliente doc={doc} />
        <Condicoes doc={doc} />

        <Text style={s.faixa}>
          {doc.tipo === 'MODELO' ? 'TABELA DE PEDIDO' : 'ITENS DO PEDIDO'}
        </Text>

        {grupos.slice(0, -1).map((grupo) => (
          <Grupo key={grupo.nome} grupo={grupo} emBranco={emBranco} />
        ))}

        {/* O último grupo acompanha o resumo: nunca sobra página só com totais. */}
        <View wrap={false}>
          {ultimo ? <Grupo grupo={ultimo} emBranco={emBranco} /> : null}
          <Resumo doc={doc} emBranco={emBranco} />
        </View>

        <View style={s.rodape} fixed>
          <Text>
            {tituloDoDocumento(doc)}
            {doc.cliente ? `  ·  ${doc.cliente.razaoSocial}` : ''}
          </Text>
          <Text>Gerado em {dataHora(doc.geradoEm)}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}

function Cabecalho({
  doc,
  barras,
  logo,
}: {
  doc: DocumentoRomaneio
  barras: Buffer | null
  logo: Buffer | null
}) {
  const [nome, ...detalhes] = linhasDaEmpresa(doc)

  return (
    <View style={s.cabecalho}>
      <View>
        {logo ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- Image do react-pdf não é <img>
          <Image
            src={{ data: logo, format: 'png' }}
            style={{ height: 38, marginBottom: 6 }}
          />
        ) : (
          <Text style={s.marca}>{marcaEmTexto(doc)}</Text>
        )}
        <Text style={s.empresaNome}>{nome}</Text>
        {detalhes.map((linha) => (
          <Text key={linha} style={s.empresaLinha}>
            {linha}
          </Text>
        ))}
      </View>

      <View style={s.documento}>
        <Text style={s.titulo}>
          {doc.tipo === 'MODELO' ? 'TABELA DE PEDIDO' : 'ROMANEIO'}
        </Text>
        {doc.numero ? <Text style={s.numero}>Nº {doc.numero}</Text> : null}
        {barras ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- Image do react-pdf não é <img>
          <Image
            src={{ data: barras, format: 'png' }}
            style={{ width: 150, height: 26, marginTop: 5 }}
          />
        ) : null}
        <Text style={s.meta}>
          {doc.tipo === 'MODELO'
            ? `Preços vigentes em ${data(doc.emitidoEm)}`
            : `Emitido em ${data(doc.emitidoEm)}`}
        </Text>
        {doc.vendedor ? <Text style={s.meta}>Vendedor: {doc.vendedor}</Text> : null}
        {doc.cancelado ? <Text style={s.carimbo}>CANCELADO</Text> : null}
      </View>
    </View>
  )
}

function Campo({
  rotulo,
  valor,
  largo,
}: {
  rotulo: string
  valor?: string | null
  largo?: boolean
}) {
  return (
    <View style={largo ? s.campoLargo : s.campo}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <Text style={s.valor}>{valor ?? ''}</Text>
    </View>
  )
}

function Cliente({ doc }: { doc: DocumentoRomaneio }) {
  const c = doc.cliente
  return (
    <View style={s.caixa}>
      <Text style={s.caixaTitulo}>INFORMAÇÕES DO CLIENTE</Text>
      <View style={s.grade}>
        <Campo rotulo="R. SOCIAL" valor={c?.razaoSocial} largo />
        <Campo
          rotulo="CNPJ/CPF"
          valor={c?.documento ? mascararDocumento(c.documento) : null}
        />
        <Campo rotulo="TEL." valor={c?.telefone ? mascararTelefone(c.telefone) : null} />
        <Campo rotulo="EMAIL" valor={c?.email} />
        <Campo rotulo="END." valor={c?.endereco} />
      </View>
    </View>
  )
}

function Condicoes({ doc }: { doc: DocumentoRomaneio }) {
  const temDesconto = Number(doc.descontoPercentual) > 0
  return (
    <View style={s.condicoes}>
      <View style={[s.caixa, { flex: 1, marginBottom: 0, marginRight: 8 }]}>
        <View style={s.campoLargo}>
          <Text style={[s.rotulo, { width: 112 }]}>CONDIÇÕES DE PAGAMENTO</Text>
          <Text style={s.valor}>{doc.condicoesPagamento ?? ''}</Text>
        </View>
        {doc.observacoes ? (
          <View style={[s.campoLargo, { marginBottom: 0 }]}>
            <Text style={[s.rotulo, { width: 112 }]}>OBSERVAÇÕES</Text>
            <Text style={[s.valor, { borderBottomWidth: 0 }]}>{doc.observacoes}</Text>
          </View>
        ) : null}
      </View>
      <View
        style={[
          s.caixa,
          { width: 150, marginBottom: 0, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <Text style={[s.rotulo, { width: 'auto', marginBottom: 2 }]}>DESCONTO</Text>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 16, color: COR.azul }}>
          {temDesconto || doc.tipo !== 'MODELO' ? percentual(doc.descontoPercentual) : ''}
        </Text>
      </View>
    </View>
  )
}

function Grupo({ grupo, emBranco }: { grupo: GrupoDocumento; emBranco: boolean }) {
  return (
    <View style={s.grupo} wrap={false}>
      <View style={s.cabecalhoTabela}>
        {COLUNAS.map((coluna, i) => (
          <View
            key={i}
            style={[
              s.celula,
              {
                width: larguraDa(i),
                alignSelf: 'stretch',
                justifyContent: 'center',
                backgroundColor: DESTACADAS.has(i)
                  ? escurecer(grupo.cor, 0.06)
                  : grupo.cor,
              },
            ]}
          >
            <Text
              style={[
                s.cabecalhoTexto,
                {
                  textAlign: coluna.alinhar,
                  fontSize: i === 7 ? 8.5 : 6.5,
                  color: i === 11 ? COR.azul : COR.texto,
                },
              ]}
            >
              {i === 7 ? tituloDoGrupo(grupo) : coluna.titulo}
            </Text>
          </View>
        ))}
      </View>

      {grupo.itens.map((item, indice) => (
        <Linha
          key={item.codigo}
          item={item}
          cor={grupo.cor}
          zebra={indice % 2 === 1}
          emBranco={emBranco}
        />
      ))}
    </View>
  )
}

function Linha({
  item,
  cor,
  zebra,
  emBranco,
}: {
  item: ItemDocumento
  cor: string
  zebra: boolean
  emBranco: boolean
}) {
  const aberta = item.quantidade > 0 && !item.caixaFechada
  const valores = [
    item.codigo,
    item.ean ?? '',
    item.cstCsosn,
    item.ncm,
    item.dun14 ?? '',
    item.cest ?? '',
    dimensoesCm(item.comprimentoCm, item.larguraCm, item.alturaCm),
    item.nome,
    moeda(item.preco),
    moeda(item.precoComDesconto),
    String(item.caixaMaster),
    emBranco ? '' : quantidade(item.quantidade),
    emBranco ? '' : `${quantidade(item.caixas)}${aberta ? ' *' : ''}`,
    emBranco ? '' : moeda(item.total),
  ]

  return (
    <View
      style={[s.linhaTabela, { borderBottomWidth: 0.4, borderBottomColor: COR.borda }]}
      wrap={false}
    >
      {valores.map((valor, i) => {
        const fundo = zebra ? (DESTACADAS.has(i) ? cor : clarear(cor, 0.45)) : undefined
        const ehQuantidade = i === 11
        const ehCaixas = i === 12
        return (
          <View
            key={i}
            style={[
              s.celula,
              {
                width: larguraDa(i),
                alignSelf: 'stretch',
                justifyContent: 'center',
                backgroundColor: ehCaixas && aberta ? COR.alertaFundo : fundo,
              },
            ]}
          >
            {ehQuantidade && emBranco ? (
              <View
                style={{
                  height: 10,
                  borderWidth: 0.6,
                  borderColor: COR.azul,
                  borderRadius: 1,
                }}
              />
            ) : (
              <Text
                style={{
                  textAlign: COLUNAS[i]!.alinhar,
                  fontSize: i === 7 ? 8 : 7.5,
                  fontFamily: ehQuantidade || i === 13 ? 'Helvetica-Bold' : 'Helvetica',
                  color: ehQuantidade
                    ? COR.azul
                    : ehCaixas && aberta
                      ? COR.alertaTexto
                      : COR.texto,
                }}
              >
                {valor}
              </Text>
            )}
          </View>
        )
      })}
    </View>
  )
}

function Resumo({ doc, emBranco }: { doc: DocumentoRomaneio; emBranco: boolean }) {
  const t = doc.totais
  const valor = (v: string) => (emBranco ? '' : v)
  const indicadores: Array<[string, string]> = [
    ['Itens pedidos', valor(String(t.itensComQuantidade))],
    ['Unidades', valor(quantidade(t.unidades))],
    ['Caixas master', valor(quantidade(t.caixas))],
    ['Valor bruto', valor(moeda(t.bruto))],
    [
      emBranco ? 'Desconto' : `Desconto (${percentual(doc.descontoPercentual)})`,
      valor(`– ${moeda(t.desconto)}`),
    ],
  ]

  return (
    <View>
      <View style={s.faixaTotais}>
        {indicadores.map(([rotulo, texto]) => (
          <View key={rotulo} style={s.indicador}>
            <Text style={s.indicadorRotulo}>{rotulo}</Text>
            <Text style={s.indicadorValor}>{texto}</Text>
          </View>
        ))}
        <View style={s.indicadorTotal}>
          <Text style={s.totalFinalRotulo}>VALOR TOTAL DO PEDIDO</Text>
          <Text style={s.totalFinalValor}>{valor(moeda(t.total))}</Text>
        </View>
      </View>

      <View style={s.fechamento}>
        <View style={{ width: 420 }}>
          {t.caixasFracionadas > 0 ? (
            <Text style={[s.legenda, { color: COR.alertaTexto }]}>
              *{' '}
              {t.caixasFracionadas === 1
                ? '1 item não fecha'
                : `${t.caixasFracionadas} itens não fecham`}{' '}
              a caixa master.
            </Text>
          ) : null}
          {emBranco ? (
            <Text style={s.legenda}>
              Preencha a coluna Quant. com o número de unidades. A coluna Caixa master
              indica quantas unidades vêm em cada caixa.
            </Text>
          ) : null}
          <Text style={s.legenda}>
            Preços em reais, por unidade. Valores sujeitos à confirmação no faturamento.
          </Text>
        </View>

        <View style={s.assinaturas}>
          <Text style={[s.assinatura, { width: 220, marginRight: 20 }]}>
            Aceite do cliente
          </Text>
          <Text style={[s.assinatura, { width: 90 }]}>Data</Text>
        </View>
      </View>
    </View>
  )
}
