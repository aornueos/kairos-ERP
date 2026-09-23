'use client'

import { useEffect } from 'react'
import { Botao } from '@/shared/ui/botao'
import { Erro } from '@/shared/ui/estados'

/**
 * Fronteira de erro da aplicação. Mostra o identificador para o suporte
 * localizar o caso no log. Nunca exibe stack, SQL ou nome de tabela.
 */
export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // O log estruturado do servidor já registrou o detalhe; aqui fica só a
    // correlação pelo digest.
    console.error('Falha na tela', { digest: error.digest })
  }, [error])

  return (
    <div className="p-6">
      <Erro
        titulo="Algo deu errado nesta tela"
        descricao="A operação não foi concluída. Tente novamente; se continuar, informe o código abaixo ao suporte."
        errorId={error.digest}
        acao={
          <Botao variante="secundario" onClick={reset}>
            Tentar novamente
          </Botao>
        }
      />
    </div>
  )
}
