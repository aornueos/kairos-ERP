import type { DadosLinha, DadosProduto } from './esquemas'

/**
 * Contratos do catálogo. Valores monetários e dimensões trafegam como texto
 * decimal ("6.50"): atravessam a fronteira servidor/cliente sem perder precisão.
 */

export interface LinhaDTO {
  id: string
  nome: string
  apelo: string | null
  cor: string
  ordem: number
  ativo: boolean
}

export interface ProdutoDTO {
  id: string
  linhaId: string
  codigo: string
  nome: string
  ean: string | null
  dun14: string | null
  ncm: string
  cest: string | null
  cstCsosn: string
  comprimentoCm: string | null
  larguraCm: string | null
  alturaCm: string | null
  preco: string
  caixaMaster: number
  ordem: number
  ativo: boolean
}

export interface LinhaComProdutos extends LinhaDTO {
  produtos: ProdutoDTO[]
}

export interface NcmDTO {
  codigo: string
  descricao: string
}

export interface Ator {
  id: string
}

export interface RepositorioCatalogo {
  /** Com `somenteAtivos`, omite linhas e produtos inativos e linhas sem produto. */
  listar(tenantId: string, somenteAtivos: boolean): Promise<LinhaComProdutos[]>
  obterProduto(tenantId: string, id: string): Promise<ProdutoDTO | null>
  obterLinha(tenantId: string, id: string): Promise<LinhaDTO | null>
  criarProduto(tenantId: string, ator: Ator, dados: DadosProduto): Promise<string>
  atualizarProduto(
    tenantId: string,
    ator: Ator,
    id: string,
    dados: DadosProduto,
  ): Promise<void>
  criarLinha(tenantId: string, ator: Ator, dados: DadosLinha): Promise<string>
  atualizarLinha(
    tenantId: string,
    ator: Ator,
    id: string,
    dados: DadosLinha,
  ): Promise<void>
  listarNcms(): Promise<NcmDTO[]>
}
