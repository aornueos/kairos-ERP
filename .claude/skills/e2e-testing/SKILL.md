---
name: e2e-testing
description: Testes end-to-end do KAIROS com Playwright — jornadas críticas, seletores, dados, estabilidade e acessibilidade. Use ao criar ou corrigir teste de interface.
---

# Testes E2E

Playwright. Poucos testes, de alto valor, cobrindo as jornadas que não podem quebrar.
E2E é caro: cada teste instável custa confiança no CI inteiro.

## Jornadas cobertas

1. Login, troca de tenant e logout.
2. Cadastrar produto com controle de lote e validade.
3. Criar pedido, confirmar com reserva de estoque, faturar e ver a nota autorizada
   (provedor fiscal simulado).
4. Baixar título a receber e conferir o reflexo no fluxo de caixa.
5. Criar ordem de produção, apontar insumos, concluir e conferir a entrada do lote.
6. Receber compra com lote e validade e ver o custo médio atualizado.
7. Importar planilha de produtos com erros e corrigir pela prévia.
8. Bloqueio por permissão: perfil de vendas não acessa a tela de baixa.

Se um desses quebra, ninguém trabalha. Por isso são E2E, e não só integração.

## Seletores

`getByRole`, `getByLabel`, `getByText`. `data-testid` apenas quando não houver
alternativa acessível. Nunca CSS estrutural (`.grid > div:nth-child(3)`): quebra na
primeira mudança de layout e não testa nada de real.

Bônus: escrever o teste por papel e rótulo revela problema de acessibilidade antes do
usuário (ver [accessibility]).

## Dados

Cada teste cria os próprios dados por API (não pela UI) e usa um tenant descartável.
Depender de base compartilhada é a receita para teste que passa sozinho e falha na suíte.

## Estabilidade

- Sem `waitForTimeout`. Use espera por estado: `expect(locator).toBeVisible()`.
- Espere a resposta da ação, não um tempo arbitrário.
- Teste intermitente é bug: conserte ou remova. Marcar como `skip` e seguir em frente
  transforma a suíte em decoração.
- Trace, vídeo e screenshot ativados no CI só em falha.

## Execução

Local: `pnpm e2e` contra o app em modo de desenvolvimento, com provedor fiscal falso.
CI: em container, contra build de produção, banco limpo e seed de fixtures.
Alvo: suíte inteira abaixo de 10 minutos.

## Acessibilidade

`@axe-core/playwright` nas rotas principais, falhando o CI em violação séria ou crítica.
É a verificação automática mais barata que existe para acessibilidade.

## O que não fazer em E2E

Validação de regra de negócio (é integração), cálculo fiscal (é unitário) e variação de
layout (é revisão visual). E2E responde "o usuário consegue completar a jornada", não
"o número está certo".
