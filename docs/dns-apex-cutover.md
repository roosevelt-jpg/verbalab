# Fix: lugemi.com shows `Cannot GET /` (apex → API)

## Diagnosis (verified 2026-10-07)

| Check | Result |
| --- | --- |
| `https://lugemi.com/` | Nest JSON: `{"error":{"code":"http_error","message":"Cannot GET /",...}}` |
| `https://api.lugemi.com/health` | `200` Nest health (`flyRegion: jnb`) |
| DNS `lugemi.com` A | **`66.241.125.66`** (verbalab / API Shared IPv4) |
| DNS `lugemi.com` AAAA | **`2a09:8280:1::1a9:e613:0`** (same API app) |
| DNS `www.lugemi.com` | CNAME → `lugemi.com` → same API IPs |
| DNS `api.lugemi.com` | Same IPs (correct for API) |
| `lugemi-web.fly.dev` | Does **not** resolve — web Fly app not created / not deployed |

**Root cause:** Cloudflare apex (`@`) and `www` point at the Nest Fly app (**verbalab** / API on port 3001). Nest has no `GET /`, so browsers see `Cannot GET /`. Marketing + admin must be served by **`lugemi-web`** (Next.js `apps/web`, port 3000).

## Target layout

| Public host | Fly app | Port |
| --- | --- | --- |
| `lugemi.com`, `www.lugemi.com` | **`lugemi-web`** | 3000 |
| `api.lugemi.com` | **`verbalab`** (or rename to `lugemi-api`) | 3001 |

## 1. Deploy web (needs Fly auth)

From repo root (machine with `fly auth login` or `FLY_API_TOKEN`):

```bash
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='pk_live_...'
export CLERK_SECRET_KEY='sk_live_...'   # optional at first boot; set before Clerk routes
bash scripts/fly-deploy-lugemi-web.sh
```

Manual equivalent:

```bash
fly apps create lugemi-web
fly ips allocate-v4 --shared -a lugemi-web
fly ips allocate-v6 -a lugemi-web
fly ips list -a lugemi-web

fly secrets set -a lugemi-web \
  CLERK_SECRET_KEY='sk_live_...' \
  APP_URL='https://lugemi.com'

fly deploy -c infra/fly/web.jnb.toml --dockerfile apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.lugemi.com \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... \
  --build-arg NEXT_PUBLIC_APP_URL=https://lugemi.com

fly certs add lugemi.com -a lugemi-web
fly certs add www.lugemi.com -a lugemi-web
fly certs setup lugemi.com -a lugemi-web
fly certs setup www.lugemi.com -a lugemi-web
```

Smoke on Fly hostname first:

```bash
curl -fsS https://lugemi-web.fly.dev/health
# {"status":"ok","service":"lugemi-web"}
curl -fsS -I https://lugemi-web.fly.dev/
# HTML / 200 (not Cannot GET /)
```

## 2. Exact Cloudflare DNS table (copy / paste)

After `fly ips list -a lugemi-web`, replace `WEB_IPV4` / `WEB_IPV6` with the Shared IPv4 and IPv6 printed for **`lugemi-web`**.

In **Cloudflare → DNS → Records** for zone `lugemi.com`:

| Type | Name | Content / Target | Proxy | Action |
| --- | --- | --- | --- | --- |
| `A` | `@` | **`WEB_IPV4`** ← from `fly ips list -a lugemi-web` | **DNS only** (grey) until certs green | **UPDATE** (today wrongly `66.241.125.66`) |
| `AAAA` | `@` | **`WEB_IPV6`** ← from `fly ips list -a lugemi-web` | DNS only (grey) | **UPDATE** (today wrongly `2a09:8280:1::1a9:e613:0`) |
| `CNAME` | `www` | `lugemi.com` | DNS only (grey) | Keep / ensure |
| `A` | `api` | `66.241.125.66` | DNS only or orange | **KEEP** (verbalab API) |
| `AAAA` | `api` | `2a09:8280:1::1a9:e613:0` | DNS only or orange | **KEEP** |
| `TXT` | names from `fly certs setup` (e.g. `_fly-ownership…`) | values Fly prints | **Always DNS only** | **ADD** |

### Do not

- Point `@` or `www` at `66.241.125.66` / `2a09:8280:1::1a9:e613:0` (API) — that is the current bug.
- Put Nest under `https://lugemi.com/api` — keep `https://api.lugemi.com`.

### Proxy note

Start **grey (DNS-only)** for apex/www so Fly Let’s Encrypt can issue. After `fly certs check lugemi.com -a lugemi-web` is green, you may flip to orange and set Cloudflare SSL/TLS → **Full (strict)**.

## 3. Certificates UI (if you prefer dashboard over CLI)

1. [Fly dashboard](https://fly.io/dashboard) → app **`lugemi-web`** → **Certificates**.
2. Add hostname `lugemi.com`, then `www.lugemi.com`.
3. Follow the ownership / ACME DNS records Fly shows → paste as **TXT** in Cloudflare (grey cloud).
4. Wait until status is **Ready** / Issued.

Do **not** add `lugemi.com` certs on the **verbalab** API app — that would fight the web app for the same hostname.

API certs for `api.lugemi.com` stay on **verbalab** / `lugemi-api` only.

## 4. Verify

```bash
dig +short lugemi.com A      # must equal WEB_IPV4 (not 66.241.125.66)
dig +short api.lugemi.com A  # must stay 66.241.125.66

curl -fsS -I https://lugemi.com/          # HTML / Next — not Cannot GET /
curl -fsS https://lugemi.com/health       # {"status":"ok","service":"lugemi-web"}
curl -fsS https://www.lugemi.com/health
curl -fsS https://api.lugemi.com/health   # Nest health still OK
fly certs check lugemi.com -a lugemi-web
fly certs check www.lugemi.com -a lugemi-web
```

Open in a browser: `https://lugemi.com/` (marketing), `https://lugemi.com/admin` (Clerk → API at `api.lugemi.com`).

## Agent / CI note

Cloud Agent VMs without `FLY_API_TOKEN` cannot create `lugemi-web` or read its IPs. Add repository / environment secret `FLY_API_TOKEN`, then re-run `scripts/fly-deploy-lugemi-web.sh` (or the Deploy workflow with jnb web config). Until then only this runbook + script are landed in-repo.
