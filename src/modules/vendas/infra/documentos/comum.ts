import { readFile } from 'node:fs/promises'
import path from 'node:path'
import bwip from 'bwip-js/node'
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
