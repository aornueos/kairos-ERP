---
name: mdfe
description: MDF-e (manifesto eletrônico de documentos fiscais) no KAIROS — quando é obrigatório, emissão pelo provedor, encerramento e vínculo com a expedição. Use ao implementar transporte com veículo próprio ou carga consolidada.
---

# MDF-e

Manifesto que agrupa os documentos fiscais de uma carga em um veículo.

## Quando a Pure.us precisa emitir

- Transporte de mercadoria própria em veículo próprio ou alugado, **entre municípios**,
  com mais de uma NF-e na carga.
- Operação interestadual com carga fracionada.

Entrega local com uma nota só, ou transporte contratado de transportadora (que emite o
próprio MDF-e), não exigem manifesto nosso. A regra varia por UF: confirme com o contador
antes de ligar a obrigatoriedade.

## Dados

- Emitente, UF de início e fim do percurso, municípios de carregamento e descarregamento.
- Veículo: placa, RENAVAM, tara, capacidade; condutor com CPF.
- Documentos: chaves das NF-e transportadas.
- Seguro da carga, quando houver.
- Percurso (UFs atravessadas), CIOT quando aplicável.

## Ciclo

```
AUTORIZADO -> (viagem) -> ENCERRADO
           -> CANCELADO (antes do início do transporte)
```

**Encerramento é obrigatório** ao fim da viagem. MDF-e em aberto trava a emissão de
novos manifestos para o mesmo veículo e gera pendência na SEFAZ.

Implemente alerta diário de manifestos não encerrados há mais de 24 horas: é o erro mais
comum e ninguém lembra de encerrar.

## Integração

Gerado a partir da expedição ([logistica]): selecionar as notas da carga, o veículo e o
condutor, e emitir pelo provedor externo. O DAMDFE acompanha a carga junto com os DANFEs.

## Escopo

Fase 3, junto com a frota própria. Enquanto a Pure.us usar transportadora, o manifesto é
responsabilidade dela.
