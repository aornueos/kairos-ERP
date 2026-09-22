---
name: rh
description: Módulo de RH do KAIROS — cadastro de colaboradores, cargos, jornada, ponto, férias e afastamentos. Use ao trabalhar em gestão de pessoas, ponto ou dados que alimentam a folha.
---

# RH

Escopo da fase 3. Objetivo modesto e realista: cadastro confiável, controle de ponto e
insumos para a folha, que continua sendo processada pelo escritório contábil (ver
[folha-pagamento]).

## Entidades

```
colaborador(id, tenant_id, pessoa_id, matricula, cargo_id, centro_custo_id,
            admissao, demissao, regime, jornada_id, salario, situacao)
cargo(id, tenant_id, nome, cbo, faixa_salarial_min, faixa_salarial_max)
jornada(id, tenant_id, nome, carga_semanal, escala, intervalo)
ponto_marcacao(id, tenant_id, colaborador_id, momento, tipo, origem, justificativa)
ponto_espelho(colaborador_id, competencia, horas_normais, extras_50, extras_100,
              faltas, atrasos, dsr, situacao)
ferias(id, colaborador_id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim,
       inicio_gozo, dias, abono_pecuniario, situacao)
afastamento(id, colaborador_id, tipo, inicio, fim, cid, documento_id)
```

`pessoa_id` aponta para o cadastro comum de pessoas: um colaborador também pode ser
contato ou cliente. Não duplique dados pessoais.

## Ponto

- Marcação por aplicativo web com geolocalização opcional ou por relógio integrado.
- Ajuste de marcação exige justificativa e aprovação do gestor, sempre com auditoria.
  A marcação original nunca é apagada; correção é nova marcação vinculada.
- Espelho mensal com fechamento, assinatura eletrônica do colaborador e bloqueio depois
  do fechamento.
- Banco de horas conforme acordo, com saldo, prazo de compensação e alerta de vencimento.
- Regras de hora extra, adicional noturno e intervalo seguem a CLT e o acordo coletivo do
  setor. Parâmetros configuráveis, nunca cravados no código.

## Férias

Controle de período aquisitivo e concessivo, alerta de férias vencendo (o custo dobra),
limite de fracionamento, e aviso com 30 dias de antecedência.

## Documentos e saúde ocupacional

ASO admissional, periódico e demissional, com alerta de vencimento. Em fábrica de
cosméticos há exposição a agentes químicos: controle de EPI entregue, com data e
assinatura, e vínculo ao PGR/PCMSO.

## Privacidade

Dado de saúde (CID, ASO) é dado pessoal sensível: acesso restrito ao perfil de RH,
criptografia em repouso e auditoria de leitura, não só de escrita. Ver [lgpd].

## Integração

O RH entrega à folha: colaboradores ativos, eventos do mês (horas, faltas, férias,
afastamentos) e centro de custo. Recebe da folha os valores para provisão e os títulos
a pagar (ver [folha-pagamento] e [contas-pagar-receber]).
