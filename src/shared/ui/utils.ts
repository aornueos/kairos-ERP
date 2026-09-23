import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Junta classes resolvendo conflitos do Tailwind. */
export function cn(...entradas: ClassValue[]): string {
  return twMerge(clsx(entradas))
}
