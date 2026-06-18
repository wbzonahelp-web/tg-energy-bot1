#!/bin/bash
# Скрипт для резервного копирования базы данных

cd /opt/projects/new-project

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "📦 Creating backup..."

# Бэкап PostgreSQL
docker exec telegram-postgres pg_dump -U bot_user -d telegram_bot_db > \
    "$BACKUP_DIR/postgres_$DATE.sql"

# Бэкап конфигурации
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
    .env .env.example docker-compose.yml docker-compose.dev.yml database/init.sql 2>/dev/null

echo "✅ Backup created:"
echo "  - Database: $BACKUP_DIR/postgres_$DATE.sql"
echo "  - Config: $BACKUP_DIR/config_$DATE.tar.gz"
echo "  - Date: $DATE"

# Очистка старых бэкапов (оставляем последние 5)
cd $BACKUP_DIR
ls -t postgres_*.sql 2>/dev/null | tail -n +6 | xargs -r rm
ls -t config_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
cd /opt/projects/new-project
