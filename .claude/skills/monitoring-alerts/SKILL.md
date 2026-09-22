---
name: monitoring-alerts
description: Monitoramento e alertas do KAIROS — o que vigiar, limites, canais e plantão. Use ao configurar alerta, responder incidente ou revisar ruído de notificação.
---

# Monitoramento e alertas

Regra única que evita 90% dos problemas: **alerta é o que alguém precisa fazer agora**.
Tudo o mais é painel.

## Health check

`/api/health` verifica banco (consulta simples), fila (pg-boss respondendo) e storage
(listar bucket). Retorna 200 com o detalhe por dependência, ou 503. Usado pelo deploy e
pelo monitor externo a cada minuto.

## Alertas críticos (acionam plantão)

| Alerta | Condição |
|---|---|
| Aplicação fora do ar | health falhando por 2 minutos |
| Banco indisponível | erro de conexão |
| Fila travada | nenhum job processado em 15 minutos com fila não vazia |
| Emissão fiscal parada | nenhuma nota autorizada em 60 minutos no horário comercial, com pendentes |
| Taxa de erro | acima de 5% das requisições em 5 minutos |
| Disco do banco | acima de 85% |
| Backup | dump diário não concluído |
| Certificado A1 | vence em menos de 7 dias |

## Alertas de atenção (horário comercial, por e-mail ou chat)

Jobs na dead letter, webhooks falhando por mais de 30 minutos, conciliação bancária
falhando, divergência na conferência noturna de faturamento, consulta acima de 5 segundos
recorrente, certificado vencendo em 30 dias, consentimento de Open Finance expirando.

## Anti-ruído

- Alerta que dispara mais de duas vezes por semana sem ação é ruído: ajuste o limite ou
  conserte a causa.
- Agrupe: 200 jobs falhando pelo mesmo motivo geram um alerta, não 200.
- Silencie manutenção programada.
- Revise a lista de alertas todo trimestre e remova os que ninguém usa.

Time que ignora alerta é time sem monitoramento, mesmo com tudo configurado.

## Canais

Crítico: notificação push e telefone do responsável técnico. Atenção: chat da equipe.
Informativo: painel apenas.

## Resposta a incidente

1. Reconhecer (alguém assumiu).
2. Comunicar quem usa o sistema, se afeta a operação. Em ERP, o usuário precisa saber se
   pode continuar faturando.
3. Estabilizar antes de investigar a causa.
4. Registrar a linha do tempo.
5. Post-mortem sem culpado em `docs/operacao/incidentes/AAAA-MM-DD.md`, com a ação de
   prevenção e um responsável.

## Painel operacional

Uma tela com: saúde dos serviços, fila (pendentes e falhas), notas pendentes e rejeitadas
nas últimas 24 h, últimos erros, e integrações com falha. É a primeira coisa que se abre
quando alguém diz "o sistema está estranho".
