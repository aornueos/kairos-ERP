---
name: changelog
description: Changelog e versionamento do KAIROS — formato, versionamento, changelog técnico e de usuário, e notas de release. Use ao fechar uma versão ou registrar mudança relevante.
---

# Changelog

Dois públicos, dois documentos, uma fonte:

- `CHANGELOG.md` — técnico, por versão, gerado dos commits.
- `docs/novidades.md` — para a equipe da Pure.us, em linguagem de usuário.

## Versionamento

`MAJOR.MINOR.PATCH`, adaptado a um ERP interno:

| Parte | Quando sobe |
|---|---|
| MAJOR | mudança que exige ação do usuário ou migração de dados relevante |
| MINOR | módulo ou funcionalidade nova, compatível |
| PATCH | correção e ajuste interno |

A versão da API é independente (ver [api-versioning]).

## Commits convencionais

```
feat(estoque): controle de validade por lote
fix(faturamento): rateio de desconto deixando diferença de centavo
perf(relatorios): materializa DRE mensal
docs(fiscal): parâmetros de ICMS-ST para cosméticos
refactor(vendas): extrai cálculo de comissão para o domínio
```

Escopo é o módulo. `BREAKING CHANGE:` no rodapé quando houver. O changelog técnico sai
disso automaticamente; o de usuário é escrito à mão.

## Formato (Keep a Changelog)

```markdown
## [1.4.0] - 2026-09-22

### Adicionado
- Controle de validade por lote com bloqueio de venda de lote vencido (#142)

### Corrigido
- Rateio de desconto deixava diferença de um centavo, rejeitando a NF-e (#150)

### Alterado
- Reserva de estoque passa a expirar em 72 horas (antes, 24)

### Atenção
- Requer migration. Executar antes de subir o app.
```

A seção "Atenção" é a que o responsável pelo deploy lê primeiro.

## Changelog de usuário

Mesma versão, outra linguagem, com foco no efeito prático:

```markdown
## Setembro/2026

**Validade de lote**: o sistema agora bloqueia a venda de lote vencido e sugere sempre o
lote que vence primeiro. Se precisar usar outro lote, informe o motivo.

**Reserva de pedido**: pedidos confirmados seguram o estoque por 72 horas (antes eram 24).
Depois disso, o saldo volta para venda e o vendedor é avisado.
```

Publicado na tela de novidades dentro do sistema, e não só em arquivo — usuário não abre
repositório.

## Nota de release

Toda tag gera nota com: versão, data, responsável, itens do changelog, migrations
incluídas e link para o checklist de deploy executado (ver [deploy-checklist]).
