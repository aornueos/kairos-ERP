import { AlertTriangle, Inbox, Loader2, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './utils'

/**
 * Os quatro estados que toda tela que busca dado precisa tratar
 * (ver skill ui-components). Faltar um deles reprova em revisão.
 */

function Moldura({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--raio)] border border-dashed p-10 text-center',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Carregando({ rotulo = 'Carregando' }: { rotulo?: string }) {
  return (
    <Moldura>
      <Loader2
        className="size-5 animate-spin text-[var(--cor-texto-suave)]"
        aria-hidden
      />
      <p className="text-sm text-[var(--cor-texto-suave)]" role="status">
        {rotulo}
      </p>
    </Moldura>
  )
}

export function Vazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  /** Diga o caminho de saída: "Limpe os filtros", "Cadastre o primeiro". */
  descricao?: string
  acao?: ReactNode
}) {
  return (
    <Moldura>
      <Inbox className="size-6 text-[var(--cor-texto-suave)]" aria-hidden />
      <div>
        <p className="font-medium">{titulo}</p>
        {descricao ? (
          <p className="mt-1 text-sm text-[var(--cor-texto-suave)]">{descricao}</p>
        ) : null}
      </div>
      {acao}
    </Moldura>
  )
}

export function Erro({
  titulo = 'Não foi possível carregar',
  descricao,
  errorId,
  acao,
}: {
  titulo?: string
  descricao?: string
  /** Mostrado ao usuário para que o suporte ache o caso no log. */
  errorId?: string
  acao?: ReactNode
}) {
  return (
    <Moldura className="border-[var(--cor-perigo)]">
      <AlertTriangle className="size-6 text-[var(--cor-perigo)]" aria-hidden />
      <div>
        <p className="font-medium">{titulo}</p>
        {descricao ? (
          <p className="mt-1 text-sm text-[var(--cor-texto-suave)]">{descricao}</p>
        ) : null}
        {errorId ? (
          <p className="mt-2 font-mono text-xs text-[var(--cor-texto-suave)]">
            Código: {errorId}
          </p>
        ) : null}
      </div>
      {acao}
    </Moldura>
  )
}

export function SemPermissao({ acao }: { acao?: string }) {
  return (
    <Moldura>
      <Lock className="size-6 text-[var(--cor-texto-suave)]" aria-hidden />
      <div>
        <p className="font-medium">Acesso não autorizado</p>
        <p className="mt-1 text-sm text-[var(--cor-texto-suave)]">
          {acao
            ? `Seu perfil não permite ${acao}.`
            : 'Seu perfil não permite acessar esta tela.'}{' '}
          Fale com o administrador do sistema.
        </p>
      </div>
    </Moldura>
  )
}
