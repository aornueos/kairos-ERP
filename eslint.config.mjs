import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import next from 'eslint-config-next'

/**
 * Regras do KAIROS. As de fronteira entre módulos não são estilo: são o que
 * segura o monolito modular (ADR-0004). Desligá-las erode a arquitetura em
 * semanas.
 *
 * O plugin jsx-a11y já vem registrado pelo eslint-config-next; registrar de
 * novo quebra a configuração.
 */

/** Fronteiras do monolito modular: um módulo só é consumido pelo index.ts. */
const fronteirasDeModulo = {
  patterns: [
    {
      group: ['@/modules/*/domain/*', '@/modules/*/application/*', '@/modules/*/infra/*'],
      message:
        'Importe apenas o index.ts público do módulo (ver skill modular-monolith).',
    },
  ],
}

/** Prisma só dentro de infra/, shared/db e workers. */
const prismaRestrito = {
  paths: [
    {
      name: '@/shared/db/client',
      message: 'Acesso ao Prisma só dentro de infra/ (ver skill erp-architecture).',
    },
  ],
}

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'src/generated/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'prisma/migrations/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next,

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      // consistent-type-imports exigiria linting com informação de tipos, que
      // conflita com o parser do eslint-config-next. Fica de fora até o
      // typescript-eslint e o Next convergirem; é regra de estilo, não de defeito.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // Acessibilidade: o plugin vem do eslint-config-next.
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-autofocus': 'off',
    },
  },

  // Aplicação: fronteiras de módulo e Prisma restrito, na mesma regra —
  // dois blocos com a mesma chave fariam o último sobrescrever o anterior.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { ...fronteirasDeModulo, ...prismaRestrito }],
    },
  },

  // Camadas autorizadas a falar com o banco.
  {
    files: [
      'src/modules/*/infra/**/*.ts',
      'src/shared/db/**/*.ts',
      'src/shared/auth/**/*.ts',
      'src/workers/**/*.ts',
      'src/app/api/health/**/*.ts',
      'src/app/**/layout.tsx',
    ],
    rules: {
      'no-restricted-imports': ['error', fronteirasDeModulo],
    },
  },

  // Scripts, seeds e testes: console liberado e sem restrição de import.
  {
    files: [
      'scripts/**/*.ts',
      'prisma/**/*.ts',
      'tests/**/*.ts',
      '*.config.{ts,mjs}',
      'load-env.ts',
    ],
    rules: {
      'no-console': 'off',
      'no-restricted-imports': 'off',
    },
  },
)
