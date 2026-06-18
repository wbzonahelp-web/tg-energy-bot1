#!/bin/bash

# Скрипт для массового импорта пользователей в PostgreSQL

DATABASE_URL="postgresql://bot_user:SecurePass2024!@localhost:5432/telegram_bot_db"
CONTAINER_NAME="telegram-postgres"
BATCH_SIZE=1000
USERS_FILE="/opt/projects/new-project/database/users.txt"

echo "🚀 Starting bulk import..."
echo "📁 Users file: $USERS_FILE"

# Проверяем наличие файла
if [ ! -f "$USERS_FILE" ]; then
    echo "❌ File $USERS_FILE not found!"
    exit 1
fi

# Подсчитываем количество ID
TOTAL_IDS=$(grep -c -E '^[0-9]+$' "$USERS_FILE")
echo "📊 Total IDs found: $TOTAL_IDS"

if [ "$TOTAL_IDS" -eq 0 ]; then
    echo "❌ No valid IDs found in file!"
    exit 1
fi

# Создаем временный SQL файл
SQL_FILE="/tmp/import_users.sql"
echo "📝 Creating SQL file: $SQL_FILE"

# Формируем SQL запрос с множественным INSERT
echo "BEGIN;" > "$SQL_FILE"
echo "INSERT INTO users (user_id, source) VALUES" >> "$SQL_FILE"

# Счетчики
FIRST=1
COUNT=0
BATCH_COUNT=0

while IFS= read -r line; do
    # Проверяем что строка - число
    if [[ "$line" =~ ^[0-9]+$ ]]; then
        if [ "$FIRST" -eq 1 ]; then
            echo "($line, 'import')" >> "$SQL_FILE"
            FIRST=0
        else
            echo ", ($line, 'import')" >> "$SQL_FILE"
        fi
        COUNT=$((COUNT + 1))
        
        # Разбиваем на пакеты по BATCH_SIZE
        if [ "$COUNT" -ge "$BATCH_SIZE" ]; then
            echo "ON CONFLICT (user_id) DO NOTHING;" >> "$SQL_FILE"
            echo "COMMIT;" >> "$SQL_FILE"
            
            BATCH_COUNT=$((BATCH_COUNT + 1))
            echo "📦 Batch $BATCH_COUNT created ($COUNT users)"
            
            # Выполняем SQL для текущего пакета
            echo "⏳ Executing batch $BATCH_COUNT..."
            docker exec -i $CONTAINER_NAME psql -U bot_user -d telegram_bot_db < "$SQL_FILE"
            
            # Проверяем результат
            RESULT=$(docker exec $CONTAINER_NAME psql -U bot_user -d telegram_bot_db -t -c "SELECT COUNT(*) FROM users;")
            echo "✅ Current users in DB: $RESULT"
            
            # Сбрасываем для следующего пакета
            echo "BEGIN;" > "$SQL_FILE"
            echo "INSERT INTO users (user_id, source) VALUES" >> "$SQL_FILE"
            FIRST=1
            COUNT=0
        fi
    fi
done < "$USERS_FILE"

# Обрабатываем остаток
if [ "$COUNT" -gt 0 ]; then
    echo "ON CONFLICT (user_id) DO NOTHING;" >> "$SQL_FILE"
    echo "COMMIT;" >> "$SQL_FILE"
    
    BATCH_COUNT=$((BATCH_COUNT + 1))
    echo "📦 Final batch $BATCH_COUNT created ($COUNT users)"
    
    echo "⏳ Executing final batch..."
    docker exec -i $CONTAINER_NAME psql -U bot_user -d telegram_bot_db < "$SQL_FILE"
fi

# Финальная проверка
FINAL_COUNT=$(docker exec $CONTAINER_NAME psql -U bot_user -d telegram_bot_db -t -c "SELECT COUNT(*) FROM users;")
echo ""
echo "✅ Import completed!"
echo "📊 Total batches: $BATCH_COUNT"
echo "👥 Users in database: $FINAL_COUNT"

# Очистка
rm -f "$SQL_FILE"

echo "🧹 Temporary SQL file removed"
