# Connect lugemi.com (Cloudflare) → Fly.io

**Until Fly DNS is connected, open http://127.0.0.1:43125** (or Cursor’s port preview). Do **not** use https://lugemi.com — that hostname is not on Fly yet. `https://local.lugemi.com` is only for live Clerk keys inside the agent VM (`/etc/hosts` + HTTPS :443 proxy → Next :43125); it will not resolve on your laptop unless you add hosts and run the proxy yourself. For login on bare loopback with live keys, use **http://127.0.0.1:43125/dev-login** → hosted ticket (or switch to `pk_test_`/`sk_test_`).

> **Incident:** If `https://lugemi.com/` returns Nest JSON `Cannot GET /`, apex DNS still points at the **API** Fly app (`verbalab`, IPs `66.241.125.66` / `2a09:8280:1::1a9:e613:0`). Deploy **`lugemi-web`** and move `@` / `www` A/AAAA to the **web** IPs — keep those API IPs on **`api` only**. Exact paste table + script: [`docs/dns-apex-cutover.md`](./dns-apex-cutover.md) / `scripts/fly-deploy-lugemi-web.sh`.

**Audience:** operators who already registered `lugemi.com` on Cloudflare and want marketing + realtime admin on the brand domain.

**Outcome after you finish these steps (not before):**

| What users open | Serves |
| --- | --- |
| `https://lugemi.com/` | Marketing / landing (Next.js `lugemi-web`) |
| `https://lugemi.com/admin` or `/admin/workspaces` | Platform admin (Clerk sign-in → API in realtime) |
| `https://api.lugemi.com` | Nest API (`lugemi-api`) |

**Do not claim DNS or HTTPS is live** until Cloudflare records exist, `fly certs check` is green, and `curl https://lugemi.com` / `https://api.lugemi.com/health` succeed. A successful Fly deploy of `*.fly.dev` alone does **not** put the brand domain online.

Related detail: [`docs/fly.md`](./fly.md) (deploy/secrets), [`docs/cloudflare.md`](./cloudflare.md) (CF product map + DNS table).

---

## Architecture (two Fly apps)

| Fly app (internal name) | Region | Port | Public hostnames |
| --- | --- | --- | --- |
| `lugemi-web` | `jnb` | 3000 | `lugemi.com`, `www.lugemi.com` |
| `lugemi-api` | `jnb` | 3001 | `api.lugemi.com` |

Prefer the **API on `api.`**, not under `lugemi.com/api`. If older apps are still named `verbalab*` / `verbalab-api` / `verbalab-web`, rename or create `lugemi*` apps first (`fly apps rename …` or `fly apps create …`).

---

## 1. Deploy both apps to Fly (`jnb`) if not already

From the **repository root** (pnpm workspace must be in the Docker build context):

```bash
fly auth login

# Create apps once (skip if they already exist)
fly apps create lugemi-api
fly apps create lugemi-web

# Optional: allocate IPs early (needed for A/AAAA DNS)
fly ips allocate-v4 -a lugemi-web   # or use shared IPv4 Fly prints
fly ips allocate-v6 -a lugemi-web
fly ips allocate-v4 -a lugemi-api
fly ips allocate-v6 -a lugemi-api
fly ips list -a lugemi-web
fly ips list -a lugemi-api
```

Set **API secrets before** the first useful deploy (see §4). Then:

```bash
# API — Johannesburg configs
fly deploy -c infra/fly/api.jnb.toml --dockerfile apps/api/Dockerfile
# Equivalent: fly deploy -c apps/api/fly.toml --dockerfile apps/api/Dockerfile

# Web — bake production public env at build time
fly deploy -c infra/fly/web.jnb.toml --dockerfile apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.lugemi.com \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
# Equivalent: apps/web/fly.toml
```

Smoke-test on Fly hostnames first:

```bash
curl -fsS https://lugemi-api.fly.dev/health
curl -fsS https://lugemi-web.fly.dev/health
```

Until custom DNS + certs are done, these `*.fly.dev` URLs are the only guaranteed public endpoints.

---

## 2. Add TLS certificates on Fly

```bash
fly certs add lugemi.com -a lugemi-web
fly certs add www.lugemi.com -a lugemi-web
fly certs add api.lugemi.com -a lugemi-api
```

