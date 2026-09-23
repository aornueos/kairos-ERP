/**
 * API pública do módulo de cadastros. Nada além deste arquivo sai do módulo
 * (ver skill modular-monolith).
 */
import { criarCasosDeUsoCatalogo } from './application/casos-de-uso'
import { repositorioCatalogoPrisma } from './infra/repositorio-catalogo'

export const catalogo = criarCasosDeUsoCatalogo(repositorioCatalogoPrisma)

export type { LinhaComProdutos, LinhaDTO, NcmDTO, ProdutoDTO } from './application/portas'
export { dun14DoEan, gtinValido } from './domain/gtin'
