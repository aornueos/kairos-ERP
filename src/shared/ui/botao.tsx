import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from './utils'

const variantes = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--raio)] text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        primario:
          'bg-[var(--cor-marca)] text-[var(--cor-marca-contraste)] hover:opacity-90',
        secundario:
          'border border-[var(--cor-borda-forte)] bg-[var(--cor-superficie)] text-[var(--cor-texto)] hover:bg-[var(--cor-superficie-suave)]',
        sutil:
          'text-[var(--cor-texto-suave)] hover:bg-[var(--cor-superficie-suave)] hover:text-[var(--cor-texto)]',
        perigo: 'bg-[var(--cor-perigo)] text-white hover:opacity-90',
      },
      tamanho: {
        padrao: 'h-[var(--campo-altura)] px-4',
        pequeno: 'h-8 px-3 text-xs',
        icone: 'h-[var(--campo-altura)] w-[var(--campo-altura)]',
      },
    },
    defaultVariants: { variante: 'secundario', tamanho: 'padrao' },
  },
)

type BotaoProps = ComponentProps<'button'> &
  VariantProps<typeof variantes> & {
    /** Bloqueia o clique e mostra progresso. Evita duplo lançamento. */
    carregando?: boolean
    comoFilho?: boolean
  }

export function Botao({
  className,
  variante,
  tamanho,
  carregando = false,
  comoFilho = false,
  disabled,
  children,
  ...props
}: BotaoProps) {
  // Slot exige exatamente um filho: com `comoFilho` o conteúdo passa direto,
  // sem o indicador de carregamento (quem envolve um Link não fica "enviando").
  if (comoFilho) {
    return (
      <Slot className={cn(variantes({ variante, tamanho }), className)} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button
      className={cn(variantes({ variante, tamanho }), className)}
      disabled={disabled ?? carregando}
      aria-busy={carregando || undefined}
      {...props}
    >
      {carregando ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
}

export { variantes as variantesBotao }
