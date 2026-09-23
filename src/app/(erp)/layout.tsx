import { redirect } from 'next/navigation'
import { AppShell } from '@/shared/ui/app-shell'
import { contextoOpcional } from '@/shared/auth/contexto-servidor'
import { prisma } from '@/shared/db/client'

/**
 * Layout autenticado. A verificação aqui é de navegação; a decisão de
 * autorização que importa acontece no caso de uso (ver skill auth-rbac).
 */
export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const ctx = await contextoOpcional()

  if (!ctx) redirect('/login')

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { razaoSocial: true, nomeFantasia: true },
  })

  return (
    <AppShell
      usuario={{ nome: ctx.nome, email: ctx.email }}
      empresa={tenant?.nomeFantasia ?? tenant?.razaoSocial ?? 'Empresa'}
    >
      {children}
    </AppShell>
  )
}
