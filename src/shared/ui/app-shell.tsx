import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  Boxes,
  ClipboardList,
  Factory,
  FileText,
  Home,
  Landmark,
  ListChecks,
  ShoppingCart,
} from 'lucide-react'
import { cn } from './utils'

/**
 * Casca da aplicação: barra lateral, topo e conteúdo.
 * Três tipos de tela existem no KAIROS — lista, documento e painel.
 * Fluxo novo cabe em um deles (ver skill ui-components).
 */

type ItemMenu = {
  href: string
  rotulo: string
  Icone: typeof Home
  /** Módulo ainda não implementado: aparece desabilitado, não escondido. */
  fase?: number
}

const MENU: ItemMenu[] = [
  { href: '/', rotulo: 'Início', Icone: Home },
  { href: '/cadastros', rotulo: 'Cadastros', Icone: ClipboardList, fase: 1 },
  { href: '/estoque', rotulo: 'Estoque', Icone: Boxes, fase: 1 },
  { href: '/compras', rotulo: 'Compras', Icone: ShoppingCart, fase: 1 },
  { href: '/producao', rotulo: 'Produção', Icone: Factory, fase: 1 },
  { href: '/vendas', rotulo: 'Vendas', Icone: FileText, fase: 1 },
  { href: '/financeiro', rotulo: 'Financeiro', Icone: Landmark, fase: 1 },
  { href: '/processos', rotulo: 'Processos', Icone: ListChecks },
]

export function AppShell({
  children,
  usuario,
  empresa,
}: {
  children: ReactNode
  usuario: { nome: string; email: string }
  empresa: string
}) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-[var(--cor-superficie)] focus:px-3 focus:py-2"
      >
        Ir para o conteúdo
      </a>

      <nav
        aria-label="Módulos"
        className="hidden w-56 shrink-0 flex-col border-r bg-[var(--cor-superficie)] md:flex"
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="text-base font-semibold tracking-tight">KAIROS</span>
        </div>

        <ul className="flex flex-1 flex-col gap-0.5 p-2">
          {MENU.map(({ href, rotulo, Icone, fase }) => (
            <li key={href}>
              {fase ? (
                <span
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-[var(--raio)] px-3 py-2 text-sm text-[var(--cor-texto-suave)] opacity-55"
                  title={`Disponível na fase ${fase}`}
                >
                  <Icone className="size-4 shrink-0" aria-hidden />
                  {rotulo}
                  <span className="ml-auto text-[10px] uppercase">fase {fase}</span>
                </span>
              ) : (
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-[var(--raio)] px-3 py-2 text-sm',
                    'hover:bg-[var(--cor-superficie-suave)]',
                  )}
                >
                  <Icone className="size-4 shrink-0" aria-hidden />
                  {rotulo}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="border-t px-4 py-3 text-xs text-[var(--cor-texto-suave)]">
          {empresa}
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-[var(--cor-superficie)] px-4">
          <span className="text-sm font-medium md:hidden">KAIROS</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm leading-tight font-medium">{usuario.nome}</p>
              <p className="text-xs leading-tight text-[var(--cor-texto-suave)]">
                {usuario.email}
              </p>
            </div>
          </div>
        </header>

        <main id="conteudo" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export function CabecalhoPagina({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string
  descricao?: string
  acoes?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
        {descricao ? (
          <p className="mt-1 text-sm text-[var(--cor-texto-suave)]">{descricao}</p>
        ) : null}
      </div>
      {acoes ? <div className="flex gap-2">{acoes}</div> : null}
    </div>
  )
}
