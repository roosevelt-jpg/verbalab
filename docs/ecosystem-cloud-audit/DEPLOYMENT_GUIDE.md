# Ecosystem Cloud — Deployment Guide (VL-259)

Reuse platform deploy docs — Ecosystem Cloud adds Nest modules, not a separate deployable.

## Paths

- Fly / general: `infra/DEPLOY.md`
- Optional EKS: `infra/AWS_EKS.md` (primary region `af-south-1`)

## Environment

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Postgres |
| Clerk / API keys | Tenant auth |
| `STRIPE_SECRET_KEY` | Billing + Connect (live payouts) |
| `STRIPE_CONNECT_RETURN_URL` / `REFRESH_URL` | Connect onboarding |
| `MARKETPLACE_PLATFORM_FEE_BPS` | Content marketplace fee (default 2000 = 20%) |
| `STRIPE_WEBHOOK_SECRET` | Checkout / account webhooks |

## Health

- `GET /health`
- Ecosystem: `GET /v1/ecosystem-cloud/products`
- Marketplace engines: `GET /v1/{plugin,model,dataset,prompt,agent,workflow,connector,voice-language}-marketplace/engine`
- Creator Economy: `GET /v1/creator-economy/engine`

## Real-money go-live bar

Do not enable live creators until: Stripe Connect env configured, royalty hand-checks reviewed, tax/dispute gaps accepted by ops/legal, PCI posture reviewed (`storesRawCardData=false` remains mandatory).
