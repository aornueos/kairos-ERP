---
name: crm
description: CRM do KAIROS — carteira de clientes, funil, atividades, histórico e ações para salões e distribuidores. Use ao trabalhar em relacionamento comercial, prospecção ou retenção.
---

# CRM

Escopo enxuto: o suficiente para a equipe comercial da Pure.us organizar carteira e não
perder cliente, sem virar um CRM de mercado. Fase 2 do roadmap.

## Entidades

```
oportunidade(id, tenant_id, parceiro_id, vendedor_id, etapa, valor_estimado,
             probabilidade, previsao_fechamento, origem, motivo_perda)
atividade(id, tenant_id, parceiro_id, oportunidade_id, tipo, assunto, descricao,
          responsavel_id, prazo, concluida_em)
   -- tipo: LIGACAO | VISITA | WHATSAPP | EMAIL | REUNIAO | AMOSTRA
interacao(id, tenant_id, parceiro_id, canal, resumo, ocorrido_em, usuario_id)
```

## Funil

```
PROSPECCAO -> CONTATO -> AMOSTRA_ENVIADA -> PROPOSTA -> NEGOCIACAO -> GANHA | PERDIDA
```

`AMOSTRA_ENVIADA` é etapa própria no negócio de cosméticos: salão testa o produto antes
de comprar. A amostra sai do estoque como `SAIDA_AMOSTRA` (ver [estoque]), com custo
atribuído ao centro comercial — amostra é investimento comercial e precisa aparecer no
resultado.

Perda sempre com motivo de uma lista fechada (preço, prazo, concorrente, sem verba,
sem retorno). Motivo livre não gera relatório útil.

## Carteira

Cliente pertence a um vendedor ou representante. O vendedor vê a própria carteira; o
gerente vê tudo (ver [auth-rbac], escopo). Transferência de carteira é operação
registrada, com data e responsável.

## Visão 360 do parceiro

Uma tela com: dados cadastrais, contatos, últimas compras, mix de produtos, ticket médio,
títulos em aberto e histórico de atraso, atividades, oportunidades e anexos.
É a tela que o vendedor abre antes de ligar.

## Rotinas que geram trabalho

- Cliente sem compra há 60 dias: cria atividade de recontato para o vendedor.
- Cliente com queda de mais de 30% no volume trimestral.
- Recompra prevista: pelo intervalo médio de compra do cliente, sugerir contato.
- Aniversário do salão e do contato, quando cadastrado.
- Amostra enviada há mais de 15 dias sem retorno.

Cada rotina vira atividade com prazo, não apenas alerta no painel. Alerta sem tarefa é
ignorado.

## Integração com vendas

Oportunidade ganha gera pedido com os itens da proposta. O pedido mantém a referência à
oportunidade, o que permite medir conversão real por canal, vendedor e origem.

## LGPD

Contato de pessoa física em salão é dado pessoal. Registre a base legal, permita
descadastro de comunicação e não use os dados para finalidade diferente da informada.
Ver [lgpd].
