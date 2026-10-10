# Fly Postgres (postgres-flex) + pgvector for the lugemi-db app.
# Stock flyio/postgres-flex images do not ship pgvector; Prisma migrations need `CREATE EXTENSION vector`.
FROM flyio/postgres-flex:18.1

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-18-pgvector \
  && rm -rf /var/lib/apt/lists/*
