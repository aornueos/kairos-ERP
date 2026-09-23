import '../load-env'
import { Client } from 'pg'

/**
 * Gate de CI: toda tabela com tenant_id precisa ter RLS habilitada, forçada e
 * com policy de isolamento (ADR-0003).
 *
 * Esquecer a policy numa migration é o erro mais grave possível neste sistema:
 * um tenant passa a enxergar dado de outro. Por isso a verificação é automática
 * e não depende de alguém lembrar na revisão.
 */

const TABELAS_GLOBAIS_PERMITIDAS = new Set([
  'tenant',
  'usuario',
  'uf',
  'municipio',
  'ncm',
  'cfop',
  'banco',
  'unidade_medida',
  '_prisma_migrations',
])

async function principal() {
  const url = process.env['DATABASE_URL']
  if (!url) {
    console.error('DATABASE_URL não definida.')
    process.exit(1)
  }

  const cliente = new Client({ connectionString: url })
  await cliente.connect()

  try {
    const { rows: tabelas } = await cliente.query<{
      tabela: string
      tem_tenant: boolean
      rls: boolean
      forcada: boolean
      policies: number
    }>(`
      select c.relname                                        as tabela,
             exists (
               select 1 from information_schema.columns col
                where col.table_schema = 'public'
                  and col.table_name = c.relname
                  and col.column_name = 'tenant_id'
             )                                                as tem_tenant,
             c.relrowsecurity                                 as rls,
             c.relforcerowsecurity                            as forcada,
             (select count(*) from pg_policies p
               where p.schemaname = 'public' and p.tablename = c.relname)::int as policies
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public'
         and c.relkind = 'r'
       order by c.relname
    `)

    const problemas: string[] = []

    for (const t of tabelas) {
      if (t.tem_tenant) {
        if (!t.rls) problemas.push(`${t.tabela}: tem tenant_id mas RLS está desabilitada`)
        else if (!t.forcada)
          problemas.push(
            `${t.tabela}: RLS habilitada mas não forçada (o dono da tabela ignora a policy)`,
          )
        else if (t.policies === 0)
          problemas.push(`${t.tabela}: RLS forçada mas nenhuma policy criada`)
      } else if (!TABELAS_GLOBAIS_PERMITIDAS.has(t.tabela)) {
        problemas.push(
          `${t.tabela}: sem tenant_id e fora da lista de tabelas globais. ` +
            'Adicione tenant_id, ou inclua a tabela na lista em scripts/check-rls.ts justificando.',
        )
      }
    }

    const comTenant = tabelas.filter((t) => t.tem_tenant).length
    const globais = tabelas.length - comTenant

    if (problemas.length > 0) {
      console.error('\nVerificação de RLS falhou:\n')
      for (const p of problemas) console.error(`  - ${p}`)
      console.error(`\n${problemas.length} problema(s) em ${tabelas.length} tabela(s).\n`)
      process.exit(1)
    }

    console.log(
      `RLS conferida: ${comTenant} tabela(s) isolada(s) por tenant, ${globais} global(is). Tudo certo.`,
    )
  } finally {
    await cliente.end()
  }
}

principal().catch((erro: unknown) => {
  console.error('Falha ao verificar RLS:', erro)
  process.exit(1)
})
