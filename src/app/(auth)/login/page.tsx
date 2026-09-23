'use client'

import { useActionState } from 'react'
import { Botao } from '@/shared/ui/botao'
import { Campo } from '@/shared/ui/campo'
import { entrar, type EstadoLogin } from './acoes'

const INICIAL: EstadoLogin = {}

export default function LoginPage() {
  const [estado, acao, enviando] = useActionState(entrar, INICIAL)

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">KAIROS</h1>
          <p className="mt-1 text-sm text-[var(--cor-texto-suave)]">
            Sistema de gestão da Pure.us
          </p>
        </div>

        <form
          action={acao}
          className="flex flex-col gap-4 rounded-[var(--raio)] border bg-[var(--cor-superficie)] p-6"
        >
          {estado.erro ? (
            <p
              role="alert"
              className="rounded-[var(--raio)] border border-[var(--cor-perigo)] px-3 py-2 text-sm text-[var(--cor-perigo)]"
            >
              {estado.erro}
            </p>
          ) : null}

          <Campo
            rotulo="E-mail"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            obrigatorio
            required
          />

          <Campo
            rotulo="Senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            obrigatorio
            required
          />

          <Botao type="submit" variante="primario" carregando={enviando}>
            Entrar
          </Botao>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--cor-texto-suave)]">
          Acesso restrito. Problemas para entrar? Fale com o administrador.
        </p>
      </div>
    </main>
  )
}
