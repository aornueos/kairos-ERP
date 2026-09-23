import { pino } from 'pino'
import { env, ehProducao } from '@/shared/config/env'

/**
 * Log estruturado (ver skill observability-logs).
 * Objeto primeiro, mensagem depois. Nada de string concatenada.
 *
 * Campos proibidos são removidos automaticamente: senha, token, certificado,
 * chave PIX, CSC. Dado pessoal não entra em log de aplicação.
 */
const camposCensurados = [
  'senha',
  'senhaHash',
  'senha_hash',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'certificado',
  'certificadoSenha',
  'csc',
  'chavePix',
  'secret',
  'AUTH_SECRET',
  'clientSecret',
  '*.senha',
  '*.token',
  '*.secret',
  'req.headers.authorization',
  'req.headers.cookie',
]

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: { paths: camposCensurados, censor: '[removido]' },
  base: { app: 'kairos', ambiente: env.KAIROS_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  ...(ehProducao
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,app',
          },
        },
      }),
})

export type Logger = typeof logger

/** Logger com os campos de correlação já fixados. */
export function loggerDe(campos: Record<string, unknown>): Logger {
  return logger.child(campos) as Logger
}
