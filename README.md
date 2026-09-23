# KAIROS

ERP da **Pure.us**, indústria de cosméticos capilares. Cobre o ciclo completo:
compra de insumo, produção com fórmula e lote, estoque com validade, venda, faturamento
fiscal e financeiro.

Estado: **fase 0 (fundação) concluída**. Os módulos operacionais entram na fase 1 —
ver [INSTRUCTIONS.md](INSTRUCTIONS.md).

## Rodar em cinco minutos

Requisitos: Node 22+, pnpm, Docker.

```bash
cp .env.example .env.local
docker compose up -d
pnpm install
pnpm db:deploy
pnpm seed:base       # imprime a senha do admin uma única vez
pnpm dev             # http://localhost:3000
pnpm worker          # em outro terminal
```

Sem Docker na máquina? Ver [docs/operacao/postgres-sem-docker.md](docs/operacao/postgres-sem-docker.md).

## Verificação

```bash
pnpm verify          # lint + tipos + testes unitários
pnpm test:int        # integração (precisa de banco)
pnpm e2e             # jornadas críticas
pnpm check:rls       # isolamento por tenant
```

Roteiro manual, passo a passo: [docs/operacao/testar-fase-0.md](docs/operacao/testar-fase-0.md).

## Estrutura

```
src/app/         rotas e telas
src/modules/     contextos delimitados (domain, application, infra, ui)
src/shared/      auth, banco, erros, dinheiro, i18n, ui, config
src/workers/     processos em background (pg-boss)
prisma/          schema por contexto, migrations e seeds
docs/adr/        decisões arquiteturais
.claude/skills/  97 skills de projeto com as regras de cada área
```

## Por onde começar

1. [CLAUDE.md](CLAUDE.md) — como se trabalha aqui
2. [INSTRUCTIONS.md](INSTRUCTIONS.md) — o projeto, as fases e o estado atual
3. [docs/adr/](docs/adr/) — as decisões e o porquê
4. Skill `onboarding-dev` — roteiro completo para quem chega
