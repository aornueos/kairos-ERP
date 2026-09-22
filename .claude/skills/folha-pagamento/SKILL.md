---
name: folha-pagamento
description: Folha de pagamento no KAIROS — escopo adotado (integração com escritório contábil), importação de resultado, provisões, encargos e contabilização. Use ao tratar folha, provisão trabalhista ou encargos.
---

# Folha de pagamento

## Decisão de escopo

O KAIROS **não calcula** a folha. Cálculo de INSS, IRRF, FGTS, rescisão e eSocial muda
com frequência e é responsabilidade do escritório contábil da Pure.us.

O que o KAIROS faz:

1. envia ao contador os eventos do mês (horas, faltas, férias, afastamentos, admissões e
   demissões) vindos de [rh];
2. importa o resultado da folha processada;
3. gera os títulos a pagar;
4. contabiliza por centro de custo;
5. mantém as provisões atualizadas.

Fazer o cálculo internamente exigiria acompanhar legislação trabalhista e tabelas mensais
— custo desproporcional para o porte da empresa. Se um dia mudar, é um ADR.

## Importação

Layout CSV ou XML acordado com o escritório:

```
folha(id, tenant_id, competencia, situacao, importado_em, arquivo_id)
folha_item(folha_id, colaborador_id, evento_codigo, evento_nome, tipo, referencia, valor)
   -- tipo: PROVENTO | DESCONTO | BASE | ENCARGO_EMPRESA
folha_resumo(folha_id, centro_custo_id, proventos, descontos, liquido, encargos)
```

Validações na importação: colaborador existe e está ativo, competência aberta, soma de
proventos menos descontos igual ao líquido, e comparação com a competência anterior com
alerta de variação acima de 20% por colaborador. Importação que não bate não é aceita
pela metade.

## Títulos gerados

| Título | Vencimento |
|---|---|
| Líquido por colaborador (ou total, conforme o pagamento) | 5º dia útil |
| FGTS | dia 20 |
| INSS (GPS/DARF) | dia 20 |
| IRRF retido | conforme tabela |
| Benefícios (VT, VR, plano) | conforme contrato |
| Contribuição sindical, quando houver | conforme acordo |

## Provisões

Calculadas mensalmente por job e contabilizadas: férias mais um terço, 13º salário, e os
encargos sobre as duas. Provisionar mensalmente evita o susto de novembro no caixa e é o
que o [fluxo-caixa] usa na projeção.

## Contabilização

Despesa de pessoal é rateada por centro de custo com base na lotação do colaborador
(ver [centro-de-custo]). Mão de obra direta da produção entra no custo da OP, não em
despesa administrativa — é diferença relevante na margem.

## Acesso

Dados de folha são confidenciais: perfil próprio, sem acesso para gestão comercial ou
produção, e auditoria de leitura. Relatórios gerenciais mostram totais por centro, nunca
salário individual.

## eSocial

Obrigação do escritório contábil. O KAIROS apenas fornece os dados de origem e guarda os
recibos de entrega recebidos, para conferência. Ver [esocial].
