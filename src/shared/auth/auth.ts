import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { prisma } from '@/shared/db/client'
import { conferirSenha } from './senha'
import { logger } from '@/shared/observabilidade/logger'
import { env } from '@/shared/config/env'

/**
 * Autenticação com Auth.js v5 (ver skill auth-rbac).
 *
 * Sem login social: usuário de ERP é funcionário cadastrado pelo administrador.
 * Estratégia JWT — não há tabela de sessão; o vínculo é revalidado a cada acesso
 * pelo carregamento de permissões no contexto do servidor.
 */

const MAX_FALHAS = 5
const BLOQUEIO_MINUTOS = 15

const credenciaisSchema = z.object({
  email: z.email('Informe um e-mail válido'),
  senha: z.string().min(1, 'Informe a senha'),
  tenantId: z.uuid().optional(),
})

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      nome: string
      email: string
      tenantId: string
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: env.AUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  trustHost: true,

  providers: [
    Credentials({
      name: 'credenciais',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
        tenantId: { label: 'Empresa', type: 'text' },
      },

      async authorize(brutas) {
        const entrada = credenciaisSchema.safeParse(brutas)
        if (!entrada.success) return null

        const { email, senha, tenantId } = entrada.data

        // Único ponto do sistema que abre o contexto de autenticação.
        // `usuario_tenant` tem RLS por tenant, mas aqui ainda não sabemos qual
        // é o tenant — é justamente essa linha que vai dizer. A policy
        // `autenticacao_vinculo` libera só a leitura, só dentro desta
        // transação (ver migration de init).
        const usuario = await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`select set_config('app.autenticando', 'on', true)`
          return tx.usuario.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: {
              vinculos: {
                where: { situacao: 'ATIVO', tenant: { ativo: true } },
                include: { tenant: { select: { id: true, razaoSocial: true } } },
              },
            },
          })
        })

        // Mensagem idêntica para usuário inexistente e senha errada: não
        // confirmamos quais e-mails existem.
        const generico = () => {
          logger.warn({ email, evento: 'login.falha' }, 'Tentativa de login rejeitada')
          return null
        }

        if (!usuario || !usuario.ativo) return generico()

        if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
          logger.warn(
            { usuarioId: usuario.id, evento: 'login.bloqueado' },
            'Login de usuário temporariamente bloqueado',
          )
          return null
        }

        const senhaConfere = await conferirSenha(senha, usuario.senhaHash)

        if (!senhaConfere) {
          const falhas = usuario.falhasLogin + 1
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
              falhasLogin: falhas,
              bloqueadoAte:
                falhas >= MAX_FALHAS
                  ? new Date(Date.now() + BLOQUEIO_MINUTOS * 60_000)
                  : null,
            },
          })
          return generico()
        }

        if (usuario.vinculos.length === 0) {
          logger.warn(
            { usuarioId: usuario.id, evento: 'login.sem_vinculo' },
            'Usuário sem vínculo ativo com nenhuma empresa',
          )
          return null
        }

        // Com mais de um vínculo, a tela de login manda o tenant escolhido.
        const vinculo = tenantId
          ? usuario.vinculos.find((v) => v.tenantId === tenantId)
          : usuario.vinculos[0]

        if (!vinculo) return generico()

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { falhasLogin: 0, bloqueadoAte: null, ultimoAcessoEm: new Date() },
        })

        logger.info(
          { usuarioId: usuario.id, tenantId: vinculo.tenantId, evento: 'login.sucesso' },
          'Login efetuado',
        )

        // `emailVerified` faz parte do contrato do adapter do Auth.js. Não há
        // fluxo de verificação por e-mail aqui: o usuário é cadastrado pelo
        // administrador do tenant, então o campo fica nulo.
        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          emailVerified: null,
          tenantId: vinculo.tenantId,
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token['nome'] = user.name
        token['tenantId'] = (user as { tenantId: string }).tenantId
      }
      return token
    },

    session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub ?? '',
        nome: (token['nome'] as string) ?? '',
        email: session.user?.email ?? '',
        tenantId: (token['tenantId'] as string) ?? '',
      }
      return session
    },
  },
})
