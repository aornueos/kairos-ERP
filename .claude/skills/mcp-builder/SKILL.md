---
name: mcp-builder
description: Construir servidores MCP para o KAIROS — expor consultas do ERP a assistentes de IA com segurança, escopo e limites. Use ao criar ou revisar um servidor MCP ligado ao ERP.
---

# Servidores MCP para o KAIROS

Model Context Protocol permite que um assistente consulte o ERP com linguagem natural:
"quanto temos do shampoo de nutrição 300 ml?", "quais títulos vencem esta semana?".

> Substitui localmente a skill oficial `mcp-builder`, que não está disponível neste
> catálogo.

## Escopo recomendado: leitura primeiro

Comece somente com consulta. Escrita por assistente em ERP (criar pedido, baixar título)
exige confirmação humana explícita e auditoria própria, e não se justifica na fase 1.

## Ferramentas sugeridas

| Ferramenta | Retorno |
|---|---|
| `consultar_estoque` | saldo por produto, depósito e lote, com validade |
| `consultar_lotes_vencendo` | lotes por janela de validade |
| `consultar_pedido` | situação e itens de um pedido |
| `consultar_titulos` | a pagar e a receber por período e situação |
| `consultar_producao` | OPs por situação e rendimento |
| `relatorio_vendas` | agregado por período, produto, canal ou cliente |

Ferramenta com escopo estreito e descrição clara funciona melhor que uma genérica de
consulta livre. Nunca exponha "executar SQL": é acesso irrestrito disfarçado de recurso.

## Regras de segurança

1. **Autenticação por token de aplicação** com escopo próprio (ver [auth-rbac]), nunca
   credencial de usuário.
2. **Tenant fixo no token.** O `tenantId` nunca é parâmetro da ferramenta.
3. **Permissões valem igual**: o servidor chama os mesmos casos de uso, com
   `ctx.exigirPermissao`. Sem atalho por acesso direto ao banco.
4. **Sem dado pessoal desnecessário** na resposta (ver [lgpd]). Relatório agregado em vez
   de lista de clientes, sempre que resolver.
5. **Limite de volume**: toda ferramenta tem `limite` com teto, e resposta paginada.
6. **Auditoria**: toda chamada registrada com ator, ferramenta e parâmetros.

## Implementação

Servidor separado (`apps/mcp/`), consumindo a API pública v1 do KAIROS
(ver [api-design-rest]), não o banco. Isso mantém a fronteira, reaproveita permissão e
validação, e permite rodar o MCP fora do servidor do ERP.

Descrição de ferramenta é prompt: escreva o que ela faz, quando usar, e o que cada
parâmetro significa no vocabulário do negócio ("SKU" e "lote" precisam estar explicados).

## Teste

Cenários com dados da massa demo, conferindo que a resposta bate com a tela.
Teste também o caminho negativo: token sem escopo, tenant errado, período absurdo,
limite estourado.
