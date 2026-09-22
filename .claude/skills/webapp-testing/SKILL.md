---
name: webapp-testing
description: Verificar o KAIROS rodando de verdade no navegador durante o desenvolvimento — subir o app, percorrer a tela alterada, ler console e rede, capturar evidência. Use antes de dizer que uma mudança de interface funciona.
---

# Verificação no app rodando

Complementa, não substitui, o [e2e-testing]. Aqui o objetivo é conferir a mudança na tela
antes de abrir o PR: rodar, clicar, olhar o console.

> Substitui localmente a skill oficial `webapp-testing`, que não está disponível neste
> catálogo.

## Subir

```bash
docker compose up -d
pnpm dev
pnpm worker     # necessário para fiscal, e-mail e relatórios
```

Massa de demonstração: `pnpm seed:demo` (ver [data-seeding]).

## Roteiro mínimo por tipo de mudança

**Tela de lista**: carregar, filtrar, limpar filtro, ordenar, paginar, exportar, estado
vazio, estado de erro, permissão negada.

**Formulário de documento**: criar, validar campo obrigatório, adicionar e remover item,
conferir totais, salvar rascunho, confirmar, tentar duplo clique no botão.

**Fluxo com efeito**: faturar, baixar título, concluir OP — e depois conferir o efeito no
outro módulo (estoque baixou? título nasceu? auditoria registrou?).

**Job**: disparar, acompanhar a tela de processos, ver o resultado e o reprocessamento.

## Sempre olhar

- Console do navegador: erro, aviso de React, requisição falhando.
- Rede: chamada duplicada, payload grande demais, resposta lenta.
- Log do servidor: erro que a tela escondeu.
- Tema claro e escuro.
- Largura de celular (a expedição usa tablet e telefone).
- Navegação por teclado no fluxo alterado (ver [accessibility]).

## Evidência no PR

Captura de tela do antes e depois em mudança visual, e a descrição do roteiro que você
percorreu. "Testei manualmente" sem dizer o quê não ajuda quem revisa.

## Quando promover a teste automatizado

Se você repetiu o mesmo roteiro manual três vezes, ele vira teste: integração se for
regra, E2E se for jornada. Verificação manual é para o que ainda está mudando de forma,
não para o que já está estável.
