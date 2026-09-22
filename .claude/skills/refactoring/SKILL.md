---
name: refactoring
description: Refatoração segura no KAIROS — quando refatorar, técnicas, proteção por teste e limites de escopo. Use ao melhorar código existente ou ao encontrar código ruim no caminho de uma tarefa.
---

# Refatoração

Refatoração muda estrutura sem mudar comportamento. Se o comportamento muda, é mudança
funcional e vai em commit separado.

## Quando refatorar

- O código precisa mudar e a estrutura atual atrapalha a mudança.
- A mesma regra de negócio está duplicada e uma cópia já divergiu.
- Um teste é difícil de escrever por causa do acoplamento.
- A função tem mais de um motivo para mudar.

## Quando não refatorar

- Só porque o estilo é diferente do seu.
- Em arquivo que ninguém toca há um ano e funciona.
- No mesmo commit da correção de um bug em produção.
- Sem teste que proteja o comportamento atual.

## Ordem segura

1. Caracterizar: escrever teste que descreve o comportamento atual, mesmo que estranho.
2. Refatorar em passos pequenos, rodando o teste a cada passo.
3. Commits separados: um refatora, outro muda comportamento.
4. Revisar o diff completo antes de abrir o PR.

## Técnicas que mais servem aqui

- **Extrair caso de uso**: Server Action gorda vira caso de uso testável.
- **Extrair value object**: `string` de CNPJ espalhada vira `Cnpj` com validação.
- **Guard clause**: substituir aninhamento profundo por saídas antecipadas.
- **Mover regra para o domínio**: `if` de negócio dentro de repositório ou tela volta
  para a entidade.
- **Introduzir porta**: chamada direta a provedor externo vira interface com adapter.
- **Expand/contract** para mudança de schema (ver [migrations]).

## Limites de escopo

O diff deve continuar proporcional à tarefa. Encontrou problema grande fora do escopo?
Registre e siga. Refatoração oportunista que dobra o tamanho do PR atrasa a revisão e
esconde a mudança real.

Exceção: se o problema impede a solução, explique no PR e faça a ampliação mínima
necessária.

## Sinais de que a refatoração deu errado

- O teste precisou ser alterado para passar (comportamento mudou sem querer).
- O diff ficou impossível de revisar.
- A abstração nova só tem um uso e existe "para o futuro".
- Ficou mais difícil explicar o código para alguém novo.

Nesse caso, volte. `git reset` é mais barato que uma abstração errada consolidada.
