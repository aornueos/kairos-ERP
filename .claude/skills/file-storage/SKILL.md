---
name: file-storage
description: Armazenamento de arquivos do KAIROS (S3 compatível) — upload, nomes, tipos, URLs assinadas, XML fiscal, imagens de produto e retenção. Use ao implementar anexo, foto, PDF, DANFE ou importação de arquivo.
---

# Armazenamento de arquivos

S3-compatível: MinIO em desenvolvimento, Cloudflare R2 ou S3 em produção. Nada de arquivo
no disco do container — o container morre, o arquivo vai junto.

## Organização

```
kairos/<tenantId>/fiscal/<ano>/<mes>/<chave44>.xml
kairos/<tenantId>/fiscal/<ano>/<mes>/<chave44>.pdf
kairos/<tenantId>/produto/<produtoId>/<hash>.webp
kairos/<tenantId>/anexo/<entidade>/<entidadeId>/<uuid>-<nome-normalizado>
kairos/<tenantId>/importacao/<uuid>.csv
kairos/<tenantId>/relatorio/<uuid>.xlsx
```

Prefixo de tenant sempre primeiro: simplifica política de acesso, contabilidade de uso e
exportação de dados do tenant.

## Metadados no banco

```
arquivo(id, tenant_id, chave, nome_original, tipo_mime, tamanho, hash_sha256,
        entidade, entidade_id, criado_por, criado_em)
```

`hash_sha256` evita duplicar o mesmo anexo e serve de verificação de integridade.

## Upload

- URL pré-assinada gerada pelo servidor, com validade de 5 minutos; o navegador envia
  direto ao bucket.
- Limite padrão: 10 MB por arquivo, 25 MB para importação de planilha.
- Whitelist de MIME por finalidade. Detecte o tipo pelo conteúdo (magic bytes), não pela
  extensão.
- Bloqueie executáveis, HTML e SVG em anexo (SVG carrega script).
- Nome do arquivo é normalizado; o nome original fica só no banco.
- Registre o arquivo no banco somente após o upload confirmado; arquivos órfãos são
  varridos por job diário.

## Download

Sempre por URL assinada de curta duração emitida depois de verificar permissão. Bucket
privado, sem exceção. Imagem pública de produto usa bucket separado com CDN, apenas se
houver vitrine externa.

## XML e PDF fiscais

Guarda obrigatória de 5 anos. Bucket com versionamento e Object Lock quando o provedor
suportar. O XML autorizado nunca é sobrescrito; cancelamento e CC-e são arquivos novos
vinculados à mesma chave. Ver [nfe].

## Imagens de produto

Converta para WebP em três tamanhos (miniatura 128, catálogo 512, detalhe 1280) em job
após o upload. Foto de rótulo e de lote é evidência de rastreabilidade: preserve o
original, não só o derivado.

## Retenção e limpeza

| Tipo | Retenção |
|---|---|
| XML/PDF fiscal | 5 anos (legal) |
| Anexo de documento | vida do documento + 5 anos |
| Importação | 90 dias |
| Relatório gerado | 7 dias |
| Temporário de upload não confirmado | 24 horas |
