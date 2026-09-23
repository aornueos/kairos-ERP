import './load-env'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  // Pasta: todo arquivo .prisma abaixo dela é carregado (um por contexto delimitado).
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/base/index.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
})
