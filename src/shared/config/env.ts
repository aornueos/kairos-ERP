import { z } from 'zod'

/**
 * Configuração de infraestrutura. Parâmetro de negócio NÃO mora aqui:
 * vai para a tabela `parametro`, por tenant (ver skill env-config).
 *
 * Falta de variável derruba o processo na inicialização, com mensagem clara.
 * Descobrir variável faltando no meio do faturamento é muito pior.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  KAIROS_ENV: z.enum(['dev', 'homolog', 'prod']).default('dev'),
  TZ: z.string().default('America/Sao_Paulo'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET precisa de no mínimo 32 caracteres'),
  AUTH_URL: z.url().optional(),

  S3_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('kairos'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  FISCAL_PROVEDOR: z
    .enum(['simulado', 'focus', 'plugnotas', 'nfeio'])
    .default('simulado'),
  FISCAL_PROVEDOR_URL: z.url().optional(),
  FISCAL_PROVEDOR_TOKEN: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_REMETENTE: z.string().optional(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SENTRY_DSN: z.url().optional(),
})

export type Env = z.infer<typeof schema>

function carregar(): Env {
  const resultado = schema.safeParse(process.env)

  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(
      `Configuração inválida. Corrija o .env.local e tente de novo:\n${problemas}`,
    )
  }

  return resultado.data
}

export const env: Env = carregar()

export const ehProducao = env.KAIROS_ENV === 'prod'
export const ehDesenvolvimento = env.KAIROS_ENV === 'dev'
