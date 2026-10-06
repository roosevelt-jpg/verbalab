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
| `apps/web` | Fly and/or Vercel | DNS + orange cloud (or CNAME to Vercel); Analytics; Turnstile |
| `apps/api` | Fly (`lugemi-api`) | Proxied custom domain (e.g. `api.lugemi.com`); WAF/DDoS; optional edge rate-limit |
| Object files | Local disk / Fly volume | **R2** for multi-machine durability |
| Email send | Resend | Keep Resend; use Email Routing for inbound only |
| Auth | Clerk | Turnstile ahead of public endpoints; Access for internal admin if desired |

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

## Suggested DNS layout

| Hostname | Target | Proxy |
| --- | --- | --- |
| `lugemi.com` / `www` | Vercel or Fly web | Proxied (orange) if CF terminates TLS; or DNS-only if Vercel owns certs — pick one TLS owner |
| `api.lugemi.com` | Fly `lugemi-api` | Proxied; SSL Full (strict) |
| `media.lugemi.com` (optional) | R2 custom domain | Proxied or R2 public bucket |

Avoid double-CDN surprises: if Vercel already fronts the web app, either DNS-only at Cloudflare **or** carefully configure caching so API/auth cookies are not over-cached.

## Explicit non-goals (free tier)

- Replacing Nest/Postgres/Redis with Workers/D1 for the full API
- Cloudflare Stream as the default video pipeline without budget
- Cloudflare Images **storage** (paid) when R2 + free transforms suffice
- Marketing Lugemi speech/MT as “Workers AI”
