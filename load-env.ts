import { config } from 'dotenv'

/**
 * Carrega variáveis de ambiente na mesma precedência do Next.js:
 * .env.local sobrescreve .env. O Next faz isso sozinho; scripts fora dele
 * (Prisma CLI, seeds, workers, check-rls) precisam deste import.
 */
config({ path: '.env.local', quiet: true })
config({ path: '.env', quiet: true })
