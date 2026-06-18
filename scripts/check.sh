#!/bin/bash
echo "=== Проверка целостности ==="

# Проверяем Docker
echo "1. Docker:"
docker ps --format "{{.Names}}: {{.Status}}" | grep -E "telegram|NAMES"

# Проверяем подключение к БД
echo "2. Database:"
docker exec telegram-postgres pg_isready -U bot_user -d telegram_bot_db

# Проверяем количество пользователей
echo "3. Users:"
docker exec telegram-postgres psql -U bot_user -d telegram_bot_db -t -c "SELECT COUNT(*) FROM users;"

# Проверяем таблицы
echo "4. Tables:"
docker exec telegram-postgres psql -U bot_user -d telegram_bot_db -c "\dt"

# Проверяем целостность данных
echo "5. Data integrity:"
docker exec telegram-postgres psql -U bot_user -d telegram_bot_db -c "
SELECT 
  'users' as table_name, 
  COUNT(*) as records,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active,
  COUNT(CASE WHEN is_banned = true THEN 1 END) as banned
FROM users
UNION ALL
SELECT 
  'mailings', 
  COUNT(*),
  COUNT(CASE WHEN status = 'completed' THEN 1 END),
  COUNT(CASE WHEN status = 'sending' THEN 1 END)
FROM mailings;
"
