---
name: dashboards
description: Painéis e indicadores do KAIROS — quais métricas, como calcular, como apresentar e como manter rápido. Use ao criar tela inicial, painel de módulo ou gráfico.
---

# Painéis

Painel de ERP existe para provocar ação, não para decorar. Todo indicador responde
"o que eu faço com isso?" e leva a uma lista filtrada com um clique.

## Painel inicial por perfil

**Diretoria**: faturamento do mês contra meta e mês anterior, margem bruta, saldo em
caixa e projeção 30 dias, inadimplência, top 10 produtos, giro de estoque.

**Financeiro**: a receber vencido e a vencer (7/15/30), a pagar da semana, saldo por
conta, títulos sem baixa há mais de N dias, conciliação pendente.

**Comercial**: pedidos do dia e do mês, ticket médio, pedidos bloqueados por crédito,
clientes sem compra há 60 dias, desconto médio por vendedor.

**Produção e estoque**: OPs em aberto e atrasadas, insumos abaixo do mínimo, lotes a
vencer em 90 dias, cobertura de estoque em dias, perdas do mês.

## Cálculo

Indicador vem de view materializada atualizada por job (ver [caching] e [relatorios-bi]),
nunca de agregação ao vivo sobre tabela transacional. A tela mostra "atualizado às HH:mm"
e permite recalcular sob demanda.

Cada indicador tem definição escrita em `docs/indicadores.md`: fórmula, origem, o que
entra e o que não entra. "Faturamento" com duas definições diferentes em duas telas
destrói a confiança no sistema inteiro — e a discussão vai parar na reunião de diretoria.

## Apresentação

- Número grande com comparação de período e direção da variação (com seta e rótulo, não
  só cor).
- Moeda abreviada com cuidado: `R$ 1,2 mi` no cartão, valor exato no detalhe.
- Gráfico só quando a forma dos dados importa: linha para tendência, barra para
  comparação, sem pizza acima de 5 fatias e sem 3D.
- Máximo 6 cartões e 3 gráficos por painel.
- Todo cartão é clicável e abre a lista correspondente já filtrada.
- Período selecionável no topo, aplicado a todos os elementos, e presente na URL.

Para paleta, eixos e acessibilidade dos gráficos, use a skill `dataviz` antes de
escrever a primeira linha do gráfico.

## Desempenho

Painel carrega em menos de 1,5 s. Cada cartão é um Server Component com Suspense próprio:
o painel aparece em partes, e um cartão lento não segura os outros.

## Armadilhas

- Indicador sem meta ou comparação não informa nada.
- Média que esconde distribuição (ticket médio com um cliente gigante).
- Painel que mostra dado de tenant errado por falta de tenant na chave de cache.
