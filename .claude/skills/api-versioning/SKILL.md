---
name: api-versioning
description: Política de versionamento e depreciação da API do KAIROS. Use ao alterar contrato existente, remover campo, mudar tipo de retorno ou planejar a saída de uma versão.
---

# Versionamento de API

Versão na URL: `/api/v1/`. Uma versão maior viva por vez, com a anterior em depreciação
por no mínimo seis meses.

## Mudança compatível (não sobe versão)

- Adicionar campo opcional na resposta.
- Adicionar campo opcional na requisição, com default.
- Adicionar novo valor de enum, se documentado como extensível desde o início.
- Adicionar endpoint novo.

O cliente é obrigado a ignorar campos desconhecidos. Documente isso no primeiro dia.

## Mudança incompatível (exige v2)

- Remover ou renomear campo.
- Mudar tipo, formato ou unidade (string para número, reais para centavos).
- Tornar campo opcional em obrigatório.
- Mudar semântica de status ou código de erro.
- Mudar default que altera resultado.

## Processo de depreciação

1. ADR registrando motivo e data de corte.
2. A resposta passa a enviar `Deprecation: true`, `Sunset: <data>` e
   `Link: </docs/migracao-v2>; rel="deprecation"`.
3. Log estruturado de cada chamada à versão antiga, com identificação do cliente.
4. Aviso aos integradores conhecidos 90 e 30 dias antes.
5. Depois do corte: `410 Gone` com `detail` apontando a migração. Nunca 404 silencioso.

## Webhooks e eventos

Webhook leva `versao` no corpo e o consumidor assina uma versão específica.
Regras iguais às da API. Ver [webhooks].

## Contrato congelado por teste

Cada versão tem arquivos de contrato em `tests/contract/v1/*.json` com exemplos de
requisição e resposta. Alterar o contrato quebra o teste de propósito: se ele falhar, ou
a mudança é incompatível, ou o exemplo precisa ser atualizado junto com o ADR.
