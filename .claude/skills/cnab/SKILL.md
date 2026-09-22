---
name: cnab
description: Arquivos CNAB 240 e 400 no KAIROS — remessa e retorno de cobrança e de pagamentos, layout por banco, parsing e testes. Use ao gerar ou ler arquivo bancário.
---

# CNAB

Formato texto posicional para troca com bancos. Continua sendo o caminho mais universal:
API própria do banco é melhor quando existe, mas nem todo banco oferece para tudo.

## Tipos

| Tipo | Uso |
|---|---|
| Remessa cobrança (400 ou 240) | registra boletos, altera instruções, pede baixa |
| Retorno cobrança | liquidações, baixas, rejeições, tarifas |
| Remessa pagamento (240) | pagamento a fornecedor, tributos, folha |
| Retorno pagamento | confirmação, rejeição, devolução |

## Regra número um: layout é por banco

"CNAB 240 da FEBRABAN" é um esqueleto. Cada banco tem manual próprio, com posições,
códigos de ocorrência e validações diferentes. Implemente por banco:

```
src/modules/financeiro/infra/cnab/
  base/            leitor e escritor posicional, tipos de campo
  bb/              layout do Banco do Brasil
  itau/            layout do Itaú
  sicoob/          layout do Sicoob
```

Nunca tente um gerador genérico "que serve para todos". Ele quebra no primeiro banco novo
e leva junto os que já funcionavam.

## Implementação

- Campos posicionais declarados como especificação de dados (posição inicial, tamanho,
  tipo, decimais), nunca por `substring` espalhado pelo código.
- Numérico é preenchido com zeros à esquerda; alfanumérico com espaços à direita; valores
  sem separador decimal (`1234` significa 12,34).
- Arquivo em ASCII, quebra de linha conforme o banco (`CRLF` na maioria), sem acento
  (transliterar).
- Sequencial de remessa por banco, controlado em tabela, sem buraco nem repetição.
- Guarde o arquivo gerado e o recebido no S3, com hash (ver [file-storage]).

## Retorno

Processar sempre por job, com idempotência: reimportar o mesmo arquivo não pode duplicar
baixa. Chave: `(banco, nosso_numero, ocorrência, data, valor)` ou o hash do arquivo mais
a linha.

Ocorrência desconhecida não é ignorada: registra com o código bruto e alerta, para que
alguém mapeie. Ignorar em silêncio esconde rejeição de registro e liquidação não
processada.

## Testes

Arquivos reais anonimizados em `tests/fixtures/cnab/<banco>/`, um por cenário:
registro aceito, rejeitado, liquidação total, parcial, baixa, tarifa.
Teste de ida e volta: gerar remessa, ler o próprio arquivo, conferir o conteúdo.

Homologação com o banco é obrigatória antes de produção — todo banco exige validar
arquivos de teste, e é lá que aparecem as diferenças do manual.

## Segurança

Arquivo de pagamento contém dados bancários de fornecedores: acesso restrito, download
auditado, e conferência de totais antes do envio (quantidade de registros e soma dos
valores). Alteração de conta de fornecedor entre a aprovação e a geração da remessa é
vetor de fraude: compare e bloqueie.
