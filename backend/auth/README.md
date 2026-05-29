# Auth & Tenancy dentro del monorepo

Este directorio (`backend/auth`) reemplaza el placeholder Node por el microservicio Django de autenticación y tenancy.

## Qué incluye

- registro y login con JWT
- usuarios con rol global (`admin`, `provider`, `user`)
- empresas/tenants
- memberships usuario ↔ empresa
- aislamiento multi-tenant vía `X-Company-Id` o `company_id`

## Estructura

```text
backend/auth/
  auth_tenancy/
  config/
  manage.py
  requirements.txt
  Dockerfile
  entrypoint.sh
```

## Puertos en el monorepo

- puerto interno del contenedor: `3000`
- puerto publicado en host: `3001`

Base URL desde host:

```text
http://127.0.0.1:3001/api/auth/
```

## Levantar desde el monorepo

Desde `backend/`:

```bash
docker compose up --build auth auth-db
```

O todo el backend:

```bash
docker compose up --build
```

## Variables importantes

El `docker-compose.yml` del monorepo ya configura PostgreSQL para este servicio con:

- `DB_ENGINE=postgres`
- `DB_HOST=auth-db`
- `DB_PORT=5432`

Para ejecución local fuera de Docker, si no defines `DB_ENGINE=postgres`, Django usa `SQLite`.

## Comandos útiles de desarrollo

```bash
python manage.py check
python manage.py test
python manage.py migrate
python manage.py seed_auth_tenancy
```

## Endpoints principales

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `GET /api/auth/users/`
- `GET /api/auth/companies/`
- `POST /api/auth/companies/`
- `GET /api/auth/memberships/`
- `POST /api/auth/memberships/`

## Notas de arquitectura

- mantener DDD + CQRS pragmático
- evitar acceso directo al ORM desde views
- nuevos casos de uso deben entrar por `application/*` y `handlers`
- repositorios concretos viven en `infrastructure/persistence/repositories`
