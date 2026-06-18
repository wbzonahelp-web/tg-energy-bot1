#!/usr/bin/env python3
import subprocess
import sys
import time

USERS_FILE = "/opt/projects/new-project/database/users.txt"
CONTAINER_NAME = "telegram-postgres"
DB_USER = "bot_user"
DB_NAME = "telegram_bot_db"
BATCH_SIZE = 500

def run_sql(sql):
    """Выполняет SQL запрос через docker exec"""
    cmd = [
        "docker", "exec", CONTAINER_NAME,
        "psql", "-U", DB_USER, "-d", DB_NAME,
        "-c", sql
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout, result.stderr

def main():
    # Читаем ID пользователей
    with open(USERS_FILE, 'r') as f:
        user_ids = [line.strip() for line in f if line.strip().isdigit()]
    
    print(f"Total users to import: {len(user_ids)}")
    
    # Проверяем текущее количество
    out, err = run_sql("SELECT COUNT(*) FROM users;")
    print(f"Current users in DB: {out.split(chr(10))[2].strip()}")
    
    # Импортируем пакетами
    imported_total = 0
    skipped_total = 0
    
    for i in range(0, len(user_ids), BATCH_SIZE):
        batch = user_ids[i:i+BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(user_ids) + BATCH_SIZE - 1) // BATCH_SIZE
        
        # Создаем VALUES для INSERT
        values = ", ".join([f"({uid}, 'excel_import')" for uid in batch])
        sql = f"INSERT INTO users (user_id, source) VALUES {values} ON CONFLICT (user_id) DO NOTHING;"
        
        out, err = run_sql(sql)
        
        # Парсим результат
        if "INSERT" in out:
            parts = out.strip().split()
            affected = int(parts[-1])
            imported_total += affected
            skipped_in_batch = len(batch) - affected
            skipped_total += skipped_in_batch
            print(f"Batch {batch_num}/{total_batches}: inserted {affected}, skipped {skipped_in_batch}")
        else:
            print(f"Batch {batch_num}/{total_batches}: ERROR - {err}")
            skipped_total += len(batch)
        
        # Небольшая пауза между пакетами
        if i + BATCH_SIZE < len(user_ids):
            time.sleep(0.1)
    
    # Финальная проверка
    out, err = run_sql("SELECT COUNT(*) FROM users;")
    final_count = out.split(chr(10))[2].strip()
    
    print(f"\n{'='*50}")
    print(f"IMPORT COMPLETED!")
    print(f"{'='*50}")
    print(f"Total processed: {len(user_ids)}")
    print(f"Imported: {imported_total}")
    print(f"Skipped (already exist): {skipped_total}")
    print(f"Final users in DB: {final_count}")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
