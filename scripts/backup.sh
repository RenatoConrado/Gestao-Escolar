#!/usr/bin/env bash
# Backup lógico do PostgreSQL (pg_dump compactado) com retenção. Rode no diretório do projeto ou via cron:
#   0 2 * * *  /caminho/sige-api/scripts/backup.sh >> /var/log/sige-backup.log 2>&1
# Variáveis: BACKUP_DIR (padrão ./backups), KEEP_DAYS (padrão 14).
set -euo pipefail
umask 077                                   # backups contêm dados pessoais de alunos: só o dono lê
cd "$(dirname "$0")/.."

DEST="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
mkdir -p "$DEST"
ARQ="$DEST/sige_$(date +%F_%H%M).sql.gz"
trap 'rm -f "$ARQ.tmp"' ERR

docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' | gzip > "$ARQ.tmp"
mv "$ARQ.tmp" "$ARQ"
find "$DEST" -name 'sige_*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup concluído: $ARQ"
echo "Copie periodicamente para outro dispositivo (pendrive/HD externo/nuvem): o cartão SD também pode falhar."
