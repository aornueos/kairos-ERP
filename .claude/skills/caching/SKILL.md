---
name: caching
description: Estratégia de cache do KAIROS (cache do Next, memória do processo, materialização no banco) e regras de invalidação. Use ao otimizar tela lenta, cachear consulta ou tratar dado desatualizado.
---

# Cache

Em ERP, dado errado em cache custa mais caro que consulta lenta. Cachear é decisão, não
reflexo: só depois de medir (ver [query-optimization]).

## Camadas permitidas

| Camada | Uso | TTL |
|---|---|---|
| Memória do processo | tabelas de domínio (NCM, CFOP, municípios, parâmetros do tenant) | até invalidação explícita |
| `unstable_cache` do Next | leitura de lista com tag por entidade | 60 s + tag |
| View materializada | relatório e dashboard | refresh por job |
| HTTP `Cache-Control` | assets e imagens de produto | 1 ano, com hash no nome |

Nunca cacheie: saldo de estoque, saldo de título, disponibilidade para venda, numeração
de documento, permissões efetivas.

## Tags e invalidação

```ts
const listar = unstable_cache(fn, ['produtos', tenantId], {
  tags: [`t:${tenantId}:produtos`], revalidate: 60,
})
// após mutação
revalidateTag(`t:${tenantId}:produtos`)
```

Toda chave e toda tag começam por `t:<tenantId>`. Cache sem tenant na chave vaza dado
entre empresas — é o pior bug possível aqui.

Invalidação acontece no mesmo caso de uso que altera o dado, não em `useEffect` da tela.

## Dados de referência

Carregados na inicialização do processo e invalidados por evento de alteração.
Como mudam raramente e são idênticos para todos os tenants, ficam em `Map` global.
Parâmetro fiscal do tenant é por tenant e entra em `Map<tenantId, Parametros>` com
invalidação explícita ao salvar.

## Materialização no banco

Preferida para agregação pesada: `mv_giro_estoque`, `mv_dre_mensal`, `mv_curva_abc`.
Atualizadas por job noturno e sob demanda com `refresh materialized view concurrently`.
A tela mostra a data da última atualização — usuário de ERP aceita dado de ontem desde
que saiba que é de ontem.

## Armadilhas

- Cachear resultado que depende de permissão do usuário sem incluir o perfil na chave.
- `revalidatePath` genérico demais, derrubando cache útil do sistema inteiro.
- Cache de 5 minutos em tela de conferência de estoque: gera contagem errada e retrabalho.
