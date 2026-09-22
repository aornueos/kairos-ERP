---
name: projetos
description: Módulo de projetos do KAIROS — desenvolvimento de novos produtos (P&D de fórmulas), lançamentos e iniciativas internas, com custo e prazo. Use ao controlar projeto, apropriar custo de P&D ou acompanhar lançamento de linha.
---

# Projetos

Fase 3. O caso real da Pure.us é desenvolvimento de produto: criar uma linha nova de
cosmético capilar envolve formulação, testes, registro, embalagem e lançamento comercial,
com custo que hoje se perde em despesas gerais.

## Entidades

```
projeto(id, tenant_id, codigo, nome, tipo, responsavel_id, centro_custo_id,
        inicio, previsao_fim, fim_real, orcamento, situacao)
   -- tipo: DESENVOLVIMENTO_PRODUTO | MELHORIA_PROCESSO | INFRAESTRUTURA | MARKETING
etapa(id, projeto_id, nome, ordem, previsao_inicio, previsao_fim, situacao, entregavel)
tarefa(id, etapa_id, titulo, responsavel_id, prazo, situacao, horas_estimadas, horas_reais)
projeto_custo(id, projeto_id, tipo, documento_id, valor, competencia)
   -- tipo: MATERIAL | HORAS | SERVICO_TERCEIRO | TAXA_REGULATORIA | OUTROS
```

## Etapas típicas de um produto novo

```
Briefing -> Formulação -> Bancada e testes -> Estabilidade e compatibilidade
-> Teste de segurança/eficácia -> Registro ou notificação ANVISA
-> Arte e embalagem -> Lote piloto -> Precificação -> Lançamento
```

O lote piloto é uma OP normal em [producao-pcp], marcada com o projeto: consumo de
insumo, horas e perdas ficam apropriados ao projeto, não ao custo do produto vendido.

## Custo e orçamento

Todo custo apropriado ao projeto vem de documento real: requisição de insumo, título a
pagar, horas apontadas, taxa regulatória. Comparação orçado contra realizado por etapa,
com alerta em 80% e 100% do orçamento.

Na conclusão, o custo total do projeto é o número que embasa a precificação da linha e
o retorno esperado. Sem isso, preço de produto novo é achismo.

## Regulatório

Cosmético exige notificação ou registro na ANVISA conforme o grau de risco. O projeto
guarda protocolo, data, validade e documentos. Produto sem regularização concluída não
pode ser liberado para venda: o cadastro do produto fica bloqueado para faturamento até
a etapa ser marcada como concluída.

## Acompanhamento

Quadro por etapa, linha do tempo simples e lista de tarefas atrasadas. Sem gráfico de
Gantt completo na fase 1 — a equipe é pequena e a complexidade não se paga.

## Integração

Projeto concluído que gera produto novo cria o cadastro do produto já com fórmula, custo
de referência e documentação anexada, evitando redigitação e perda de histórico.
