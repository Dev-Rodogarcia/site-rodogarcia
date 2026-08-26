# Backup e Restore da Persistencia JSON

Este projeto usa persistencia local em `site/backend/storage`, incluindo conteudo canonico, arquivos privados e uploads de runtime. Backups devem ser tratados como material sensivel.

## Criar Backup

Na raiz do repositorio:

```powershell
node scripts/backup-storage.js
```

O comando cria uma pasta em `backups/storage-<data>/` com:

- `storage/`: copia completa do `site/backend/storage`.
- `manifest.json`: origem, destino, horario e comando de restore.

Para usar outro storage ou destino:

```powershell
node scripts/backup-storage.js --source D:\rodogarcia\storage --out E:\backups-rodogarcia
```

Depois de criado, copie o backup para um local externo e protegido, como storage criptografado do provedor, cofre corporativo ou volume com politica de retencao.

## Restaurar Backup

Antes do restore, garanta que a API do CMS e qualquer outro writer autorizado não estejam escrevendo no storage.

```powershell
node scripts/restore-storage.js --backup backups/storage-2026-01-01T12-00-00-000Z --confirm-restore
```

Por padrao, o restore recria `site/backend/storage`. Se ja existir storage local, ele e movido para `backups/pre-restore-<data>/storage` antes da copia restaurada.

Para restaurar em outro destino:

```powershell
node scripts/restore-storage.js --backup E:\backups-rodogarcia\storage-2026-01-01T12-00-00-000Z --target D:\rodogarcia\storage --confirm-restore
```

## Regras Operacionais

- Nunca versionar backups, `site/backend/storage/private/**` ou `site/backend/storage/uploads/**`.
- Fazer backup antes de deploys grandes, migrações de schema, limpezas de mídia ou alterações em repositories.
- Validar restore em ambiente isolado antes de aplicar em produção.
- Manter pelo menos uma copia fora da maquina da aplicacao.
- Proteger backups com controle de acesso, pois podem conter usuarios, sessoes, leads, consentimentos e uploads.
