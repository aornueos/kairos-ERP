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
  COLUNAS,
  COR,
  escurecer,
  linhasDaEmpresa,
  marcaEmTexto,
  miniaturasDoDocumento,
  tituloDoDocumento,
  tituloDoGrupo,
  type ChaveColuna as Chave,
  type ColunaDoRomaneio as Coluna,
} from './comum'

/**
 * Romaneio em PDF, A4 paisagem.
 *
 * Mesmo conteúdo da planilha original, organizado para leitura e impressão:
 * cabeçalho com fornecedor, valor total em destaque e código de barras do
 * número; cliente; condições; uma faixa por linha de produto com miniatura de
 * cada item; resumo com aceite.
 *
 * Romaneio com quantidades mostra só o que foi pedido. Romaneio sem quantidade
 * e tabela em branco mostram o catálogo inteiro, com a coluna de quantidade em
 * aberto para preencher à mão.
 */

const LADO_MINIATURA = 14

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
  cabecalho: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  marca: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 28,
    letterSpacing: -1,
    marginBottom: 2,
  },
  empresaLinha: { fontSize: 7.5, color: COR.suave, marginTop: 1.5 },
  empresaNome: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: COR.texto },
  destaqueTotal: {
    width: 220,
    marginRight: 16,
    backgroundColor: COR.totalFundo,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: COR.forte,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'flex-end',
  },
  destaqueRotulo: { fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 0.4 },
  destaqueValor: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    color: COR.azul,
    marginTop: 2,
    minHeight: 26,
  },
  destaqueDetalhe: { fontSize: 7.5, color: COR.forte, marginTop: 2 },
  documento: { alignItems: 'flex-end', width: 160 },
  titulo: { fontFamily: 'Helvetica-Bold', fontSize: 15, letterSpacing: 0.5 },
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
  linhaTabela: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
    borderBottomWidth: 0.4,
    borderBottomColor: COR.borda,
  },
  celula: { paddingHorizontal: 3, paddingVertical: 2 },
  cabecalhoTabela: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
    borderBottomWidth: 1,
    borderBottomColor: COR.forte,
  },
  cabecalhoTexto: { fontFamily: 'Helvetica-Bold', fontSize: 6.5 },
  produto: { flexDirection: 'row', alignItems: 'center' },
  miniatura: {
    width: LADO_MINIATURA,
    height: LADO_MINIATURA,
    marginRight: 4,
    borderRadius: 2,
  },
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
    backgroundColor: COR.totalFundo,
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

export async function gerarPdf(doc: DocumentoRomaneio): Promise<Buffer> {
  const [barras, logo, miniaturas] = await Promise.all([
    doc.numero ? codigoDeBarras(doc.numero) : Promise.resolve(null),
    carregarLogo(),
    miniaturasDoDocumento(doc),
  ])
  return renderToBuffer(
    <RomaneioPdf doc={doc} barras={barras} logo={logo} miniaturas={miniaturas} />,
  )
}

function gruposVisiveis(doc: DocumentoRomaneio): GrupoDocumento[] {
  const soPedidos = doc.tipo === 'ROMANEIO' && doc.totais.itensComQuantidade > 0
  if (!soPedidos) return doc.grupos
  return doc.grupos
    .map((g) => ({ ...g, itens: g.itens.filter((i) => i.quantidade > 0) }))
    .filter((g) => g.itens.length > 0)
}

function emBrancoDo(doc: DocumentoRomaneio): boolean {
  return doc.tipo === 'MODELO' || doc.totais.itensComQuantidade === 0
}

