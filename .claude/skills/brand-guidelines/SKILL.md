---
name: brand-guidelines
description: Diretrizes da marca Pure.us aplicadas ao KAIROS — uso do logo, cor, tipografia, tom de voz e documentos impressos (DANFE, boleto, relatórios, e-mails). Use ao produzir qualquer material que carregue a marca.
---

# Marca Pure.us no KAIROS

> Substitui localmente a skill oficial `brand-guidelines`, que não está disponível neste
> catálogo. Se a Pure.us já tiver um manual de marca formal, ele prevalece sobre este
> documento — registre a divergência e atualize aqui.

## Dois contextos, duas posturas

| Contexto | Postura |
|---|---|
| Interface do ERP | marca discreta: legibilidade e densidade acima de expressão visual |
| Material que sai da empresa (nota, boleto, e-mail ao cliente, relatório, catálogo) | marca presente e correta |

Ninguém trabalha oito horas dentro de uma peça publicitária. Ver [kairos-design-system].

## Aplicação

- Logo no topo da barra lateral (versão reduzida) e no cabeçalho de documentos
  (versão completa), com área de respiro e sem distorção, recorte ou sombra.
- Cor da marca em ação primária, link e estado ativo. Não use como fundo de tela cheia
  nem em tarja de alerta — alerta tem cor semântica própria.
- Tipografia da interface prioriza legibilidade em números. Fonte de identidade fica para
  peças de marketing, não para tabela de títulos.
- Tema escuro usa a variação da cor de marca com contraste verificado, nunca o mesmo hex.

## Documentos que saem da empresa

| Documento | Cuidados |
|---|---|
| DANFE | layout definido pela SEFAZ; a marca entra apenas onde é permitido |
| Boleto | logo, razão social e CNPJ corretos; leiaute do banco manda |
| E-mail ao cliente | remetente com domínio próprio, assinatura e logo; texto direto |
| Relatório em PDF/XLSX | cabeçalho com marca, empresa, período e filtros aplicados |
| Etiqueta e romaneio | marca discreta, código de barras legível acima de tudo |

Dado obrigatório (razão social, CNPJ, endereço, inscrições) vem do cadastro do tenant,
nunca cravado em template.

## Tom de voz

Direto, respeitoso e sem exageros. A empresa fala de cosmético capilar com autoridade
técnica: "fórmula com ativo X", não "poção mágica". Dentro do sistema, o tom é ainda mais
sóbrio (ver [i18n-ptbr], microcopy).

Evite: exclamação em série, emoji em documento formal, promessa de resultado que a
regulação não permite fazer sobre cosmético.

## Antes de criar peça nova

1. Existe template? Use.
2. O dado da empresa vem do cadastro?
3. Passa contraste e legibilidade impressa em preto e branco?
4. A informação obrigatória (fiscal, regulatória) está presente?

Para construir identidade visual do zero ou revisar a existente, use a skill
`brand-identity` do perfil, que cobre o processo de briefing.
