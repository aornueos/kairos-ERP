import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import bwip from 'bwip-js/node'
import sharp from 'sharp'
import { mascararCnpj } from '@/shared/i18n/formato'
import type { DocumentoRomaneio, GrupoDocumento } from '../../application/documento'

/** Recursos visuais que o PDF e o Excel compartilham. */

/** Mistura a cor com branco. `fator` 0 devolve a própria cor; 1, branco. */
export function clarear(hex: string, fator: number): string {
  return misturar(hex, 255, fator)
}

/** Mistura a cor com preto, para o cabeçalho de colunas alternadas. */
export function escurecer(hex: string, fator: number): string {
  return misturar(hex, 0, fator)
}

function misturar(hex: string, alvo: number, fator: number): string {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return (
    '#' +
    canais
      .map((c) => Math.round(c + (alvo - c) * fator))
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

export function tituloDoGrupo(grupo: GrupoDocumento): string {
  return grupo.apelo
    ? `${grupo.nome.toUpperCase()} / ${grupo.apelo}`
    : grupo.nome.toUpperCase()
}

/** Marca em texto, usada enquanto não houver arquivo de logo: "pure.us". */
export function marcaEmTexto(doc: DocumentoRomaneio): string {
  return (doc.empresa.nomeFantasia ?? doc.empresa.razaoSocial).toLowerCase()
}

/**
 * Logo da empresa, se existir em public/marca/logo.png.
 * PNG porque é o formato que PDF e Excel aceitam sem conversão.
 */
export async function carregarLogo(): Promise<Buffer | null> {
  try {
    return await readFile(path.join(process.cwd(), 'public', 'marca', 'logo.png'))
  } catch {
    return null
  }
}

/** Code 128 do número do romaneio: a expedição e o financeiro bipam em vez de digitar. */
export function codigoDeBarras(numero: string): Promise<Buffer> {
  return bwip.toBuffer({
    bcid: 'code128',
    text: numero,
    scale: 3,
    height: 9,
    includetext: false,
    paddingwidth: 0,
    paddingheight: 0,
  })
}

export function linhasDaEmpresa(doc: DocumentoRomaneio): string[] {
  const e = doc.empresa
  const documentos = [
    `CNPJ ${mascararCnpj(e.cnpj)}`,
    e.inscricaoEstadual ? `IE ${e.inscricaoEstadual}` : null,
  ]
  const contato = [e.telefone, e.email]
  return [
    e.razaoSocial,
    documentos.filter(Boolean).join('  ·  '),
    e.endereco,
    contato.filter(Boolean).join('  ·  '),
  ].filter((l): l is string => Boolean(l))
}

export function tituloDoDocumento(doc: DocumentoRomaneio): string {
  if (doc.tipo === 'MODELO') return 'Tabela de pedido'
  return `Romaneio nº ${doc.numero}`
}

// ---------------------------------------------------------------- miniaturas

/**
 * Foto do produto em `public/produtos/<código>.png|jpg|jpeg|webp`.
 *
 * A foto original costuma ter megabytes; dezesseis delas deixariam o PDF
 * impossível de mandar por WhatsApp. Por isso vira miniatura de 96 px, fundo
 * branco, antes de entrar no documento. Quando upload de arquivos existir
 * (skill file-storage), a origem passa a ser o armazenamento, não a pasta.
 */

const PASTA_FOTOS = path.join(process.cwd(), 'public', 'produtos')
const EXTENSOES = ['png', 'jpg', 'jpeg', 'webp']
const LADO_MINIATURA = 96
const CODIGO_SEGURO = /^[A-Za-z0-9_-]{1,20}$/

const miniaturas = new Map<string, Promise<Buffer>>()

async function localizarFoto(
  codigo: string,
): Promise<{ caminho: string; versao: number } | null> {
  // O código vem do cadastro: sem esta checagem, "../" viraria leitura fora da pasta.
  if (!CODIGO_SEGURO.test(codigo)) return null
  for (const extensao of EXTENSOES) {
    const caminho = path.join(PASTA_FOTOS, `${codigo}.${extensao}`)
    try {
      const info = await stat(caminho)
      if (info.isFile()) return { caminho, versao: info.mtimeMs }
    } catch {
      // sem foto nesta extensão
    }
  }
  return null
}

/** Frasco na cor da linha: ocupa o lugar da foto enquanto ela não existe. */
function pictograma(cor: string): Promise<Buffer> {
  const fundo = clarear(cor, 0.35)
  const traco = escurecer(cor, 0.4)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="18" fill="${fundo}"/>
  <rect x="40" y="13" width="16" height="10" rx="2" fill="${traco}"/>
  <path d="M42 23h12v8c0 2 9 5 9 13v33a7 7 0 0 1-7 7H40a7 7 0 0 1-7-7V44c0-8 9-11 9-13z" fill="${traco}"/>
  <rect x="38" y="50" width="20" height="17" rx="2" fill="${fundo}"/>
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function gerarMiniatura(caminho: string): Promise<Buffer> {
  return sharp(caminho)
    .resize(LADO_MINIATURA, LADO_MINIATURA, { fit: 'contain', background: '#FFFFFF' })
    .flatten({ background: '#FFFFFF' })
    .png()
    .toBuffer()
}

/**
 * Miniatura PNG do produto. A chave inclui a data do arquivo: trocar a foto
 * vale na próxima geração, sem reiniciar o servidor.
 */
export async function miniaturaDoProduto(codigo: string, cor: string): Promise<Buffer> {
  const foto = await localizarFoto(codigo)
  const chave = foto ? `${foto.caminho}:${foto.versao}` : `pictograma:${cor}`

  let miniatura = miniaturas.get(chave)
  if (!miniatura) {
    miniatura = foto ? gerarMiniatura(foto.caminho) : pictograma(cor)
    miniatura.catch(() => miniaturas.delete(chave))
    miniaturas.set(chave, miniatura)
  }
  return miniatura
}

/** Miniaturas de todos os itens, indexadas pelo código do produto. */
export async function miniaturasDoDocumento(
  doc: DocumentoRomaneio,
): Promise<Map<string, Buffer>> {
  const pares = await Promise.all(
    doc.grupos.flatMap((g) =>
      g.itens.map(
        async (i) => [i.codigo, await miniaturaDoProduto(i.codigo, g.cor)] as const,
      ),
    ),
  )
  return new Map(pares)
}
