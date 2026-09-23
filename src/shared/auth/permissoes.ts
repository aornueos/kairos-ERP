/**
 * Catálogo de permissões do KAIROS (ver skill permissions-matrix).
 *
 * Fonte única: o seed, a verificação e a interface leem daqui.
 * Permissão que não está neste objeto não existe.
 *
 * Convenção: <modulo>.<recurso>.<acao>
 */
export const PERMISSOES = {
  // ---------------------------------------------------------------- admin
  'admin.total': 'Acesso total ao tenant',
  'admin.usuario.ler': 'Visualizar usuários',
  'admin.usuario.gerenciar': 'Criar, alterar e desativar usuários',
  'admin.perfil.gerenciar': 'Gerenciar perfis e permissões',
  'admin.parametro.gerenciar': 'Alterar parâmetros do sistema',
  'admin.auditoria.ler': 'Consultar trilha de auditoria',
  'admin.processos.ler': 'Acompanhar filas e processos',
  'admin.processos.reprocessar': 'Reprocessar job com falha',

  // ---------------------------------------------------------------- cadastros
  'cadastros.produto.ler': 'Visualizar produtos e insumos',
  'cadastros.produto.gerenciar': 'Criar e alterar produtos e insumos',
  'cadastros.parceiro.ler': 'Visualizar parceiros',
  'cadastros.parceiro.gerenciar': 'Criar e alterar parceiros',

  // ---------------------------------------------------------------- estoque
  'estoque.saldo.ler': 'Consultar saldo e lotes',
  'estoque.movimento.registrar': 'Registrar movimentação',
  'estoque.movimento.ajustar': 'Ajuste manual de estoque',
  'estoque.inventario.contar': 'Executar contagem de inventário',
  'estoque.inventario.fechar': 'Fechar inventário e gerar ajustes',

  // ---------------------------------------------------------------- compras
  'compras.pedido.ler': 'Visualizar pedidos de compra',
  'compras.pedido.criar': 'Criar pedido de compra',
  'compras.pedido.aprovar': 'Aprovar pedido de compra',
  'compras.recebimento.registrar': 'Registrar recebimento',

  // ---------------------------------------------------------------- produção
  'producao.formula.ler': 'Visualizar fórmulas',
  'producao.formula.alterar': 'Criar e versionar fórmula-mestra',
  'producao.op.criar': 'Abrir ordem de produção',
  'producao.op.apontar': 'Apontar produção e consumo',
  'producao.op.concluir': 'Concluir ordem de produção',

  // ---------------------------------------------------------------- vendas
  'vendas.pedido.ler': 'Visualizar pedidos',
  'vendas.pedido.criar': 'Criar pedido de venda',
  'vendas.pedido.confirmar': 'Confirmar pedido',
  'vendas.pedido.cancelar': 'Cancelar pedido',
  'vendas.pedido.aprovar_desconto': 'Aprovar desconto acima do limite',
  'vendas.tabela_preco.alterar': 'Alterar tabela de preços',
  'vendas.romaneio.ler': 'Visualizar e baixar romaneios',
  'vendas.romaneio.criar': 'Criar e alterar romaneio',
  'vendas.romaneio.cancelar': 'Cancelar romaneio',

  // ---------------------------------------------------------------- faturamento e fiscal
  'faturamento.faturar': 'Faturar pedido',
  'faturamento.estornar': 'Estornar faturamento',
  'fiscal.nfe.emitir': 'Emitir NF-e',
  'fiscal.nfe.cancelar': 'Cancelar NF-e',
  'fiscal.nfe.ler': 'Consultar documentos fiscais',

  // ---------------------------------------------------------------- financeiro
  'financeiro.titulo.ler': 'Visualizar títulos',
  'financeiro.titulo.criar': 'Lançar título',
  'financeiro.titulo.baixar': 'Baixar título',
  'financeiro.titulo.estornar': 'Estornar baixa',
  'financeiro.conciliacao.executar': 'Conciliar extrato bancário',
  'financeiro.remessa.gerar': 'Gerar remessa bancária',

  // ---------------------------------------------------------------- relatórios
  'relatorios.operacional.ler': 'Relatórios operacionais',
  'relatorios.dre.ler': 'DRE gerencial e fluxo de caixa',
} as const

export type Permissao = keyof typeof PERMISSOES

export const TODAS_PERMISSOES = Object.keys(PERMISSOES) as Permissao[]

export function descricaoDa(permissao: Permissao): string {
  return PERMISSOES[permissao]
}

