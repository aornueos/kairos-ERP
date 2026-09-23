'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from './utils'

type CampoProps = Omit<ComponentProps<'input'>, 'id'> & {
  rotulo: string
  /** Instrução de formato. Aparece antes do erro, não depois. */
  ajuda?: ReactNode
  erro?: string
  obrigatorio?: boolean
}

/**
 * Campo de formulário com rótulo real, ajuda e erro ligados por aria.
 * Placeholder nunca substitui rótulo (ver skill accessibility).
 */
export function Campo({
  rotulo,
  ajuda,
  erro,
  obrigatorio,
  className,
  ...props
}: CampoProps) {
  const id = useId()
  const idAjuda = `${id}-ajuda`
  const idErro = `${id}-erro`

  const descrito = [ajuda ? idAjuda : null, erro ? idErro : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-[var(--cor-texto-suave)]">
        {rotulo}
        {obrigatorio ? (
          <span className="ml-0.5 text-[var(--cor-perigo)]" aria-hidden>
            *
          </span>
        ) : null}
      </label>

      {ajuda ? (
        <p id={idAjuda} className="text-xs text-[var(--cor-texto-suave)]">
          {ajuda}
        </p>
      ) : null}

      <input
        id={id}
        aria-required={obrigatorio || undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descrito || undefined}
        className={cn(
          'h-[var(--campo-altura)] rounded-[var(--raio)] border bg-[var(--cor-superficie)] px-3 text-sm',
          'placeholder:text-[var(--cor-texto-suave)]',
          erro ? 'border-[var(--cor-perigo)]' : 'border-[var(--cor-borda-forte)]',
          className,
        )}
        {...props}
      />

      {erro ? (
        <p id={idErro} role="alert" className="text-xs text-[var(--cor-perigo)]">
          {erro}
        </p>
      ) : null}
    </div>
  )
}
