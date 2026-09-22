---
name: accessibility
description: Acessibilidade no KAIROS (WCAG 2.2 AA) aplicada a sistema de gestão — teclado, foco, leitor de tela, contraste, formulários e tabelas. Use ao criar ou revisar qualquer interface.
---

# Acessibilidade

Alvo: WCAG 2.2 AA. Em ERP, acessibilidade também é produtividade — quem opera o dia
inteiro depende de teclado e foco previsível.

## Teclado

- Toda ação alcançável por teclado, sem armadilha de foco.
- Ordem de tabulação segue a ordem visual. Nada de `tabindex` positivo.
- Foco visível com contraste mínimo 3:1 contra o fundo. Nunca remova o outline sem
  colocar algo melhor no lugar.
- Diálogo: foco entra no primeiro elemento útil, fica preso enquanto aberto e volta ao
  gatilho ao fechar.
- Atalhos globais documentados na tela de ajuda (`?`): `Ctrl+K` busca, `Ctrl+Enter` salva,
  `Esc` fecha.
- Skip link "Ir para o conteúdo" como primeiro elemento focável.

## Semântica

HTML nativo primeiro: `<button>`, `<a>`, `<table>`, `<label>`, `<fieldset>`.
ARIA só quando não existe elemento nativo equivalente. `div` com `onClick` é defeito.

- Um `<h1>` por página, hierarquia sem pulo.
- Landmarks: `header`, `nav`, `main`, `aside`.
- Ícone sozinho tem `aria-label` descrevendo a ação ("Cancelar pedido"), não o desenho
  ("lixeira").

## Formulários

- `<label for>` real em todo campo. Placeholder não substitui rótulo.
- Campo obrigatório marcado no texto do rótulo e com `aria-required`.
- Erro ligado ao campo por `aria-describedby`, com `aria-invalid` e anúncio em
  `role="alert"`.
- Instrução de formato antes do campo, não depois do erro.

## Tabelas

`<th scope="col">`, `<caption>` (pode ser visualmente oculto), cabeçalho fixo que não
quebra a semântica. Mudança de quantidade após filtro anunciada em `aria-live="polite"`
("1.243 pedidos encontrados").

## Cor e contraste

- Texto normal 4.5:1, texto grande e ícones 3:1.
- Estado nunca só por cor: "Vencido" tem texto, não só a tarja vermelha. Daltonismo é
  comum; a tela de títulos precisa funcionar em tons de cinza.
- Tema escuro passa pelos mesmos limites.

## Movimento e zoom

Respeite `prefers-reduced-motion`. Layout usável a 200% de zoom e em 320px de largura
sem rolagem horizontal.

## Verificação

- `eslint-plugin-jsx-a11y` no CI.
- `@axe-core/playwright` nas rotas principais do E2E (ver [e2e-testing]).
- Teste manual por teclado antes de cada release: criar pedido, faturar, baixar título,
  sem tocar no mouse.
- Ferramenta automática pega cerca de um terço dos problemas. O resto é revisão humana.
