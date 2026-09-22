---
name: adr-writer
description: Escrever Architecture Decision Record no KAIROS. Use ao escolher tecnologia, mudar fronteira de módulo, adotar padrão que vale para todo o projeto, ou registrar a rejeição de uma proposta.
---

# ADR

Decisão que afeta mais de um módulo, custa caro para reverter ou já foi discutida duas
vezes vira ADR. Arquivo em `docs/adr/NNNN-titulo-em-kebab.md`, numeração sequencial,
nunca reaproveitada.

## Modelo

```markdown
# NNNN — Título afirmativo da decisão

- Status: proposto | aceito | rejeitado | substituído por ADR-NNNN
- Data: AAAA-MM-DD
- Decisores: nomes

## Contexto

O problema, as restrições reais (prazo, equipe, custo, obrigação fiscal) e o que já foi
tentado. Sem justificar a decisão ainda.

## Decisão

O que passa a valer, em voz ativa e no presente.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|

## Consequências

Positivas e negativas. Inclua o que fica mais difícil a partir de agora e o custo
estimado de reverter.

## Revisão

Quando revisitar (evento ou data) e qual sinal indicaria que a decisão envelheceu.
```

## Regras

- ADR aceito é imutável. Mudou de ideia? Novo ADR com "substitui ADR-NNNN", e o antigo
  passa a "substituído por".
- Registre também o que foi rejeitado: evita rediscutir microsserviço, NoSQL e emissão
  fiscal própria a cada trimestre.
- Uma decisão por ADR.
- Máximo duas páginas. Se não cabe, a decisão está mal delimitada.

## ADRs existentes

| # | Decisão |
|---|---|
| 0001 | Stack Next.js 15 + Prisma + PostgreSQL |
| 0002 | Emissão fiscal via provedor externo |
| 0003 | Multi-tenancy por `tenant_id` com RLS |
| 0004 | Monolito modular; microsserviços rejeitados |

Consulte antes de propor algo que os contradiga.