/** Códigos dos perfis criados pelo seed base. */
export const PERFIS_PADRAO = {
  ADMINISTRADOR: 'Administrador',
  FINANCEIRO: 'Financeiro',
  VENDAS: 'Vendas',
  PRODUCAO: 'Produção',
  ESTOQUE: 'Estoque',
  FISCAL: 'Fiscal',
  LEITURA: 'Somente leitura',
} as const

export type CodigoPerfil = keyof typeof PERFIS_PADRAO

/**
 * Matriz perfil x permissão do seed. Administrador recebe `admin.total`,
 * que é o único curinga do sistema.
 */
export const MATRIZ_PADRAO: Record<CodigoPerfil, Permissao[]> = {
  ADMINISTRADOR: ['admin.total'],

  FINANCEIRO: [
    'cadastros.parceiro.ler',
    'cadastros.parceiro.gerenciar',
    'cadastros.produto.ler',
    'compras.pedido.ler',
    'compras.pedido.aprovar',
    'vendas.pedido.ler',
    'vendas.pedido.aprovar_desconto',
    'vendas.romaneio.ler',
    'vendas.tabela_preco.alterar',
    'faturamento.faturar',
    'fiscal.nfe.ler',
    'financeiro.titulo.ler',
    'financeiro.titulo.criar',
    'financeiro.titulo.baixar',
    'financeiro.titulo.estornar',
    'financeiro.conciliacao.executar',
    'financeiro.remessa.gerar',
    'relatorios.operacional.ler',
    'relatorios.dre.ler',
    'admin.processos.ler',
  ],

  VENDAS: [
    'cadastros.parceiro.ler',
    'cadastros.parceiro.gerenciar',
    'cadastros.produto.ler',
    'estoque.saldo.ler',
    'vendas.pedido.ler',
    'vendas.pedido.criar',
    'vendas.pedido.confirmar',
    'vendas.pedido.cancelar',
    'vendas.romaneio.ler',
    'vendas.romaneio.criar',
    'vendas.romaneio.cancelar',
    'fiscal.nfe.ler',
    'relatorios.operacional.ler',
  ],

  PRODUCAO: [
    'cadastros.produto.ler',
    'estoque.saldo.ler',
    'estoque.movimento.registrar',
    'producao.formula.ler',
    'producao.formula.alterar',
    'producao.op.criar',
    'producao.op.apontar',
    'producao.op.concluir',
    'relatorios.operacional.ler',
  ],

  ESTOQUE: [
    'cadastros.produto.ler',
    'estoque.saldo.ler',
    'estoque.movimento.registrar',
    'estoque.movimento.ajustar',
    'estoque.inventario.contar',
    'estoque.inventario.fechar',
    'compras.recebimento.registrar',
    'relatorios.operacional.ler',
  ],

  FISCAL: [
    'cadastros.produto.ler',
    'cadastros.parceiro.ler',
    'faturamento.faturar',
    'fiscal.nfe.ler',
    'fiscal.nfe.emitir',
    'fiscal.nfe.cancelar',
    'relatorios.operacional.ler',
  ],

  LEITURA: [
    'cadastros.produto.ler',
    'cadastros.parceiro.ler',
    'estoque.saldo.ler',
    'vendas.pedido.ler',
    'vendas.romaneio.ler',
    'compras.pedido.ler',
    'financeiro.titulo.ler',
    'fiscal.nfe.ler',
    'relatorios.operacional.ler',
  ],
}

/**
 * Combinações que acumulam poder demais na mesma pessoa.
 * A tela de perfis alerta, mas não bloqueia: empresa pequena às vezes precisa
 * acumular. O que não pode é acontecer sem ninguém saber.
 */
export const CONFLITOS_SEGREGACAO: Array<{
  permissoes: Permissao[]
  risco: string
}> = [
  {
    permissoes: [
      'cadastros.parceiro.gerenciar',
      'compras.pedido.aprovar',
      'financeiro.titulo.baixar',
    ],
    risco: 'Cadastrar fornecedor, aprovar a compra e pagar — fraude clássica.',
  },
  {
    permissoes: ['cadastros.parceiro.gerenciar', 'financeiro.remessa.gerar'],
    risco: 'Alterar dados bancários do fornecedor e gerar a remessa de pagamento.',
  },
  {
    permissoes: ['estoque.movimento.ajustar', 'estoque.inventario.fechar'],
    risco: 'Ajustar estoque e fechar o inventário sem segunda conferência.',
  },
]
