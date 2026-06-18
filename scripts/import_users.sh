#!/bin/bash
set -e

echo "📥 Importing users into database..."

IMPORTED=0
SKIPPED=0
TOTAL=0

while IFS= read -r line; do
    if [[ "$line" =~ ^[0-9]+$ ]]; then
        TOTAL=$((TOTAL + 1))
        RESULT=$(docker exec telegram-postgres psql -U bot_user -d telegram_bot_db -t -c \
            "INSERT INTO users (user_id, source) VALUES (${line}, 'import') ON CONFLICT (user_id) DO NOTHING RETURNING id;" 2>/dev/null)
        
        if [ -n "$RESULT" ] && [ "$RESULT" != "" ]; then
            IMPORTED=$((IMPORTED + 1))
        else
            SKIPPED=$((SKIPPED + 1))
        fi
        
        if [ $((TOTAL % 500)) -eq 0 ]; then
            echo "📊 Progress: $TOTAL processed..."
        fi
    fi
done < /opt/projects/new-project/database/users.txt

echo ""
echo "✅ Import completed!"
echo "📊 Total: $TOTAL"
echo "📥 Imported: $IMPORTED"
echo "⏭️ Skipped: $SKIPPED"
