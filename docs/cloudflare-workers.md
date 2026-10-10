# Cloudflare Workers for Lugemi (free-tier)

Companion to [`docs/cloudflare.md`](./cloudflare.md). Nest API + Next web stay on **Fly (`jnb`)**. Workers are an optional **edge BFF / cache / bot shield** in front of `api.lugemi.com` — not a Nest rewrite.

**Free Workers quotas (verify in dashboard):** **100,000 requests/day** (all Workers + Pages Functions, UTC midnight reset), **10 ms CPU/request**, 128 MB memory, 50 subrequests/request. Exceeding daily requests → Error **1027**. Do **not** invent paid plans (Argo, Advanced Rate Limiting, Images storage, Stream, Workers Paid CPU) as free.

## Top 5 uses (ranked by impact)

| Rank | Worker use | Why it helps Lugemi | Free-tier fit |
| --- | --- | --- | --- |
| **1** | **Edge cache public GET catalogs** | Languages, locales, accent identity packs, models/engine, portfolio/engine are read-heavy and change slowly. Serving from `caches.default` near the client cuts round-trips to Fly `jnb` and Nest/Postgres load. | Cache API is free within Workers; each eyeball request still counts toward **100k/day**; keep handlers under **10 ms** CPU (match → return, or short origin fetch + `put`). |
| **2** | **Thin BFF proxy for `api.lugemi.com`** | One Worker route: CORS for `lugemi.com` / `www`, `Accept-Encoding` passthrough, `stale-while-revalidate`-style Cache-Control on catalogs, strip hop-by-hop headers. Clients keep calling `api.lugemi.com`. | Same 100k/day budget; prefer caching GETs so origin traffic (Fly bill / machine CPU) drops even when every edge hit counts as a Worker request. |
| **3** | **Forward `CF-IPCountry` → residency affinity** | Nest already reads `cf-ipcountry` (and `x-lugemi-registered-from`) in `clerk-auth.guard.ts` for signup geo / residency. When the Worker `fetch`es Fly, the origin would otherwise see the Worker egress IP — so the Worker **must** forward `CF-IPCountry` (and optionally `CF-Connecting-IP` / `X-Lugemi-Registered-From`). | Header copy is negligible CPU; no paid geo product required (country is on every orange-cloud request). |
| **4** | **Turnstile siteverify at the edge** | Verify Turnstile tokens on abuse-prone public POSTs (signup-adjacent, contact, demo quotas) **before** hitting Nest on Fly. Fail closed with 403; only pass good traffic to origin. | Turnstile challenges are free; siteverify is one subrequest. Keep Worker logic tiny to stay in 10 ms. Secret stays in Worker secrets — never in the web bundle. |
| **5** | **Bot / light rate shield at the edge** | Drop obvious bot paths early; optional Workers `ratelimits` binding for a few hot routes. Prefer zone **Bot Fight Mode** + Free plan **1 IP rate-limit rule** first (does not burn Workers quota). | Workers Rate Limiting binding has no separate fee in Workers docs, but **every** shielded request still consumes the 100k/day + CPU. Zone Advanced Rate Limiting = **paid** — do not use as “free”. |

Honorable mention (lower priority on free): **Images + R2** — free **Images transformations** (~5k unique/month) on objects in R2 for CMS/marketing. Custom WASM resize inside a Worker is a poor fit for **10 ms** CPU; Images **storage/delivery** beyond transforms is **paid**.

## Recommended Worker list

| Worker | Role | Routes (sketch) |
| --- | --- | --- |
| **`lugemi-edge`** (primary) | Proxy + cache public GETs + geo headers + optional Turnstile gate + light rate limit | `api.lugemi.com/*` (or path prefix `/v1/*`) → Fly origin |
| **`lugemi-turnstile`** (optional split) | Dedicated siteverify helper if you want secrets isolated from the BFF | Internal/service binding or `POST /edge/turnstile/verify` |
| **`lugemi-media`** (later) | R2 public reads + Images transform URLs for `media.lugemi.com` | Only after R2 is wired; not required for API efficiency |

