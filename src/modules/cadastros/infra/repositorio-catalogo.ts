import { uuidv7 } from 'uuidv7'
import type { LinhaProduto, Produto } from '@/generated/prisma/client'
import { diferencas, registrarAuditoria } from '@/shared/auditoria/registrar'
import { prisma } from '@/shared/db/client'
import { comTenant, type TransacaoTenant } from '@/shared/db/tenant-client'
import { NaoEncontradoError, ValidacaoError } from '@/shared/errors'
import type { DadosLinha, DadosProduto } from '../application/esquemas'
import type {
  Ator,
  LinhaDTO,
  ProdutoDTO,
  RepositorioCatalogo,
} from '../application/portas'

function linhaDTO(l: LinhaProduto): LinhaDTO {
  return {
    id: l.id,
    nome: l.nome,
    apelo: l.apelo,
    cor: l.cor,
    ordem: l.ordem,
    ativo: l.ativo,
  }
}

function produtoDTO(p: Produto): ProdutoDTO {
  return {
    id: p.id,
    linhaId: p.linhaId,
    codigo: p.codigo,
    nome: p.nome,
    ean: p.ean,
    dun14: p.dun14,
    ncm: p.ncm,
    cest: p.cest,
    cstCsosn: p.cstCsosn,
    comprimentoCm: p.comprimentoCm?.toString() ?? null,
    larguraCm: p.larguraCm?.toString() ?? null,
    alturaCm: p.alturaCm?.toString() ?? null,
    preco: p.preco.toFixed(2),
    caixaMaster: p.caixaMaster,
    ordem: p.ordem,
    ativo: p.ativo,
  }
}

/** Forma comparável para a auditoria: decimais normalizados como texto. */
function paraAuditoria(p: ProdutoDTO | DadosProduto) {
  const dec = (v: string | null) => (v == null ? null : Number(v).toFixed(2))
  return {
    linhaId: p.linhaId,
    codigo: p.codigo,
    nome: p.nome,
    ean: p.ean,
    dun14: p.dun14,
    ncm: p.ncm,
    cest: p.cest,
    cstCsosn: p.cstCsosn,
    comprimentoCm: dec(p.comprimentoCm),
    larguraCm: dec(p.larguraCm),
    alturaCm: dec(p.alturaCm),
    preco: dec(p.preco),
    caixaMaster: p.caixaMaster,
    ordem: p.ordem,
    ativo: p.ativo,
  }
}

/**
 * Código e EAN são únicos por empresa. A conferência antes de gravar dá uma
 * mensagem por campo; a restrição única do banco segue como garantia final.
 */
async function conferirUnicidade(
  tx: TransacaoTenant,
  tenantId: string,
  dados: DadosProduto,
  ignorarId?: string,
) {
  const campos: Record<string, string> = {}
  const outro = { tenantId, NOT: ignorarId ? { id: ignorarId } : undefined }

  if (await tx.produto.findFirst({ where: { ...outro, codigo: dados.codigo } })) {
    campos['codigo'] = 'Já existe produto com este código'
  }
  if (
    dados.ean &&
    (await tx.produto.findFirst({ where: { ...outro, ean: dados.ean } }))
  ) {
    campos['ean'] = 'Já existe produto com este EAN'
  }
  if (Object.keys(campos).length > 0) {
    throw new ValidacaoError('Confira os campos destacados', campos)
  }
}

function colunasProduto(dados: DadosProduto) {
  return {
    linhaId: dados.linhaId,
    codigo: dados.codigo,
    nome: dados.nome,
    ean: dados.ean,
    dun14: dados.dun14,
    ncm: dados.ncm,
    cest: dados.cest,
    cstCsosn: dados.cstCsosn,
    comprimentoCm: dados.comprimentoCm,
    larguraCm: dados.larguraCm,
    alturaCm: dados.alturaCm,
    preco: dados.preco,
    caixaMaster: dados.caixaMaster,
    ordem: dados.ordem,
    ativo: dados.ativo,
  }
}

