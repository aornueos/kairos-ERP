---
name: performance-testing
description: Testes de desempenho e carga no KAIROS — metas, cenários, massa de dados realista e diagnóstico. Use ao validar desempenho antes de release, ou ao investigar lentidão relatada.
---

# Testes de desempenho

Meça com massa realista. ERP que voa com 100 registros e trava com 500 mil é o padrão de
falha mais comum.

## Metas

| Operação | Alvo (p95) |
|---|---|
| Carregar lista com filtro | 400 ms |
| Abrir documento | 600 ms |
| Salvar pedido com 20 itens | 800 ms |
| Faturar pedido (sem chamada fiscal) | 1,5 s |
| Painel inicial completo | 1,5 s |
| Relatório mensal (job) | 60 s |
| Importação de 10 mil linhas | 3 min |

Meta sem medição é desejo. Registre o resultado de cada release em
`docs/operacao/desempenho.md` para comparar.

## Massa realista

Script que gera volume compatível com 3 anos de operação da Pure.us:

```
200 produtos, 1.500 insumos e embalagens
800 parceiros
60 mil pedidos, 250 mil itens
55 mil notas fiscais
400 mil movimentos de estoque, 15 mil lotes
120 mil títulos, 200 mil movimentos financeiros
2 mil ordens de produção
```

Gere com distribuição parecida com a real (sazonalidade, concentração em poucos clientes),
não uniforme. Dado uniforme engana o planejador de consultas e o teste passa sem
significado.

## Cenários de carga

k6 ou Artillery contra ambiente de homologação:

1. **Dia normal**: 15 usuários simultâneos navegando e lançando.
2. **Pico de faturamento**: 200 pedidos faturados em lote enquanto outros usuários
   trabalham.
3. **Fechamento**: relatórios pesados e conciliação rodando junto com a operação.
4. **Importação grande**: 50 mil linhas durante o expediente.

O que se observa: tempo de resposta das telas durante o pico, uso de conexões do pool,
crescimento da fila de jobs e tempo de espera de lock.

## Diagnóstico

`pg_stat_statements` para as consultas mais caras, `explain (analyze, buffers)` na
suspeita, e traços de OpenTelemetry para ver onde o tempo foi (ver
[observability-logs] e [query-optimization]).

Sinais típicos: N+1 em listagem, falta de índice com `tenant_id`, agregação ao vivo em
tabela transacional, pool esgotado por transação longa, job pesado concorrendo com a
operação em horário comercial.

## Regressão

O CI mede o tempo de um conjunto pequeno de consultas críticas contra massa fixa e falha
se piorar mais de 30% em relação à referência. Não substitui o teste de carga, mas pega o
`select` sem índice antes do merge.