Start with **one** Worker (`lugemi-edge`) to stay under the shared 100k/day budget.

## Public GET catalogs to cache (repo-mapped)

Short TTL (e.g. **60–300 s**) + `stale-while-revalidate` on the response. Cache **key** = method + pathname + sorted query (ignore `Authorization` / cookies — these routes are public).

| Path | Module |
| --- | --- |
| `GET /v1/languages`, `/v1/languages/engine`, `/v1/languages/:code` | `apps/api/src/languages` |
| `GET /v1/locales`, `/v1/locales/engine`, `/v1/locales/:code` | `apps/api/src/locales` |
| `GET /v1/accents`, `/v1/accents/engine`, `/v1/accents/identity`, `/v1/accents/identity/:id` | `apps/api/src/accents` |
| `GET /v1/models`, `/v1/models/engine`, `/v1/models/live` | `apps/api/src/models` |
| `GET /v1/portfolio/engine`, `/v1/portfolio/corridors` | `apps/api/src/portfolio` |
| `GET /v1/country-packs`, `/v1/country-packs/engine` | `apps/api/src/country-packs` |
| `GET /v1/residency` (policy JSON/text) | `apps/api/src/residency` |
| `GET /health` | health probe (very short TTL or bypass) |

**Do not cache:** authenticated GETs, anything with `Authorization` / session cookies, `POST`/`PATCH`/`DELETE`, SSE (`/v1/live/sessions/:id/events`), TTS/audio binary, jobs, admin, billing, org residency pins.

Suggested response headers from the Worker (override or merge with origin):

```http
Cache-Control: public, max-age=120, stale-while-revalidate=600
Vary: Accept-Encoding
X-Lugemi-Edge-Cache: HIT|MISS
```

## Env bindings & secrets

| Name | Type | Purpose |
| --- | --- | --- |
| `ORIGIN_API_URL` | var | Fly origin base, e.g. `https://lugemi-api.fly.dev` (or internal host once certs settle) |
| `CORS_ORIGINS` | var | `https://lugemi.com,https://www.lugemi.com` |
| `CACHE_TTL_SECONDS` | var | Default catalog TTL (e.g. `120`) |
| `TURNSTILE_SECRET_KEY` | secret | Siteverify only; unset = skip edge Turnstile |
| `TURNSTILE_REQUIRED_PATHS` | var | Optional CSV of POST paths that require a token (e.g. `/v1/…`) |
| `RATE_LIMITER` | `ratelimits` binding | Optional; see wrangler sketch |
| *(no KV/D1 required for v1)* | — | Nest + Redis + Postgres remain source of truth |

Ops tokens (`CF_API_TOKEN`, R2 keys) stay in CI/dashboard — not in the Worker unless that Worker talks to R2.

Mirror names already in root `.env.example` / [`docs/cloudflare.md`](./cloudflare.md) for Turnstile + R2.

## Example `wrangler.toml` sketch (`lugemi-edge`)

Scaffold lives at [`infra/cloudflare/lugemi-edge`](../infra/cloudflare/lugemi-edge). Deploy is **manual / CI** — it does **not** replace Fly `fly deploy`.

```toml
name = "lugemi-edge"
main = "src/index.js"
compatibility_date = "2025-10-01"
# Free plan: keep CPU tiny
limits = { cpu_ms = 10 }

workers_dev = true
# Production: attach custom domain api.lugemi.com in dashboard (route → this Worker)
# routes = [{ pattern = "api.lugemi.com/*", zone_name = "lugemi.com" }]

[vars]
ORIGIN_API_URL = "https://lugemi-api.fly.dev"
CORS_ORIGINS = "https://lugemi.com,https://www.lugemi.com"
CACHE_TTL_SECONDS = "120"

# Optional Workers Rate Limiting (per Cloudflare location; not zone Advanced RL)
# [[ratelimits]]
# name = "RATE_LIMITER"
# namespace_id = "1001"
# [ratelimits.simple]
# limit = 120
# period = 60

# Secrets (wrangler secret put):
# TURNSTILE_SECRET_KEY
```

