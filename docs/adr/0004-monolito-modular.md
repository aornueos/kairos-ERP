# 0004 — Monolito modular; microsserviços rejeitados

- Status: aceito
- Data: 2026-09-22
- Decisores: Raul (produto e engenharia)

## Contexto

Um ERP cobre muitos domínios: estoque, produção, vendas, fiscal, financeiro,
contabilidade. É tentador separar cada um em serviço próprio. A equipe, no entanto, é de
uma a duas pessoas, e o volume esperado é de dezenas de usuários e milhares de documentos
por mês.

Consistência entre módulos é requisito duro: faturar um pedido precisa baixar estoque e
gerar títulos sem deixar estado pela metade.

## Decisão

Monolito modular: um processo de aplicação, um banco, módulos separados por convenção e
garantidos por lint.

- Cada contexto vive em `src/modules/<contexto>` com `domain`, `application`, `infra` e
  `ui`.
- A API pública de um módulo é apenas o `index.ts`; o resto é privado.
- Comunicação entre contextos por chamada ao caso de uso público ou por evento de domínio
  gravado em outbox na mesma transação.
- Regras de fronteira aplicadas por `no-restricted-imports` no ESLint, e não apenas por
  acordo verbal.
- Exceção única e documentada: o caso de uso de faturamento coordena estoque, fiscal e
  financeiro numa transação compartilhada, por exigência de consistência.

Microsserviços ficam rejeitados enquanto pelo menos dois destes não forem verdade para um
módulo: perfil de carga muito distinto, time próprio, ou SLA de disponibilidade diferente.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Microsserviços por domínio | consistência distribuída, mais infraestrutura e observabilidade, custo incompatível com a equipe |
| Monolito sem módulos | vira novelo em poucos meses; toda mudança fiscal respinga em vendas |
| Serverless por função | transação e conexões de banco ficam problemáticas para carga de ERP |

## Consequências

Positivas: transação local resolve consistência; depuração simples; deploy único;
refatoração entre módulos barata enquanto as fronteiras são respeitadas.

Negativas: a fronteira depende de disciplina e de lint — se o lint for desligado, a
erosão é rápida. Escalar significa escalar tudo junto. A extração futura de um módulo
exige que a comunicação já esteja por eventos, e por isso a outbox existe desde o início.

## Revisão

Revisitar quando um módulo tiver perfil de carga claramente distinto (por exemplo,
integração de marketplace com alto volume) ou quando houver mais de um time.
