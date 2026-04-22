#!/usr/bin/env bash
set -euo pipefail

# .env.local を読む（存在する場合）
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set"
  exit 1
fi

mkdir -p export_csv

tables=$(psql "$DATABASE_URL" -Atc \
"select tablename from pg_tables where schemaname='public' order by tablename;")

for t in $tables; do
  echo "exporting $t..."
  psql "$DATABASE_URL" -c \
    "\copy (select * from \"${t}\") to 'export_csv/${t}.csv' with csv header"
done