Worker behavior (implemented in the scaffold):

1. Handle `OPTIONS` CORS for allowlisted origins.
2. For allowlisted public `GET`s: `caches.default.match` → on miss, `fetch(ORIGIN)` with forwarded `CF-IPCountry` / `CF-Connecting-IP`, set Cache-Control, `cache.put`, return.
3. For everything else: transparent proxy to origin (no cache), still forwarding geo headers.
4. Optionally: if `TURNSTILE_SECRET_KEY` set and path is gated, siteverify then proxy.

## Efficiency wins expected

| Lever | Latency | Cost / load |
| --- | --- | --- |
| Catalog cache hit at edge | Client → nearest CF PoP instead of SA `jnb` RTT | Fewer Nest handlers + Postgres reads on Fly |
| Geo header forward | No extra hop cost | Better residency / signup affinity without client trust |
| Turnstile at edge | Slightly more edge CPU on POSTs | Blocks bots before Fly machines wake / burn CPU |
| Zone Bot Fight + 1 RL rule | N/A (not a Worker) | Same shield **without** spending 100k Workers quota |
| Thin CORS/BFF | One place for browser CORS | Avoids misconfigured client origins hitting Nest errors |

**Budget math:** 100k req/day ≈ ~1.1 req/s average. Marketing + console catalog traffic fits early; if the edge Worker fronts **all** API traffic including TTS/jobs, you will hit 1027 — so either cache-only path patterns, or keep orange-cloud CDN cache rules for static and reserve the Worker for catalogs + gated POSTs.

## What NOT to put on Workers

| Keep on Fly (Nest / Next) | Why |
| --- | --- |
| Full Nest API, Prisma, Postgres, Redis | 10 ms CPU; no durable DB on free Workers as Nest replacement |
| Long SSE / WebSocket live sessions | Streaming + long-lived connections are a poor free-Workers fit; Nest already owns `/v1/live/.../events` |
| Heavy TTS / speech / MT inference | CPU + payload size; `OWN_*` / Lugemi models stay on Fly GPUs/services |
| Clerk session crypto beyond header pass-through | Auth source of truth stays Nest + Clerk |
| Workers AI as product speech/MT | Free neurons are experiments only — not Lugemi branding ([`docs/cloudflare.md`](./cloudflare.md)) |
| D1/KV as primary catalog store | Nest seed catalogs + Postgres remain canonical; edge cache is a **replica** with TTL |

## Ops checklist

1. Orange-cloud `api.lugemi.com` (Full strict) **or** Worker custom domain — pick one clear TLS/proxy story ([Fly + Cloudflare](https://fly.io/docs/networking/understanding-cloudflare/)).
2. Deploy `lugemi-edge` with `ORIGIN_API_URL` pointing at Fly; verify `CF-IPCountry` arrives at Nest (`clerk-auth.guard`).
3. Confirm cached paths never include authenticated responses.
4. Watch Workers analytics for daily request count vs 100k; prefer zone Bot Fight over Worker-wide RL when possible.
5. Turnstile: widget on web + edge or Nest siteverify — secret only server-side.

## Related

- [`docs/cloudflare.md`](./cloudflare.md) — free Cloudflare product map, DNS, R2, Turnstile env placeholders  
- [`docs/residency.md`](./residency.md) — person vs model residency  
- [`infra/cloudflare/lugemi-edge`](../infra/cloudflare/lugemi-edge) — minimal Worker scaffold  
- [`infra/DEPLOY.md`](../infra/DEPLOY.md) — Fly deploy (unchanged by this Worker)
