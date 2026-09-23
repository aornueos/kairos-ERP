import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Imagem de produção enxuta (ver skill docker).
  output: 'standalone',

  // Pacotes nativos que não devem ser empacotados pelo bundler do servidor.
  serverExternalPackages: ['@node-rs/argon2', 'pg-boss', 'pino'],

  typescript: {
    // Erro de tipo derruba o build. Nunca ligue ignoreBuildErrors.
    ignoreBuildErrors: false,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ]
  },
}

export default nextConfig
