# Deploy `lugemi-web` without pasting a Fly token to an agent

**Why you need this:** `https://lugemi.com` currently hits the Nest API app (**verbalab** → `Cannot GET /`). Marketing/admin must run on Fly app **`lugemi-web`** (Next.js). You do **not** need to paste a Fly API token into Cursor.

**Temporary workaround until cutover:** use `https://verbalab.fly.dev` for the **API only**. Do **not** point apex/`www` at the API. Cut over Cloudflare DNS only after `lugemi-web` is live and you have its Shared IPv4/IPv6.

Canonical DNS table after deploy: [`docs/dns-apex-cutover.md`](./dns-apex-cutover.md).

---

## Path A — Fly Dashboard only (no CLI)

### A1. Create the app

1. Open [https://fly.io/dashboard](https://fly.io/dashboard) and sign in to the **same org** that owns **verbalab**.
2. Click **Create app** (or **Apps** → **New app**).
3. App name: **`lugemi-web`** (exact).
4. Primary region: **Johannesburg (`jnb`)** — matches `infra/fly/web.jnb.toml`.
5. Finish create. You should land on the app overview for `lugemi-web`.

### A2. Deploy the Next.js image

Use the monorepo root as build context. Config and Dockerfile:

| Item | Path |
| --- | --- |
| Fly config | `infra/fly/web.jnb.toml` (`app = 'lugemi-web'`, region `jnb`, port **3000**) |
| Dockerfile | `apps/web/Dockerfile` |
| Repo | `roosevelt-jpg/verbalab` |

**If GitHub is connected to Fly**

1. App **`lugemi-web`** → **Deploy** / **Source** (wording varies) → connect **GitHub** → org/user → repo **`roosevelt-jpg/verbalab`**.
2. Set build to use:
   - Config file: `infra/fly/web.jnb.toml` (or paste equivalent settings: region `jnb`, internal port `3000`, health check `GET /health`).
   - Dockerfile: `apps/web/Dockerfile`
   - Build context: **repository root** (not `apps/web` alone — the Dockerfile copies the pnpm workspace).
3. Add **Docker build arguments** before deploy:
   - `NEXT_PUBLIC_API_URL` = `https://api.lugemi.com`
   - `NEXT_PUBLIC_APP_URL` = `https://lugemi.com`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = your Clerk `pk_live_…` (or `pk_test_…` for staging)
4. Trigger deploy. Wait until machines are healthy.

**If GitHub is not connected**

1. On a machine that has the repo (or Path B below), deploy once with `flyctl` so the image lands on Fly — **or** use Fly’s “Deploy from local” / CLI from your Mac (Path B).
2. Dashboard alone cannot upload an arbitrary monorepo build without a linked source or CLI; prefer Path B if GitHub deploy is unavailable.

### A3. Secrets (runtime — Secrets UI)

App **`lugemi-web`** → **Secrets** → **Set secrets**:

| Secret | Value |
| --- | --- |
| `CLERK_SECRET_KEY` | Clerk `sk_live_…` (or `sk_test_…`) |
| `APP_URL` | `https://lugemi.com` |

Notes:

- `NEXT_PUBLIC_*` must be **build args** (baked into the Next bundle), not only runtime secrets.
- `CLERK_SECRET_KEY` is runtime — set in Secrets UI (or `fly secrets set`).
- Do **not** put Nest/API secrets (`DATABASE_URL`, etc.) on `lugemi-web`.

### A4. Shared IPs (for Cloudflare)

1. App **`lugemi-web`** → **Networking** (or **IP addresses**).
2. Allocate **Shared IPv4** if none listed; allocate **IPv6** if none listed.
3. Copy:
   - **Shared IPv4** → Cloudflare `A` for `@`
   - **IPv6** → Cloudflare `AAAA` for `@`
4. Leave **verbalab** IPs (`66.241.125.66` / `2a09:8280:1::1a9:e613:0`) on **`api` only**.

### A5. Certificates (lugemi.com + www)

1. App **`lugemi-web`** → **Certificates**.
2. **Add certificate** → hostname `lugemi.com` → Create.
3. **Add certificate** → hostname `www.lugemi.com` → Create.
4. Open each hostname → copy the **DNS ownership / ACME TXT** records Fly shows.
5. In Cloudflare → DNS → Records: add those **TXT** rows with **Proxy = DNS only** (grey cloud).
6. Wait until Fly shows **Ready** / Issued.
7. Do **not** add `lugemi.com` / `www` certificates on the **verbalab** API app.

### A6. Cloudflare cutover (after `https://lugemi-web.fly.dev/health` works)

| Type | Name | Content | Proxy | Action |
| --- | --- | --- | --- | --- |
| A | `@` | Shared IPv4 of **lugemi-web** | DNS only until certs green | UPDATE |
| AAAA | `@` | IPv6 of **lugemi-web** | DNS only | UPDATE |
| CNAME | `www` | `lugemi.com` | DNS only | UPDATE/KEEP |
| A | `api` | `66.241.125.66` | DNS only or orange | KEEP |
| AAAA | `api` | `2a09:8280:1::1a9:e613:0` | DNS only or orange | KEEP |

Verify: `https://lugemi.com/` returns Next HTML (not `Cannot GET /`); `https://lugemi.com/health` → `lugemi-web`; `https://api.lugemi.com/health` still Nest.

---

## Path B — Mac Terminal (`fly auth login`, no PAT to the agent)

Browser login stays on your machine. Never paste `FLY_API_TOKEN` into chat.

```bash
# Install flyctl once if needed
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"

# Browser login (no token paste to Cursor)
fly auth login
fly auth whoami

cd /path/to/verbalab   # monorepo root

export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='pk_live_...'   # required for Clerk UI
export CLERK_SECRET_KEY='sk_live_...'                    # recommended before Clerk routes
# optional overrides:
# export FLY_WEB_APP=lugemi-web
# export FLY_PRIMARY_REGION=jnb
# export NEXT_PUBLIC_API_URL=https://api.lugemi.com
# export APP_URL=https://lugemi.com

bash scripts/fly-deploy-lugemi-web.sh
```

### What the script does (step-by-step equivalent)

```bash
fly apps create lugemi-web          # skip if it already exists
fly ips allocate-v4 --shared -a lugemi-web
fly ips allocate-v6 -a lugemi-web
fly ips list -a lugemi-web          # copy Shared IPv4 + IPv6 for Cloudflare

fly secrets set -a lugemi-web \
  CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
  APP_URL='https://lugemi.com'

fly deploy -c infra/fly/web.jnb.toml --dockerfile apps/web/Dockerfile --remote-only \
  --build-arg NEXT_PUBLIC_API_URL=https://api.lugemi.com \
  --build-arg NEXT_PUBLIC_APP_URL=https://lugemi.com \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"

fly certs add lugemi.com -a lugemi-web
fly certs add www.lugemi.com -a lugemi-web
fly certs setup lugemi.com -a lugemi-web      # TXT hints for Cloudflare
fly certs setup www.lugemi.com -a lugemi-web

curl -fsS https://lugemi-web.fly.dev/health
# expect: {"status":"ok","service":"lugemi-web"}
```

Then update Cloudflare using the table the script prints (same as Path A6). Full cutover notes: [`docs/dns-apex-cutover.md`](./dns-apex-cutover.md).

---

## Path C — “Unable to generate a Fly API token”

You do **not** need a personal access token for Path A or Path B (`fly auth login` is enough).

### Common reasons the token UI fails

1. **Wrong account** — signed into a personal Fly account that is not the org owning **verbalab**.
2. **Org permissions** — member role cannot create tokens; need Admin / Owner (or ask an org admin).
3. **Billing / payment** — org suspended or card failed; fix under Billing, then retry.
4. **Wrong token type** — “deploy token” scoped to one app vs org/account token; for local `flyctl`, prefer Account access tokens or just `fly auth login`.
5. **UI glitch** — try another browser, disable blockers, or use CLI login instead of minting a PAT.

### Create a token from the dashboard (if you still want one for CI only)

1. [https://fly.io/dashboard](https://fly.io/dashboard) → avatar / **Account** → **Access Tokens**  
   (direct: [https://fly.io/user/personal_access_tokens](https://fly.io/user/personal_access_tokens)).
2. **Create token** → name it (e.g. `ci-lugemi-web`) → create → **copy once** into GitHub Actions / local env — **not** into Cursor chat.
3. App-level: some apps offer **Settings** → deploy tokens for that app only; fine for CI deploy of `lugemi-web`, less convenient than `fly auth login` on a Mac.
4. Org tokens: **Organization** → **Access Tokens** (if your plan/UI shows it) — requires org admin.

If token creation keeps failing: use **Path B** (`fly auth login`) or **Path A** (dashboard + GitHub). Neither requires pasting a token to an agent.

---

## Quick check list

| Step | OK when |
| --- | --- |
| App exists | Dashboard shows **`lugemi-web`** |
| Deploy | `https://lugemi-web.fly.dev/health` → `service":"lugemi-web"` |
| Certs | Certificates UI Ready for `lugemi.com` + `www` |
| DNS | Apex A/AAAA = **lugemi-web** IPs; `api` still verbalab IPs |
| Site | `https://lugemi.com/` is Next.js, not `Cannot GET /` |
