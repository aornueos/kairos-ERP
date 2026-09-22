---
name: lgpd
description: LGPD aplicada ao KAIROS — mapeamento de dados pessoais, bases legais, direitos do titular, retenção, anonimização e incidentes. Use ao tratar dado pessoal, exportar base ou responder pedido de titular.
---

# LGPD

O KAIROS trata dados pessoais de clientes pessoa física, contatos de salões,
colaboradores e representantes. A Pure.us é controladora; fornecedores de nuvem,
provedor fiscal e agregador bancário são operadores.

## Mapeamento

| Dado | Onde | Base legal | Retenção |
|---|---|---|---|
| Cadastro de cliente PF (nome, CPF, endereço, contato) | `parceiro` | execução de contrato | 5 anos após a última operação |
| Contato de salão (nome, e-mail, telefone) | `parceiro_contato` | legítimo interesse | até revogação |
| Dados em nota fiscal | `nota_fiscal` | obrigação legal | 5 anos (não apagar) |
| Colaborador (documentos, dependentes) | `colaborador` | obrigação legal | 30 anos (previdenciário) |
| Saúde ocupacional (ASO, CID) | `afastamento` | obrigação legal, dado sensível | 20 anos |
| Comunicação de marketing | `crm` | consentimento | até revogação |
| Logs de acesso | `auditoria` | legítimo interesse e obrigação | 5 anos |

Esse inventário é o RoPA. Mantenha atualizado em `docs/lgpd/inventario.md` sempre que uma
tabela nova guardar dado pessoal.

## Princípios no código

- **Minimização**: não colete o que não usa. Data de nascimento de contato de salão não
  serve para nada operacional.
- **Finalidade**: dado coletado para faturar não vira lista de marketing sem
  consentimento.
- **Segurança**: criptografia em trânsito e em repouso; dado sensível com acesso restrito
  e auditoria de leitura, não só de escrita.
- **Segregação**: [multi-tenancy] com RLS é também controle de privacidade.

## Direitos do titular

Tela de atendimento com prazo de 15 dias:

| Direito | Como atendemos |
|---|---|
| Confirmação e acesso | relatório com todos os dados do titular, em PDF e JSON |
| Correção | alteração cadastral com registro em auditoria |
| Portabilidade | exportação estruturada |
| Eliminação | anonimização, respeitando a guarda legal |
| Revogação de consentimento | descadastro de comunicação, imediato |

**Eliminação não apaga nota fiscal nem título**: há obrigação legal de guarda. O que se
faz é anonimizar os campos pessoais do cadastro (nome, contato, endereço), preservando os
documentos com o identificador. Explique isso ao titular na resposta — e deixe o texto
pronto, revisado por quem entende do assunto.

## Anonimização

`scripts/anonimizar-parceiro.ts` substitui nome por "Titular anonimizado #id", zera
contato e endereço, mantém CPF apenas onde a nota exige, e registra a operação em
auditoria com a solicitação que a originou.

O mesmo mecanismo gera dumps de desenvolvimento (ver [backup-restore]). Nunca leve base
de produção para a máquina de ninguém sem passar por ele.

## Incidentes

Plano em `docs/lgpd/incidentes.md`: detecção, contenção, avaliação de risco, comunicação
à ANPD e aos titulares quando houver risco relevante, e registro. Prazo de comunicação é
curto; ter o processo escrito antes é o que permite cumprir.

## Ao criar tabela ou integração

- [ ] Guarda dado pessoal? Registre no inventário com base legal e retenção.
- [ ] Sai do sistema (API, webhook, e-mail, planilha)? Envia o mínimo necessário.
- [ ] Log ou mensagem de erro carrega dado pessoal? Remova.
- [ ] Operador novo (fornecedor)? Contrato com cláusula de tratamento de dados.
