import Link from 'next/link'
import { Botao } from '@/shared/ui/botao'
import { Vazio } from '@/shared/ui/estados'

export default function NaoEncontrado() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Vazio
          titulo="Página não encontrada"
          descricao="O endereço não existe ou o registro não está disponível para a sua empresa."
          acao={
            <Botao variante="secundario" comoFilho>
              <Link href="/">Voltar ao início</Link>
            </Botao>
          }
        />
      </div>
    </div>
  )
}
