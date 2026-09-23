import { CabecalhoPagina } from '@/shared/ui/app-shell'
import { Vazio } from '@/shared/ui/estados'
import { Badge } from '@/shared/ui/badge'
import { redirect } from 'next/navigation'
import { contextoOpcional } from '@/shared/auth/contexto-servidor'

export const metadata = { title: 'Início' }

/**
 * Tela inicial da fase 0: a fundação está no ar, os módulos ainda não.
 * Painéis com indicadores entram na fase 1 (ver skill dashboards).
 */
export default async function InicioPage() {
  // O Next renderiza page e layout em paralelo: sem sessão, esta página roda
  // antes do redirect do layout. Tratar aqui evita cair na fronteira de erro.
  const ctx = await contextoOpcional()
  if (!ctx) redirect('/login')

  const primeiroNome = ctx.nome.split(' ')[0] ?? ctx.nome

  return (
    <>
      <CabecalhoPagina
        titulo={`Bom trabalho, ${primeiroNome}`}
        descricao="Fundação no ar. Os módulos operacionais entram na fase 1."
      />

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao rotulo="Autenticação" situacao="pronto" />
        <Cartao rotulo="Isolamento por empresa" situacao="pronto" />
        <Cartao rotulo="Fila de processos" situacao="pronto" />
        <Cartao rotulo="Módulos operacionais" situacao="fase 1" />
      </section>

      <Vazio
        titulo="Nenhum dado operacional ainda"
        descricao="Cadastros, estoque, produção, vendas e financeiro chegam na fase 1. Até lá, esta tela mostra só o estado da fundação."
      />

      <p className="mt-6 text-xs text-[var(--cor-texto-suave)]">
        Permissões ativas neste acesso: {ctx.permissoes.size}
      </p>
    </>
  )
}

function Cartao({ rotulo, situacao }: { rotulo: string; situacao: 'pronto' | 'fase 1' }) {
  return (
    <div className="rounded-[var(--raio)] border bg-[var(--cor-superficie)] p-4">
      <p className="text-sm font-medium">{rotulo}</p>
      <div className="mt-2">
        <Badge tom={situacao === 'pronto' ? 'sucesso' : 'neutro'}>
          {situacao === 'pronto' ? 'Pronto' : 'Fase 1'}
        </Badge>
      </div>
    </div>
  )
}