Print the ownership / ACME records Fly expects, then add them in Cloudflare **exactly**:

```bash
fly certs setup lugemi.com -a lugemi-web
fly certs setup www.lugemi.com -a lugemi-web
fly certs setup api.lugemi.com -a lugemi-api
```

Monitor until issued:

```bash
fly certs check lugemi.com -a lugemi-web
fly certs check www.lugemi.com -a lugemi-web
fly certs check api.lugemi.com -a lugemi-api
```

Legacy app names: pass `-a verbalab-web` / `-a verbalab-api` until renamed.

---

## 3. Cloudflare DNS (A / AAAA / CNAME + orange vs grey)

In **Cloudflare → DNS → Records** for the `lugemi.com` zone. IPs from `fly ips list -a <app>`.

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| `A` | `@` | IPv4 of `lugemi-web` | See below |
| `AAAA` | `@` | IPv6 of `lugemi-web` | Same as A |
| `CNAME` | `www` | `lugemi.com` (or `lugemi-web.fly.dev`) | Same; optional Redirect Rule www → `https://lugemi.com` |
| `A` / `AAAA` **or** `CNAME` | `api` | IPs of `lugemi-api` **or** `lugemi-api.fly.dev` | See below |
| `TXT` | names from `fly certs setup` (e.g. `_fly-ownership…`) | values Fly prints | **Always DNS-only (grey cloud)** |

### Orange cloud vs grey cloud

| Mode | Proxy icon | Best for | TLS notes |
| --- | --- | --- | --- |
| **DNS-only** | Grey | Simplest Fly Let’s Encrypt issue/renew | Fly terminates HTTPS; no CF edge SSL needed for origin |
| **Proxied** | Orange | CDN, WAF, DDoS in front of Fly | Cloudflare SSL/TLS → **Full (strict)** + Always Use HTTPS; keep ownership TXT grey |

