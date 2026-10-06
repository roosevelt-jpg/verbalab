# ADR-0001: Local Postgres on host port 5433

- **Status:** Accepted
- **Date:** 2026-09-06
- **Phase:** VL-002

## Context

Docker Compose originally mapped Postgres to host `5432`. On the development machine, another process already listened on `5432`, so Prisma authenticated against the wrong server.

## Decision

Map Compose Postgres to host port **5433** (`5433:5432`). Document this in `.env.example` and `docs/ENGINEERING.md`. CI continues to use the GitHub Actions Postgres service on `5432`.

## Consequences

Local `DATABASE_URL` must use port 5433. Developers with a free 5432 can change the mapping, but the repo default stays 5433 for safety on this workstation.