export const repositorioCatalogoPrisma: RepositorioCatalogo = {
  listar(tenantId, somenteAtivos) {
    return comTenant(tenantId, async (tx) => {
      const linhas = await tx.linhaProduto.findMany({
        where: somenteAtivos ? { ativo: true } : {},
        orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
        include: {
          produtos: {
            where: somenteAtivos ? { ativo: true } : {},
            orderBy: [{ ordem: 'asc' }, { codigo: 'asc' }],
          },
        },
      })

      return linhas
        .filter((l) => !somenteAtivos || l.produtos.length > 0)
        .map((l) => ({ ...linhaDTO(l), produtos: l.produtos.map(produtoDTO) }))
    })
  },

  obterProduto(tenantId, id) {
    return comTenant(tenantId, async (tx) => {
      const p = await tx.produto.findUnique({ where: { id } })
      return p ? produtoDTO(p) : null
    })
  },

  obterLinha(tenantId, id) {
    return comTenant(tenantId, async (tx) => {
      const l = await tx.linhaProduto.findUnique({ where: { id } })
      return l ? linhaDTO(l) : null
    })
  },

  criarProduto(tenantId, ator: Ator, dados) {
    return comTenant(tenantId, async (tx) => {
      await conferirUnicidade(tx, tenantId, dados)
      const id = uuidv7()
      await tx.produto.create({ data: { id, tenantId, ...colunasProduto(dados) } })
      await registrarAuditoria(tx, {
        tenantId,
        entidade: 'Produto',
        entidadeId: id,
        acao: 'criou',
        atorId: ator.id,
        depois: paraAuditoria(dados),
      })
      return id
    })
  },

  atualizarProduto(tenantId, ator, id, dados) {
    return comTenant(tenantId, async (tx) => {
      const atual = await tx.produto.findUnique({ where: { id } })
      if (!atual) throw new NaoEncontradoError('Produto', id)

      await conferirUnicidade(tx, tenantId, dados, id)
      await tx.produto.update({ where: { id }, data: colunasProduto(dados) })

      const mudou = diferencas(paraAuditoria(produtoDTO(atual)), paraAuditoria(dados))
      if (mudou) {
        await registrarAuditoria(tx, {
          tenantId,
          entidade: 'Produto',
          entidadeId: id,
          acao: 'alterou',
          atorId: ator.id,
          ...mudou,
        })
      }
    })
  },

  criarLinha(tenantId, ator, dados: DadosLinha) {
    return comTenant(tenantId, async (tx) => {
      if (await tx.linhaProduto.findFirst({ where: { tenantId, nome: dados.nome } })) {
        throw new ValidacaoError('Confira os campos destacados', {
          nome: 'Já existe linha com este nome',
        })
      }
      const id = uuidv7()
      await tx.linhaProduto.create({ data: { id, tenantId, ...dados } })
      await registrarAuditoria(tx, {
        tenantId,
        entidade: 'LinhaProduto',
        entidadeId: id,
        acao: 'criou',
        atorId: ator.id,
        depois: { ...dados },
      })
      return id
    })
  },

  atualizarLinha(tenantId, ator, id, dados) {
    return comTenant(tenantId, async (tx) => {
      const atual = await tx.linhaProduto.findUnique({ where: { id } })
      if (!atual) throw new NaoEncontradoError('Linha', id)

      const homonima = await tx.linhaProduto.findFirst({
        where: { tenantId, nome: dados.nome, NOT: { id } },
      })
      if (homonima) {
        throw new ValidacaoError('Confira os campos destacados', {
          nome: 'Já existe linha com este nome',
        })
      }

      await tx.linhaProduto.update({ where: { id }, data: dados })

      const { id: _id, ...antes } = linhaDTO(atual)
      const mudou = diferencas(antes, { ...dados })
      if (mudou) {
        await registrarAuditoria(tx, {
          tenantId,
          entidade: 'LinhaProduto',
          entidadeId: id,
          acao: 'alterou',
          atorId: ator.id,
          ...mudou,
        })
      }
    })
  },

  // NCM é tabela de referência global: sem tenant, sem RLS.
  async listarNcms() {
    const ncms = await prisma.ncm.findMany({
      where: { vigenciaFim: null },
      orderBy: { codigo: 'asc' },
      select: { codigo: true, descricao: true },
    })
    return ncms
  },
}