Recommendation for first bring-up: start **grey (DNS-only)** until `fly certs check` is green, then optionally flip A/AAAA/CNAME to orange if you want Cloudflare in front. See [Fly: Understanding Cloudflare](https://fly.io/docs/networking/understanding-cloudflare/).

DNS propagation can take minutes to hours. Until records resolve and certs are issued, browsers will not reliably reach `https://lugemi.com`.

---

## 4. Secrets and build-time public env

### API (`lugemi-api`)

```bash
fly secrets set -a lugemi-api \
  DATABASE_URL='postgresql://USER:PASS@HOST:5432/DB?sslmode=require' \
  REDIS_URL='redis://...' \
  CORS_ORIGIN='https://lugemi.com,https://www.lugemi.com' \
  APP_URL='https://lugemi.com' \
  APP_PUBLIC_URL='https://lugemi.com' \
  CLERK_SECRET_KEY='sk_live_...' \
  ADMIN_EMAILS='you@company.com' \
  LUGEMI_PLATFORM_ADMIN_EMAILS='you@company.com'
```

Also set Stripe / billing URLs to `https://lugemi.com/...` when you use billing (see `.env.example` and `docs/fly.md`). Nest always allows `https://lugemi.com`, `https://www.lugemi.com`, and `https://api.lugemi.com` in CORS in addition to `CORS_ORIGIN`.

Without `DATABASE_URL`, Nest still boots and `/health` can return 200 with `database: "skipped"`, but admin and most app routes will not work against Postgres.

### Web (`lugemi-web`)

Runtime secrets:

```bash
fly secrets set -a lugemi-web \
  CLERK_SECRET_KEY='sk_live_...' \
  APP_URL='https://lugemi.com'
```

**Rebuild** with production public values (these are build args, not secrets):

| Build arg | Production value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.lugemi.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` |
| `NEXT_PUBLIC_APP_URL` | optional: `https://lugemi.com` |

Do **not** ship a production web image pointed at `localhost` or `*.fly.dev` once the custom API domain is ready — the browser calls `NEXT_PUBLIC_API_URL` for realtime admin API traffic.

---

## 5. Clerk dashboard (production URLs)

In the Clerk production instance:

1. **Domains / Allowed origins:** add `https://lugemi.com` and `https://www.lugemi.com` (keep `*.fly.dev` only if you still use Fly preview hostnames). Ensure CNAME for `clerk.lugemi.com` is active and verified so CAPTCHA / Turnstile can run on `lugemi.com`.
2. **Sign-in / sign-up / redirect URLs:** allow paths under those hosts, e.g. `https://lugemi.com/sign-in`, `https://lugemi.com/sign-up`, and redirects back to `/admin` and `/admin/workspaces`.
3. **Attack Protection / CAPTCHA:** under User & Authentication → Attack Protection, configure bot detection. Ensure OAuth (Continue with Google) is enabled as a seamless bypass when Turnstile is blocked by user ad-blockers.
4. **Password policy:** under User & Authentication → Email/Password, check password requirements (default 8 chars vs 15+).
5. Use the same **live** publishable + secret keys you set on Fly (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`).

Platform admin is gated by API allowlists (`ADMIN_EMAILS` / `LUGEMI_PLATFORM_ADMIN_EMAILS` / user IDs). Your Clerk user email must match those secrets or `/admin` will show “not on the platform admin allowlist”.

---

## 6. After DNS propagates — open marketing and admin

Only after `fly certs check` is OK and DNS resolves:

```bash
# Marketing landing
open https://lugemi.com/
# or: curl -I https://lugemi.com/

# Admin (Clerk sign-in, then realtime calls to api.lugemi.com)
open https://lugemi.com/admin
open https://lugemi.com/admin/workspaces

# API health (used by console via NEXT_PUBLIC_API_URL)
curl -fsS https://api.lugemi.com/health
```

Expected flow for admin:

1. Browser loads Next from `lugemi.com`.
2. Clerk sign-in on that host.
3. Client calls `https://api.lugemi.com/v1/admin/...` with the session token (CORS + Clerk must allow the brand origin).

If certs or DNS are still pending, use Fly URLs temporarily for debugging only:

- `https://lugemi-web.fly.dev/` and `https://lugemi-web.fly.dev/admin`
- API: `https://lugemi-api.fly.dev/health`  
  (Clerk must allow those origins too if you sign in there.)

---

## 7. Common failures

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Deploy / create app fails with **Suspended** | Fly account billing/suspension | Fix in Fly dashboard; configs here cannot unsuspend the account |
| App up but DB routes / admin empty or migrate skipped | Missing **`DATABASE_URL`** | `fly secrets set -a lugemi-api DATABASE_URL='...'` then redeploy or restart |
| `fly certs check` stuck **Pending** | DNS not pointing at Fly, or ownership TXT missing / orange-clouded | Re-run `fly certs setup`; add TXT **grey**; confirm A/AAAA/CNAME targets; try DNS-only until issued |
| Browser SSL errors on brand domain | Cert not issued yet, or orange cloud with wrong SSL mode | Wait for cert; if proxied, set Cloudflare to **Full (strict)** |
| Marketing works, admin API fails / CORS | Web built with wrong `NEXT_PUBLIC_API_URL`, or API `CORS_ORIGIN` / Clerk origins | Redeploy web with `https://api.lugemi.com`; set CORS + Clerk to `https://lugemi.com` |
| Signed in but “not on platform admin allowlist” | Email not in `ADMIN_EMAILS` / `LUGEMI_PLATFORM_ADMIN_EMAILS` | Set allowlist secret on **api**, sign out/in again |
| Only `*.fly.dev` works | Custom DNS / certs not finished | Expected until §2–§3 complete — **do not treat lugemi.com as live** |

---

## Checklist (copy/paste)

- [ ] `lugemi-api` + `lugemi-web` deployed in `jnb`
- [ ] `DATABASE_URL`, Clerk, `CORS_ORIGIN`, `APP_URL` on API; Clerk + `APP_URL` on web
- [ ] Web rebuilt with `NEXT_PUBLIC_API_URL=https://api.lugemi.com`
- [ ] `fly certs add` for apex, www, api
- [ ] Cloudflare A/AAAA/CNAME + ownership TXT (TXT grey)
- [ ] `fly certs check` green for all three hosts
- [ ] Clerk allows `https://lugemi.com` (+ www) sign-in/redirects
- [ ] Admin email on `ADMIN_EMAILS`
- [ ] Verified: `https://lugemi.com/`, `/admin`, `https://api.lugemi.com/health`
