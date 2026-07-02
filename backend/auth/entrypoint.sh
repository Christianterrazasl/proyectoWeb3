#!/bin/sh
set -e

if [ "$DB_ENGINE" = "postgres" ]; then
  python - <<'PY'
import os
import time

import psycopg

for attempt in range(30):
    try:
        connection = psycopg.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
        )
        connection.close()
        break
    except psycopg.OperationalError:
        time.sleep(2)
else:
    raise SystemExit("Database connection timeout")
PY
fi

python manage.py migrate --noinput
python manage.py seed_auth_tenancy || echo "⚠️ seed_auth_tenancy falló; el servicio seguirá arrancando"
python manage.py runserver 0.0.0.0:${PORT:-3000}
