import { Decimal } from 'decimal.js'
import type { Contexto } from '@/shared/auth/contexto'
import { NaoEncontradoError, ValidacaoError } from '@/shared/errors'
import { validar } from '@/shared/validacao/zod'
import { linhaEntradaSchema, produtoEntradaSchema } from './esquemas'
import type {
  LinhaComProdutos,
  LinhaDTO,
  NcmDTO,
  ProdutoDTO,
  RepositorioCatalogo,
} from './portas'

export function criarCasosDeUsoCatalogo(repo: RepositorioCatalogo) {
  return {
    async listarCatalogo(ctx: Contexto): Promise<LinhaComProdutos[]> {
      ctx.exigirPermissao('cadastros.produto.ler')
      return repo.listar(ctx.tenantId, false)
    },

    /**
     * Porta para outros módulos (romaneio). Sem checagem de permissão aqui:
     * quem chama já exigiu a sua, e o catálogo ativo é o que ele precisa ler.
     */
    async catalogoAtivo(tenantId: string): Promise<LinhaComProdutos[]> {
      return repo.listar(tenantId, true)
    },

    async obterProduto(ctx: Contexto, id: string): Promise<ProdutoDTO> {
      ctx.exigirPermissao('cadastros.produto.ler')
      const produto = await repo.obterProduto(ctx.tenantId, id)
      if (!produto) throw new NaoEncontradoError('Produto', id)
      return produto
    },

    async obterLinha(ctx: Contexto, id: string): Promise<LinhaDTO> {
      ctx.exigirPermissao('cadastros.produto.ler')
      const linha = await repo.obterLinha(ctx.tenantId, id)
      if (!linha) throw new NaoEncontradoError('Linha', id)
      return linha
    },

    async listarNcms(): Promise<NcmDTO[]> {
      return repo.listarNcms()
    },

    /**
     * Preço é tabela de venda: alterar exige `vendas.tabela_preco.alterar`
     * além da permissão de cadastro. Quem corrige um EAN não muda preço.
     */
    async salvarProduto(ctx: Contexto, entrada: unknown, id?: string): Promise<string> {
      ctx.exigirPermissao('cadastros.produto.gerenciar')
      const dados = validar(produtoEntradaSchema, entrada)

      if (!(await repo.obterLinha(ctx.tenantId, dados.linhaId))) {
        throw new ValidacaoError('Confira os campos destacados', {
          linhaId: 'Linha não encontrada',
        })
      }

      const ator = { id: ctx.usuarioId }

      if (!id) {
        ctx.exigirPermissao('vendas.tabela_preco.alterar')
        return repo.criarProduto(ctx.tenantId, ator, dados)
      }

      const atual = await repo.obterProduto(ctx.tenantId, id)
      if (!atual) throw new NaoEncontradoError('Produto', id)
      if (!new Decimal(atual.preco).equals(dados.preco)) {
        ctx.exigirPermissao('vendas.tabela_preco.alterar')
      }

      await repo.atualizarProduto(ctx.tenantId, ator, id, dados)
      return id
    },

    async salvarLinha(ctx: Contexto, entrada: unknown, id?: string): Promise<string> {
      ctx.exigirPermissao('cadastros.produto.gerenciar')
      const dados = validar(linhaEntradaSchema, entrada)
      const ator = { id: ctx.usuarioId }

      if (!id) return repo.criarLinha(ctx.tenantId, ator, dados)

      if (!(await repo.obterLinha(ctx.tenantId, id)))
        throw new NaoEncontradoError('Linha', id)
      await repo.atualizarLinha(ctx.tenantId, ator, id, dados)
      return id
    },
  }
}

export type CasosDeUsoCatalogo = ReturnType<typeof criarCasosDeUsoCatalogo>