function RomaneioPdf({
  doc,
  barras,
  logo,
  miniaturas,
}: {
  doc: DocumentoRomaneio
  barras: Buffer | null
  logo: Buffer | null
  miniaturas: Map<string, Buffer>
}) {
  const emBranco = emBrancoDo(doc)
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
          <Grupo
            key={grupo.nome}
            grupo={grupo}
            emBranco={emBranco}
            miniaturas={miniaturas}
          />
        ))}

        {/* O último grupo acompanha o resumo: nunca sobra página só com totais. */}
        <View wrap={false}>
          {ultimo ? (
            <Grupo grupo={ultimo} emBranco={emBranco} miniaturas={miniaturas} />
          ) : null}
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
  const emBranco = emBrancoDo(doc)
  const t = doc.totais
  const detalheTotal = [
    `${quantidade(t.unidades)} un`,
    Number(t.boxes) > 0 ? `${quantidade(t.boxes)} box` : null,
    `${quantidade(t.caixas)} cx master`,
  ]
    .filter(Boolean)
    .join('  ·  ')

  return (
    <View style={s.cabecalho}>
      <View style={{ flex: 1 }}>
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

      <View style={s.destaqueTotal}>
        <Text style={s.destaqueRotulo}>VALOR TOTAL DO PEDIDO</Text>
        <Text style={s.destaqueValor}>{emBranco ? '' : moeda(t.total)}</Text>
        {emBranco ? null : <Text style={s.destaqueDetalhe}>{detalheTotal}</Text>}
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
            style={{ width: 150, height: 24, marginTop: 4 }}
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

function fundoDaCelula(coluna: Coluna, cor: string, zebra: boolean): string | undefined {
  if (!zebra) return undefined
  return coluna.destacada ? cor : clarear(cor, 0.45)
}

function Grupo({
  grupo,
  emBranco,
  miniaturas,
}: {
  grupo: GrupoDocumento
  emBranco: boolean
  miniaturas: Map<string, Buffer>
}) {
  return (
    <View style={s.grupo} wrap={false}>
      <View style={s.cabecalhoTabela}>
        {COLUNAS.map((coluna) => (
          <View
            key={coluna.chave}
            style={[
              s.celula,
              {
                width: coluna.largura,
                alignSelf: 'stretch',
                justifyContent: 'center',
                backgroundColor: coluna.destacada
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
                  fontSize: coluna.chave === 'produto' ? 8.5 : 6.5,
                  color: coluna.chave === 'quantidade' ? COR.azul : COR.texto,
                },
              ]}
            >
              {coluna.chave === 'produto' ? tituloDoGrupo(grupo) : coluna.titulo}
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
          miniatura={miniaturas.get(item.codigo) ?? null}
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
  miniatura,
}: {
  item: ItemDocumento
  cor: string
  zebra: boolean
  emBranco: boolean
  miniatura: Buffer | null
}) {
  const aberta = item.quantidade > 0 && !item.embalagemFechada
  // Embalagem aberta é sinalizada na coluna que define a venda: box quando o
  // produto tem box, caixa master quando não tem.
  const colunaDoAlerta: Chave = item.caixaBox ? 'boxes' : 'caixas'

  const texto: Record<Exclude<Chave, 'produto'>, string> = {
    codigo: item.codigo,
    ean: item.ean ?? '',
    cst: item.cstCsosn,
    ncm: item.ncm,
    dun: item.dun14 ?? '',
    cest: item.cest ?? '',
    dimensoes: dimensoesCm(item.comprimentoCm, item.larguraCm, item.alturaCm),
    preco: moeda(item.preco),
    precoAplicado: `${moeda(item.precoAplicado)}${item.precoManualAplicado ? ' †' : ''}`,
    caixaBox: item.caixaBox ? String(item.caixaBox) : '–',
    caixaMaster: String(item.caixaMaster),
    quantidade: emBranco ? '' : quantidade(item.quantidade),
    boxes: emBranco ? '' : item.boxes == null ? '–' : quantidade(item.boxes),
    caixas: emBranco ? '' : quantidade(item.caixas),
    total: emBranco ? '' : moeda(item.total),
  }

  return (
    <View style={s.linhaTabela} wrap={false}>
      {COLUNAS.map((coluna) => {
        const alerta = aberta && coluna.chave === colunaDoAlerta
        const manual = item.precoManualAplicado && coluna.chave === 'precoAplicado'
        const fundo = alerta
          ? COR.alertaFundo
          : manual
            ? COR.manualFundo
            : fundoDaCelula(coluna, cor, zebra)

        return (
          <View
            key={coluna.chave}
            style={[
              s.celula,
              {
                width: coluna.largura,
                alignSelf: 'stretch',
                justifyContent: 'center',
                backgroundColor: fundo,
              },
            ]}
          >
            {coluna.chave === 'produto' ? (
              <View style={s.produto}>
                {miniatura ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- Image do react-pdf não é <img>
                  <Image src={{ data: miniatura, format: 'png' }} style={s.miniatura} />
                ) : null}
                <Text style={{ fontSize: 8, flex: 1 }}>{item.nome}</Text>
              </View>
            ) : coluna.chave === 'quantidade' && emBranco ? (
              <View
                style={{
                  height: 11,
                  borderWidth: 0.6,
                  borderColor: COR.azul,
                  borderRadius: 1,
                }}
              />
            ) : (
              <Text
                style={{
                  textAlign: coluna.alinhar,
                  fontSize: 7.5,
                  fontFamily:
                    coluna.chave === 'quantidade' || coluna.chave === 'total' || manual
                      ? 'Helvetica-Bold'
                      : 'Helvetica',
                  color:
                    coluna.chave === 'quantidade'
                      ? COR.azul
                      : alerta
                        ? COR.alertaTexto
                        : manual
                          ? COR.manual
                          : COR.texto,
                }}
              >
                {texto[coluna.chave]}
                {alerta ? ' *' : ''}
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
    ['Boxes', valor(quantidade(t.boxes))],
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
        <View style={{ width: 440 }}>
          {!emBranco && t.precosManuais > 0 ? (
            <Text style={[s.legenda, { color: COR.manual }]}>
              † Preço negociado pelo vendedor: não segue o desconto geral do pedido.
            </Text>
          ) : null}
          {!emBranco && t.embalagensAbertas > 0 ? (
            <Text style={[s.legenda, { color: COR.alertaTexto }]}>
              *{' '}
              {t.embalagensAbertas === 1
                ? '1 item não fecha'
                : `${t.embalagensAbertas} itens não fecham`}{' '}
              embalagem inteira (box, quando o produto tem; caixa master, quando não).
            </Text>
          ) : null}
          {emBranco ? (
            <Text style={s.legenda}>
              Preencha a coluna Quant. com o número de unidades. As colunas Caixa box e
              Caixa master indicam quantas unidades vêm em cada embalagem.
            </Text>
          ) : null}
          <Text style={s.legenda}>
            Preços em reais, por unidade. Valores sujeitos à confirmação no faturamento.
          </Text>
        </View>

        <View style={s.assinaturas}>
          <Text style={[s.assinatura, { width: 200, marginRight: 20 }]}>
            Aceite do cliente
          </Text>
          <Text style={[s.assinatura, { width: 90 }]}>Data</Text>
        </View>
      </View>
    </View>
  )
}
