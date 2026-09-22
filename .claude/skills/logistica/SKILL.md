---
name: logistica
description: Logística e expedição no KAIROS — separação, conferência, embalagem, frete, transportadora, rastreio e entrega. Use ao trabalhar em expedição, cálculo de frete ou acompanhamento de entrega.
---

# Logística e expedição

## Fluxo

```
Pedido separado -> conferência -> embalagem (volumes) -> emissão da NF
-> etiqueta e coleta -> em trânsito -> entregue
```

## Entidades

```
expedicao(id, tenant_id, pedido_id, nota_id, transportadora_id, modalidade_frete,
          valor_frete, previsao_entrega, situacao)
volume(expedicao_id, numero, especie, peso_bruto, peso_liquido, altura, largura,
       comprimento, codigo_rastreio)
ocorrencia_entrega(expedicao_id, data, status, descricao, origem)
```

Peso e dimensão vêm do cadastro do produto (peso líquido, peso bruto, cubagem por
embalagem). Cosmético é denso: frete costuma ser cobrado por peso real, não por cubagem —
mas confira a regra de cada transportadora.

## Modalidade de frete

`CIF` (por conta do emitente), `FOB` (por conta do destinatário), terceiros, próprio,
sem frete. A modalidade vai para a NF-e no grupo de transporte e afeta a base de cálculo
do ICMS quando o frete é cobrado do cliente.

## Cálculo de frete

Tabela própria por transportadora (faixa de peso x região/CEP) ou cotação por API.
O pedido guarda o valor cotado; a expedição guarda o valor real. A diferença entre
cotado e real é despesa logística e aparece no relatório de margem por pedido.

Frete grátis acima de um valor é política comercial: registre o subsídio como despesa,
não como desconto na receita. A diretoria precisa ver quanto o frete grátis custou.

## Etiqueta e rastreio

Etiqueta com pedido, nota, volume (1/3, 2/3), destinatário e código de barras.
Código de rastreio da transportadora guardado por volume e exibido ao cliente.
Integração com Correios ou transportadora por API para atualizar ocorrências por job.

## Conferência de expedição

Leitura de código de barras do produto e do lote contra a lista de separação.
Divergência trava a expedição e avisa o responsável. É a última barreira antes de enviar
produto errado ou lote vencido ao cliente — vale o atrito.

## Documentos de transporte

Transporte próprio entre depósitos ou entrega com veículo da empresa pode exigir MDF-e
(ver [mdfe]). Contratação de transportadora gera CT-e emitido por ela, que deve ser
importado e vinculado à expedição para conferência do frete ([cte]).

## Indicadores

Prazo médio de entrega por transportadora e região, percentual de entregas no prazo,
ocorrências por tipo (avaria, ausência, endereço), custo de frete sobre faturamento e
peso médio por pedido.
