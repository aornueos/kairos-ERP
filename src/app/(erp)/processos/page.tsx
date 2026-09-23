import { CabecalhoPagina } from '@/shared/ui/app-shell'
import { Badge } from '@/shared/ui/badge'
import { SemPermissao, Vazio } from '@/shared/ui/estados'
import { contextoDaRequisicao } from '@/shared/auth/contexto-servidor'
import { comTenant } from '@/shared/db/tenant-client'
import { dataHora } from '@/shared/i18n/formato'

export const metadata = { title: 'Processos' }

/**
 * Acompanhamento de eventos e jobs. O usuário do financeiro precisa ver e
 * reprocessar sem abrir chamado (ver skill background-jobs).
 */
export default async function ProcessosPage() {
  const ctx = await contextoDaRequisicao()

  if (!ctx.temPermissao('admin.processos.ler')) {
    return (
      <>
        <CabecalhoPagina titulo="Processos" />
        <SemPermissao acao="acompanhar processos" />
      </>
    )
  }

  const eventos = await comTenant(ctx.tenantId, (tx) =>
    tx.eventoOutbox.findMany({
      orderBy: { ocorridoEm: 'desc' },
      take: 50,
      select: {
        id: true,
        tipo: true,
        agregadoId: true,
        ocorridoEm: true,
        publicadoEm: true,
        tentativas: true,
        ultimoErro: true,
      },
    }),
  )

  return (
    <>
      <CabecalhoPagina
        titulo="Processos"
        descricao="Eventos de domínio aguardando publicação e seus reprocessamentos."
      />

      {eventos.length === 0 ? (
        <Vazio
          titulo="Nenhum evento registrado"
          descricao="Eventos aparecem aqui conforme as operações acontecem no sistema."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--raio)] border bg-[var(--cor-superficie)]">
          <table className="w-full text-sm">
            <caption className="sr-only">Últimos 50 eventos de domínio</caption>
            <thead className="border-b text-left text-xs text-[var(--cor-texto-suave)]">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  Tipo
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Ocorrido em
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Situação
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Tentativas
                </th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{e.tipo}</td>
                  <td className="px-4 py-2">{dataHora(e.ocorridoEm)}</td>
                  <td className="px-4 py-2">
                    {e.publicadoEm ? (
                      <Badge tom="sucesso">Publicado</Badge>
                    ) : e.tentativas > 0 ? (
                      <Badge tom="perigo">Falhou</Badge>
                    ) : (
                      <Badge tom="atencao">Pendente</Badge>
                    )}
                  </td>
                  <td className="numerico px-4 py-2">{e.tentativas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
