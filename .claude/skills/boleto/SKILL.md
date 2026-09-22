---
name: boleto
description: Boleto bancário no KAIROS — registro, nosso número, linha digitável, juros e multa, protesto e baixa. Use ao implementar cobrança registrada ou tratar retorno bancário de boletos.
---

# Boleto

Ainda é o meio de cobrança padrão para distribuidores e salões com prazo. Todo boleto é
**registrado**: sem registro, o banco não reconhece nem liquida.

## Fluxo

```
Título a receber -> geração do boleto (API do banco ou remessa CNAB)
 -> registro confirmado -> envio ao cliente (e-mail/WhatsApp com PDF e linha digitável)
 -> liquidação -> retorno bancário -> baixa automática
```

## Dados

```
boleto(id, tenant_id, titulo_id, banco, carteira, nosso_numero, numero_documento,
       vencimento, valor, linha_digitavel, codigo_barras, situacao, arquivo_id,
       registrado_em, liquidado_em)
```

`nosso_numero` é sequencial por carteira e banco, com dígito verificador conforme o
layout do banco. Cada banco tem regra própria de composição e faixa autorizada: erro aqui
gera boleto que não registra ou que registra no cliente errado.

## Instruções

- Juros de mora: percentual ao mês a partir do dia seguinte ao vencimento.
- Multa: percentual fixo após o vencimento.
- Desconto por antecipação, quando a política comercial previr.
- Protesto ou negativação após N dias — decisão comercial, sempre com aviso prévio ao
  cliente.
- Prazo de aceite após o vencimento (boleto vence, mas continua pagável por X dias).

As instruções vão no registro e precisam bater com o que está impresso. Divergência entre
o impresso e o registrado gera cobrança indevida e reclamação.

## Situações

```
EMITIDO -> REGISTRADO -> LIQUIDADO
                      -> BAIXADO (por decurso, acordo ou solicitação)
                      -> PROTESTADO
```

## Retorno e baixa

Arquivo de retorno CNAB ([cnab]) ou webhook da API do banco traz liquidação, baixa,
rejeição de registro e tarifas. Ocorrências tratadas:

| Ocorrência | Ação |
|---|---|
| Liquidação | baixa o título com a data e o valor pagos, juros e multa separados |
| Liquidação parcial | baixa parcial, título segue aberto |
| Baixa por decurso de prazo | marca o boleto, mantém o título em aberto |
| Rejeição de registro | alerta imediato: boleto não existe no banco |
| Tarifa | lança despesa bancária pela natureza correta |

Rejeição silenciosa é o pior caso: o cliente recebe um boleto que não pode ser pago e
ninguém sabe até a cobrança. Alerte no mesmo dia.

## PIX no boleto

Boleto híbrido com QR Code PIX aumenta muito a taxa de pagamento em dia e reduz custo
por liquidação. Prefira quando o banco oferecer (ver [pix]).

## Custos

Tarifa por registro e por liquidação entra como despesa financeira por natureza, e o
relatório mostra o custo por forma de recebimento — é o número que justifica migrar
para PIX.
