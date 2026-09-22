---
name: onboarding-dev
description: Integração de desenvolvedor novo no KAIROS — ambiente em uma hora, ordem de leitura, primeira tarefa e contexto do negócio. Use ao receber alguém no projeto ou ao retomar o trabalho em outra máquina.
---

# Onboarding de desenvolvedor

Meta: ambiente rodando em uma hora, primeiro PR no segundo dia.

## Ambiente

```bash
git clone <repo> && cd kairos-ERP
cp .env.example .env.local
docker compose up -d          # postgres, minio, mailpit
pnpm install
pnpm prisma migrate deploy
pnpm seed:base && pnpm seed:demo
pnpm dev                      # http://localhost:3000
pnpm worker                   # em outro terminal
```

Requisitos: Node 22, pnpm, Docker. Usuário de demonstração e senha aparecem no fim do
`seed:demo`.

Verificação de que está tudo certo: entrar, abrir um pedido da massa demo, faturar contra
o provedor fiscal simulado e ver a nota autorizada.

## Ordem de leitura

1. `CLAUDE.md` — como se trabalha aqui.
2. `INSTRUCTIONS.md` — o que é o projeto, fases e estado atual.
3. `docs/adr/` — as decisões e por quê (comece pela 0001 a 0004).
4. Skill [erp-architecture] — arquitetura e fronteiras.
5. Skill [domain-driven-design] — vocabulário do negócio. **Não pule**: sem o vocabulário
   da Pure.us, o código não faz sentido.
6. Skill do módulo em que vai trabalhar.

## Contexto do negócio

A Pure.us fabrica e vende cosméticos capilares. O fluxo inteiro é: compra de insumo,
produção com fórmula e lote, estoque com validade, venda por canal, faturamento com nota
fiscal, e financeiro. Três coisas moldam quase toda decisão técnica:

- **lote e validade** são obrigatórios (rastreabilidade e ANVISA);
- **tributação de cosmético** é complexa (ST na maioria das UFs);
- **o dinheiro precisa fechar** — divergência de centavo vira nota rejeitada.

Se possível, passe meio dia acompanhando a operação: expedição separando pedido e o
financeiro conciliando. Vale mais que uma semana lendo código.

## Primeira tarefa

Algo pequeno e real, que atravesse as camadas: um campo novo em cadastro, com migration,
validação, tela e teste. Evite bug de produção e módulo fiscal na primeira semana.

## Comandos do dia a dia

```bash
pnpm dev · pnpm worker
pnpm test · pnpm test:int · pnpm e2e
pnpm lint · pnpm typecheck
pnpm prisma migrate dev --name <nome>
pnpm prisma studio
```

## Combinados

- Branch curta, PR pequeno, revisão de uma pessoa.
- Nada de commit direto em `main`.
- Dúvida de negócio pergunta antes de supor: chutar regra fiscal ou de estoque custa caro.
- Registrou decisão? Vira ADR (ver [adr-writer]).
