---
name: technical-docs
description: Documentação técnica do KAIROS — o que documentar, onde, formato e manutenção. Use ao criar ou atualizar documento técnico, README de módulo ou runbook.
---

# Documentação técnica

Documente o que o código não explica: decisão, restrição, motivo, e o que já deu errado.
Documentação que repete a implementação envelhece e engana.

## Estrutura

```
README.md                      o que é, como rodar em 5 minutos
INSTRUCTIONS.md                plano e estado do projeto, catálogo de skills
CLAUDE.md                      diretrizes de engenharia
docs/
  adr/                         decisões arquiteturais (ver [adr-writer])
  arquitetura/                 visão geral, contextos, fluxos principais
  modulos/<ctx>.md             regras de negócio do módulo
  operacao/                    runbooks, incidentes, ensaios de restore, desempenho
  integracoes/<provedor>.md    contrato, credenciais (referência), homologação
  fiscal/                      parâmetros, NCM/CEST, decisões com o contador
  indicadores.md               definição de cada métrica
  lgpd/                        inventário de dados, incidentes
src/modules/<ctx>/README.md    responsabilidade, API pública, eventos
```

## README de módulo

Curto e útil, no máximo uma página:

```markdown
# Estoque
Responsabilidade: saldo por produto, depósito e lote; movimentação; custo médio.
API pública: reservarEstoque, consultarSaldo, registrarMovimento
Eventos publicados: estoque.movimentado, lote.vencendo
Eventos consumidos: compra.recebida, producao.concluida, pedido.faturado
Invariantes: saldo nunca negativo; lote obrigatório quando o produto exige; FEFO.
Armadilhas: reserva expira em 72h; ajuste manual exige permissão e motivo.
```

## Runbook

Um por procedimento operacional, escrito para quem está com pressa às 23h:

```markdown
# Nota presa em TRANSMITINDO
Sintoma: nota parada há mais de 10 minutos.
Diagnóstico: (comandos exatos)
Ação: consultar pela chave; se autorizada na SEFAZ, sincronizar; se não, reenviar
       com a mesma chave de idempotência.
Nunca: reenviar sem consultar (gera duplicidade).
Escalar para: responsável fiscal.
```

Runbooks existentes: nota presa, fila travada, migration falhando no deploy, conciliação
divergente, restauração de backup, certificado vencido.

## Regras

- Documento tem dono e data da última revisão no topo.
- Em português, com o vocabulário do negócio (ver [domain-driven-design]).
- Diagrama com Mermaid no próprio markdown, versionado com o código. Imagem solta fica
  desatualizada em uma semana.
- Atualizar documentação afetada faz parte do PR, não de uma tarefa futura.
- Documento sem revisão há mais de 6 meses entra na revisão trimestral: atualizar ou
  apagar. Documentação errada é pior que ausente.

## O que não documentar

Passo a passo do que a UI já mostra, lista de campos de tabela (o schema é a fonte), e
qualquer coisa que o próximo `git log` explique melhor.
