import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from './utils'

/**
 * Situação de documento. Cor sozinha nunca comunica estado:
 * o rótulo em texto é obrigatório (ver skill accessibility).
 */
const variantes = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tom: {
        neutro: 'border-[var(--cor-borda-forte)] text-[var(--cor-texto-suave)]',
        sucesso: 'border-[var(--cor-sucesso)] text-[var(--cor-sucesso)]',
        atencao: 'border-[var(--cor-atencao)] text-[var(--cor-atencao)]',
        perigo: 'border-[var(--cor-perigo)] text-[var(--cor-perigo)]',
        info: 'border-[var(--cor-info)] text-[var(--cor-info)]',
      },
    },
    defaultVariants: { tom: 'neutro' },
  },
)

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof variantes>

export function Badge({ className, tom, children, ...props }: BadgeProps) {
  return (
    <span className={cn(variantes({ tom }), className)} {...props}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}
