# ADR-0043: Multi-region as residency islands

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-075

## Context

Some buyers require data residency (e.g. EU). VL-074 ships one Fly region. A global mesh / multi-master DB is out of scope and would fake completeness.

## Decision

1. **Separate islands:** Each region is its own Fly apps + `DATABASE_URL` / Redis — `infra/fly/api.toml` (US/`iad`) and `infra/fly/api.eu.toml` (EU/`ams`). Same for web.
2. **`LUGEMI_REGION`:** Process env (`us` | `eu`) stamped on `/health` and `X-Lugemi-Region`.
3. **Org pin:** `organizations.data_region` optional. When set, `ResidencyInterceptor` rejects authenticated traffic on the wrong island with `residency_mismatch` (points at the correct API URL).
4. **No mesh:** No cross-region replication, automatic failover, or shared control plane. Changing the pin does **not** migrate data.
5. **Catalog:** Public `GET /v1/regions`; owner `GET/PATCH /v1/organization/residency`.

## Consequences

- EU go-live = create apps, attach EU Postgres/Redis, deploy `*.eu.toml`, set secrets — not a code rewrite.
- Orgs without a pin work on any island (dev/default).
- CI proves catalog + pin enforcement without a second live Fly account.
