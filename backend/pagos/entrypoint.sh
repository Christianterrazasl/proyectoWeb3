#!/bin/sh
set -e

python - <<'PY'
import os
import socket
import time


def wait_for(host: str, port: int, label: str) -> None:
    for attempt in range(30):
        try:
            with socket.create_connection((host, port), timeout=2):
                print(f"✅ {label} disponible")
                return
        except OSError:
            time.sleep(2)

    raise SystemExit(f"{label} no respondió a tiempo")


wait_for(os.getenv("POSTGRES_HOST", "pagos-db"), int(os.getenv("POSTGRES_PORT", "5432")), "PostgreSQL")
wait_for(os.getenv("MONGO_HOST", "pagos-mongo"), 27017, "MongoDB")
wait_for(os.getenv("RABBITMQ_HOST", "rabbitmq"), 5672, "RabbitMQ")
PY

python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:${PORT:-3000}
