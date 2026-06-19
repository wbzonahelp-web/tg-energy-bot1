#!/bin/bash
echo "=========================================="
echo "    МОНИТОРИНГ ВСЕХ БОТОВ"
echo "    $(date)"
echo "=========================================="
echo ""

echo "--- Docker контейнеры ---"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "telegram|NAMES"
echo ""

echo "--- Использование ресурсов ---"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "telegram|NAME"
echo ""

echo "--- Основной бот (default) ---"
docker exec telegram-postgres psql -U bot_user -d telegram_bot_db -t -c "SELECT COUNT(*) FROM users;"
echo ""

echo "--- EN бот ---"
docker exec telegram-postgres-en psql -U bot_user_en -d telegram_bot_en_db -t -c "SELECT COUNT(*) FROM users;"
echo ""

echo "--- Дисковое пространство ---"
df -h / | tail -1
echo ""
echo "=========================================="
