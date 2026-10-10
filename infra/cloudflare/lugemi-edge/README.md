# lugemi-edge (Cloudflare Worker scaffold)

Minimal edge BFF for Lugemi: cache public catalog GETs, forward `CF-IPCountry` to the Fly Nest origin, CORS for the web app.

**Does not replace Fly deploys.** Nest stays on `lugemi-api` / `jnb`. See [`docs/cloudflare-workers.md`](../../../docs/cloudflare-workers.md).

## Deploy (ops)

```bash
cd infra/cloudflare/lugemi-edge
npx wrangler deploy
# optional:
# npx wrangler secret put TURNSTILE_SECRET_KEY
```

Set `ORIGIN_API_URL` to your Fly API host. Attach `api.lugemi.com/*` as a route in the Cloudflare dashboard when ready.

Never commit secrets.
