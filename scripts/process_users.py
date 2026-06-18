#!/usr/bin/env python3
import re
import sys

# Читаем весь ввод
input_text = sys.stdin.read()

# Извлекаем все числа (ID пользователей)
user_ids = re.findall(r'\b\d{5,12}\b', input_text)

# Убираем дубликаты и сортируем
unique_ids = sorted(set(user_ids), key=lambda x: int(x))

# Записываем в файл
with open('/opt/projects/new-project/database/users.txt', 'w') as f:
    for uid in unique_ids:
        f.write(uid + '\n')

print(f"📊 Extracted {len(unique_ids)} unique user IDs")
print(f"📁 Saved to /opt/projects/new-project/database/users.txt")
