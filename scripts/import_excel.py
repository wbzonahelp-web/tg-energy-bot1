#!/usr/bin/env python3
import sys, os, subprocess

try:
    import pandas as pd
except ImportError:
    print("Installing pandas...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "openpyxl"])
    import pandas as pd

file_path = sys.argv[1] if len(sys.argv) > 1 else "/opt/projects/new-project/uploads/users.xlsx"

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    sys.exit(1)

ext = os.path.splitext(file_path)[1].lower()
if ext in ['.xlsx', '.xls']:
    df = pd.read_excel(file_path)
elif ext == '.csv':
    df = pd.read_csv(file_path)
else:
    print(f"Unsupported format: {ext}")
    sys.exit(1)

print(f"File loaded: {len(df)} rows, {len(df.columns)} columns")
print(f"Columns: {list(df.columns)}")
print(f"\nFirst 5 rows:")
print(df.head())

# Find user_id column
user_ids = None
for col in df.columns:
    col_lower = str(col).lower().replace(' ', '_')
    if any(x in col_lower for x in ['user_id', 'userid', 'user id', 'telegram_id', 'chat_id', 'tg_id']):
        vals = df[col].dropna().astype(str).tolist()
        valid = [x.strip() for x in vals if x.strip().isdigit()]
        if len(valid) > 0:
            user_ids = valid
            print(f"\nFound ID column: '{col}' with {len(valid)} valid IDs")
            break

if not user_ids:
    print("\nSearching for numeric columns...")
    for col in df.columns:
        try:
            vals = df[col].dropna().astype(str).tolist()
            valid = [x.strip() for x in vals if x.strip().isdigit() and len(x.strip()) >= 6]
            if len(valid) > 100:
                user_ids = valid
                print(f"Found numeric column: '{col}' with {len(valid)} valid IDs")
                break
        except:
            continue

if not user_ids:
    print("Could not find user ID column!")
    print("Please rename the column to 'user_id' and try again")
    sys.exit(1)

unique_ids = sorted(set(int(x) for x in user_ids))
print(f"\nUnique user IDs: {len(unique_ids)}")

# Save to file
output_file = "/opt/projects/new-project/database/users.txt"
with open(output_file, 'w') as f:
    for uid in unique_ids:
        f.write(str(uid) + '\n')

print(f"Saved to: {output_file}")
print(f"Total unique IDs: {len(unique_ids)}")
