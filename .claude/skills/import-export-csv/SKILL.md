---
name: import-export-csv
description: Importação e exportação de planilhas no KAIROS — modelo, validação em duas fases, relatório de erros, migração inicial e exportação com filtros. Use ao implementar carga de dados ou saída para planilha.
---

# Importação e exportação

Ferramenta crítica na migração e no dia a dia: a empresa vem de planilhas e vai continuar
trocando planilhas com contador, representantes e fornecedores.

## Importação

Fluxo em duas fases, sempre:

```
upload -> análise (valida tudo, não grava nada) -> prévia com erros e avisos
 -> confirmação do usuário -> gravação em job -> relatório final
```

Nunca grave direto. Importação que falha no meio deixa metade dos dados dentro e ninguém
sabe o que entrou.

### Modelo de arquivo

Cada importação tem um modelo baixável (`.xlsx` com cabeçalho, tipos e uma aba de
instruções). Aceite CSV (`;` ou `,`, UTF-8 e Latin-1) e XLSX. Detecte o separador e a
codificação; usuário não deveria precisar saber o que é BOM.

### Validação

- Formato e tipo por coluna, com mensagem por linha e por campo.
- Regras de negócio: produto existe, unidade compatível, CNPJ válido, duplicidade dentro
  do próprio arquivo.
- Limite de tamanho (25 MB) e de linhas por importação (50 mil); acima disso, divida.
- Resultado da análise: quantas linhas válidas, com aviso e com erro, e download do
  arquivo de erros com a coluna "motivo" adicionada — o usuário corrige nele mesmo e
  reenvia.

### Gravação

Job com progresso, em lotes de mil linhas, cada lote em sua transação. Falha em um lote
não desfaz os anteriores, e o relatório final diz exatamente o que entrou. Idempotência
por hash do arquivo mais número da linha: reenviar o mesmo arquivo não duplica.

## Importações previstas

Produtos, parceiros, tabela de preços, saldo inicial de estoque, títulos em aberto, plano
de contas, colaboradores, extrato bancário (OFX/CSV), pedidos de canal externo.

## Migração inicial

Ordem obrigatória, respeitando dependências:

```
1. tabelas de domínio (seed base)   2. plano de contas e centros de custo
3. produtos e insumos               4. parceiros
5. tabelas de preço                 6. saldos de estoque com lote e validade
7. títulos em aberto                8. saldos bancários iniciais
```

Cada etapa é conferida por totais antes da seguinte: quantidade de itens, soma de saldos,
soma de títulos. Migração sem conferência de totais é como o ERP começa errado e nunca
mais se acerta.

## Exportação

Respeita filtros, colunas e ordenação da tela (ver [data-tables]). Formatação pt-BR, com
cabeçalho de empresa, relatório, filtros e data. Acima de 5 mil linhas vira job com
notificação. Use a skill `xlsx` para gerar o arquivo.

Exportação de dado pessoal é registrada em [audit-trail] — saber quem baixou a base de
clientes importa (ver [lgpd]).
