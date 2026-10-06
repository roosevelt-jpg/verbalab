# Cloudflare free integrations (Lugemi)

Domain is already on **Cloudflare Registrar**. This note maps **current free / included** Cloudflare offerings to the monorepo (`apps/web` Next.js, `apps/api` NestJS on Fly/Vercel). Limits change; verify in the [Cloudflare dashboard](https://dash.cloudflare.com) and product pricing docs before relying on them in production.

**Do not treat paid add-ons as free.** Products marked “not free” below need a paid plan or usage purchase.

## Quick wins (do these first)

| Priority | Product | Why |
| --- | --- | --- |
| 1 | DNS + orange-cloud proxy + Universal SSL | CDN, free SSL, unmetered DDoS, Free Managed WAF in front of `lugemi.com` / API hostnames |
| 2 | Web Analytics | Privacy-first traffic metrics for the marketing/console site |
| 3 | Turnstile | Free bot protection on public forms (signup, contact, abuse-prone endpoints) |
| 4 | Email Routing | Free inbound `support@` / `hello@` → team inbox (sending still via Resend) |
| 5 | R2 | Durable object storage for CMS media / document uploads (10 GB-month free) |

Keep Nest on **Fly** (and optionally web on **Vercel**). Use Cloudflare as DNS/CDN/security and optional storage — not as a forced full rewrite to Pages/Workers.

## Recommendation table

| Product | Free? | How it helps Lugemi | Setup effort |
| --- | --- | --- | --- |
| **DNS / domain (Registrar)** | Domain is paid at-cost; DNS + DNSSEC included | Authoritative DNS for `lugemi.com`; auto-renew at registry price; WHOIS redaction | Already done |
| **SSL/TLS (Universal SSL)** | Yes (shared cert on Free plan) | HTTPS for proxied hostnames without separate cert plumbing | Low — enable Full (strict) once origin has valid cert |
| **CDN / proxy (orange cloud)** | Yes | Cache static Next assets; hide origin IPs; global PoPs in front of Fly/Vercel | Low — proxy A/CNAME records; tune cache rules for `/_next/static` |
| **DDoS** | Yes (unmetered L3/L4/L7 basics on Free) | Absorbs volumetric attacks before they hit Fly API machines | None once proxied |
| **WAF** | Partial free | **Free Managed Ruleset** (high-severity vulns) + custom rules + **1** IP rate-limit rule. Full Cloudflare/OWASP managed rulesets need Pro+ | Low — leave Free Managed Ruleset on; add 1 rate-limit on `/v1/*` if needed |
| **Bot Fight Mode** | Basic on Free | Cheap bot filtering at the edge (complements app rate limits in Nest/Redis) | Low |
| **Pages** | Yes (static assets unlimited; Functions share Workers Free quota) | Optional alternate host for marketing/static; **not** a drop-in for Nest. Next.js on Pages is possible but Fly/Vercel already cover web | Medium — only if migrating web off Vercel/Fly |
| **Workers** | Yes — 100k req/day, 10 ms CPU/request | Edge helpers: Turnstile verify proxy, image/CDN transforms glue, thin API gateway — **not** a replacement for Nest jobs/Postgres | Medium for small Workers; high to rehost API |
| **R2** | Yes — 10 GB-month storage, 1M Class A / 10M Class B ops/month; **egress free** | Replace local disk (`DOCUMENT_STORAGE_DIR`, CMS `/cms-media/`) for durable uploads across Fly machines | Medium — S3-compatible SDK + bucket + public/custom domain |
| **Images** | Transformations only free (5k unique transforms/month). **Storage + delivery in Images = paid** | Resize/optimize CMS or marketing images stored in R2 or elsewhere | Low–medium for transform URLs; skip Images storage unless paying |
| **Stream** | **Not free** (storage from ~$5 / 1k minutes; delivery billed). Pro/Business website plans include a small allotment | Hosted video encode/playback for CMS demos — use only if budgeted; otherwise R2 + own player | N/A for free tier |
| **Turnstile** | Yes — unlimited challenges; ≤20 widgets; 10 hostnames/widget | CAPTCHA alternative on Clerk-adjacent public flows, lead forms, abuse-prone public API demos | Low — widget on web + siteverify on API |
| **Email Routing** | Inbound unlimited free; send to **verified destinations** free. Outbound Email Sending to arbitrary recipients needs Workers Paid | `support@lugemi.com` → Gmail/workspace without running mail servers. App transactional mail stays on Resend (`RESEND_API_KEY`) | Low |
| **Web Analytics** | Yes (unlimited sites when proxied; ≤10 if not proxied). Free plan: no custom analytics rules | Privacy-first page views for `lugemi.com` without GA | Low — enable for zone or drop JS beacon |
| **Zero Trust / Access** | Free up to **50 users** | Lock staging, `/admin`, internal dashboards behind SSO/email OTP without exposing them publicly | Low–medium |
| **Workers AI** | Yes — 10k neurons/day | Optional edge experiments; **not** Lugemi’s product path (first-party models via `OWN_*` / `LUGEMI_*`) | Low to try; do not market as Lugemi inference |
| **Workers KV / D1 / Queues** | Limited free allotments | Edge config, small caches — Nest + Redis + Postgres remain source of truth | Medium |
| **Argo / Load Balancing / Advanced Rate Limiting / Advanced Cert Manager** | **Paid** | Skip until traffic or multi-origin needs justify cost | — |
| **Registrar extras** | At-cost renewals; free DNSSEC; free WHOIS redaction; Free-plan CDN/SSL when zone is on Cloudflare | Keep domain at Cloudflare; enable DNSSEC; use Email Routing MX | Low |

## Fit with current deploy

From `infra/DEPLOY.md`:

| Surface | Today | Cloudflare role |
| --- | --- | --- |
| `apps/web` | Fly (`verbalab-web`) and/or Vercel | DNS + orange cloud (or CNAME to Vercel); Analytics; Turnstile. Public: **lugemi.com** |
| `apps/api` | Fly (`verbalab-api` / `verbalab`) | Custom domain **api.lugemi.com**; WAF/DDoS; optional edge rate-limit |
| Object files | Local disk / Fly volume | **R2** for multi-machine durability |
| Email send | Resend | Keep Resend; use Email Routing for inbound only |
| Auth | Clerk | Turnstile ahead of public endpoints; Access for internal admin if desired; allow `lugemi.com` / `www` |

## Env placeholders (optional)

Unset = feature off. Never commit real secrets.

```bash
# Cloudflare zone / account (ops; not required at runtime for orange-cloud-only)
# CF_ZONE_ID=
# CF_ACCOUNT_ID=
# CF_API_TOKEN=          # scoped dashboard/API token if automating DNS/R2

# Turnstile (apps/web + apps/api siteverify)
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=
# TURNSTILE_SECRET_KEY=

# R2 (S3-compatible; apps/api object storage)
# R2_ACCOUNT_ID=
# R2_BUCKET=
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
# R2_ENDPOINT=           # https://<accountid>.r2.cloudflarestorage.com
# R2_PUBLIC_BASE_URL=    # optional public/custom domain for reads

# Web Analytics (beacon site token if not relying on proxied auto-inject)
# NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN=

# Workers AI (optional experiments only — not production Lugemi models)
# CF_AI_ACCOUNT_ID=
# CF_AI_API_TOKEN=
```

Same names are mirrored in root `.env.example`.

## Production DNS for Fly custom domains (do this)

**Goal:** browsers use brand hosts, not `*.fly.dev`.

| Public hostname | Serves | Fly app name (internal) |
| --- | --- | --- |
| `https://lugemi.com` | Next console | `verbalab-web` |
| `https://www.lugemi.com` | Same web app (redirect → apex preferred) | `verbalab-web` |
| `https://api.lugemi.com` | Nest API | `verbalab-api` (or single-app `verbalab`) |

Fly app names (`verbalab*`) are **not** the public domain. Until DNS + `fly certs` complete, only `*.fly.dev` answers — a successful Fly deploy alone does **not** make lugemi.com live.

### Exact steps

1. **Fly certificates** (from a machine with `flyctl` logged in):

```bash
fly certs add lugemi.com -a verbalab-web
fly certs add www.lugemi.com -a verbalab-web
fly certs add api.lugemi.com -a verbalab-api

fly certs setup lugemi.com -a verbalab-web
fly certs setup www.lugemi.com -a verbalab-web
fly certs setup api.lugemi.com -a verbalab-api
```

2. **Cloudflare → DNS → Records** — create (IPs from `fly ips list -a <app>`):

| Type | Name | Content | Proxy status |
| --- | --- | --- | --- |
| `A` | `@` | IPv4 of `verbalab-web` | Orange **or** DNS-only (see below) |
| `AAAA` | `@` | IPv6 of `verbalab-web` | Same as A |
| `CNAME` | `www` | `lugemi.com` | Same; optional Redirect Rule www → `https://lugemi.com` |
| `A` / `AAAA` **or** `CNAME` | `api` | IPs of `verbalab-api` **or** `verbalab-api.fly.dev` | Orange **or** DNS-only |
| `TXT` | names from `fly certs setup` (e.g. `_fly-ownership…`) | values Fly prints | **DNS-only** (grey) |

3. **Proxy choice** ([Fly docs: Understanding Cloudflare](https://fly.io/docs/networking/understanding-cloudflare/)):

| Mode | When | Cloudflare SSL |
| --- | --- | --- |
| **DNS-only (grey)** | Simplest cert issuance/renewal by Fly | N/A for edge; Fly terminates TLS |
| **Proxied (orange)** | Want CF CDN/WAF/DDoS in front | **Full (strict)** + Always Use HTTPS; keep ownership TXT DNS-only |

4. **App secrets / Clerk** (after hosts resolve):

```bash
# API
fly secrets set -a verbalab-api \
  CORS_ORIGIN='https://lugemi.com,https://www.lugemi.com' \
  APP_URL='https://lugemi.com' \
  APP_PUBLIC_URL='https://lugemi.com'

# Web rebuild with brand API URL
fly deploy -c infra/fly/web.jnb.toml --dockerfile apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.lugemi.com \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

Clerk: allow origins `https://lugemi.com` and `https://www.lugemi.com`. Nest CORS also hard-allows those plus `https://api.lugemi.com` (`apps/api/src/main.ts`).

5. **Verify** (only claim live after these succeed):

```bash
fly certs check lugemi.com -a verbalab-web
fly certs check api.lugemi.com -a verbalab-api
curl -fsS https://lugemi.com/health
curl -fsS https://api.lugemi.com/health
```

### Suggested DNS layout (summary)

| Hostname | Target | Proxy |
| --- | --- | --- |
| `lugemi.com` / `www` | Fly `verbalab-web` (or Vercel if web stays there) | Orange if CF terminates TLS; DNS-only if Fly/Vercel owns certs alone — pick one TLS owner |
| `api.lugemi.com` | Fly `verbalab-api` / `verbalab` | Orange (Full strict) **or** DNS-only |
| `media.lugemi.com` (optional) | R2 custom domain | Proxied or R2 public bucket |

Avoid double-CDN surprises: if Vercel already fronts the web app, either DNS-only at Cloudflare **or** carefully configure caching so API/auth cookies are not over-cached. Prefer **one** origin for `lugemi.com` (Fly **or** Vercel), not both.

## Explicit non-goals (free tier)

- Replacing Nest/Postgres/Redis with Workers/D1 for the full API
- Cloudflare Stream as the default video pipeline without budget
- Cloudflare Images **storage** (paid) when R2 + free transforms suffice
- Marketing Lugemi speech/MT as “Workers AI”
