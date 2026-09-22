---
name: integracao-ecommerce
description: Integração com a loja própria da Pure.us (Shopify, WooCommerce, Nuvemshop, VTEX) — catálogo, preço, estoque, pedidos e pós-venda. Use ao conectar a loja virtual ao ERP.
---

# E-commerce próprio

Diferente de marketplace: a loja é da Pure.us, a marca e o cliente também. O ERP é a
fonte da verdade para catálogo, preço e estoque; a loja é a vitrine.

## Direção dos dados

| Dado | Direção |
|---|---|
| Produto, descrição, imagem, NCM | ERP -> loja |
| Preço da tabela de varejo | ERP -> loja |
| Estoque disponível | ERP -> loja |
| Pedido e pagamento | loja -> ERP |
| Status (faturado, enviado, rastreio) | ERP -> loja |
| Cliente | loja -> ERP (cria parceiro consumidor final) |

Editar preço direto na loja quebra o modelo: o valor volta na próxima sincronização e
confunde todo mundo. Se a loja precisa de promoção própria, modele isso como tabela de
preço promocional no ERP, com vigência (ver [vendas]).

## Sincronização

- Catálogo e preço: por evento de alteração, com reconciliação completa diária.
- Estoque: disponível menos reserva de segurança, a cada movimentação, com debounce.
- Pedido: webhook da plataforma, com deduplicação e reprocessamento manual disponível.

`produto.id_externo` por canal guarda o vínculo. Produto sem vínculo não é publicado, e a
tela mostra o que está fora do ar e por quê.

## Pedido

Chega pago (gateway) ou aguardando (boleto, PIX). O ERP só reserva estoque e libera para
separação após a confirmação do pagamento — exceto quando a política comercial permitir
separar antes, o que precisa ser decisão explícita, não acidente de integração.

Cria pedido com canal `ECOMMERCE`, tabela de varejo, cliente consumidor final e frete
conforme a cotação registrada na loja. NF-e ao consumidor com DIFAL para outra UF
(ver [difal], [nfe]).

## Pós-venda

Status de faturamento e código de rastreio voltam para a loja, para o cliente acompanhar.
Troca e devolução seguem o Código de Defesa do Consumidor (7 dias de arrependimento).
Produto devolvido entra em quarentena; cosmético aberto não retorna ao estoque vendável.

## Conteúdo do produto

Descrição de cosmético tem exigências: composição (INCI), modo de uso, advertências,
registro ou notificação ANVISA e validade. O cadastro do produto no ERP guarda esses
campos, e eles vão para a loja — assim a informação é única e não diverge entre canais.

## Escopo

Fase 3, ou fase 2 se a loja já existir. A integração começa por catálogo e estoque, que
é onde mais dói o trabalho manual.
