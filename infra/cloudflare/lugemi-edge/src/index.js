/**
 * lugemi-edge — thin Cloudflare Worker BFF for public API catalogs.
 *
 * - Cache allowlisted GET catalogs (short TTL + SWR-style Cache-Control)
 * - Forward CF-IPCountry / CF-Connecting-IP to Fly Nest (residency / signup geo)
 * - CORS for lugemi.com / www
 * - Optional Turnstile siteverify before origin on gated POSTs
 *
 * Free tier: 100k req/day, 10 ms CPU. Do not put Nest/Prisma/SSE/TTS here.
 */

/** @typedef {{ ORIGIN_API_URL: string, CORS_ORIGINS: string, CACHE_TTL_SECONDS: string, TURNSTILE_SECRET_KEY?: string, TURNSTILE_REQUIRED_PATHS?: string, RATE_LIMITER?: { limit: (opts: { key: string }) => Promise<{ success: boolean }> } }} Env */

const CACHEABLE_PREFIXES = [
  '/v1/languages',
  '/v1/locales',
  '/v1/accents',
  '/v1/models',
  '/v1/portfolio',
  '/v1/country-packs',
  '/v1/residency',
  '/health',
];

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'cf-worker',
]);

export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsOrigins = (env.CORS_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const originHeader = request.headers.get('Origin') || '';
    const corsOrigin = corsOrigins.includes(originHeader) ? originHeader : null;

    if (request.method === 'OPTIONS') {
      return corsPreflight(corsOrigin);
    }

    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.RATE_LIMITER.limit({
        key: `${ip}:${request.method}:${url.pathname}`,
      });
      if (!success) {
        return withCors(
          new Response(JSON.stringify({ error: 'rate_limited' }), {
            status: 429,
            headers: { 'content-type': 'application/json' },
          }),
          corsOrigin,
        );
      }
    }

    if (
      request.method === 'POST' &&
      env.TURNSTILE_SECRET_KEY &&
      pathRequiresTurnstile(url.pathname, env.TURNSTILE_REQUIRED_PATHS)
    ) {
      const ok = await verifyTurnstile(request, env.TURNSTILE_SECRET_KEY);
      if (!ok) {
        return withCors(
          new Response(JSON.stringify({ error: 'turnstile_failed' }), {
            status: 403,
            headers: { 'content-type': 'application/json' },
          }),
          corsOrigin,
        );
      }
    }

    if (
      request.method === 'GET' &&
      isCacheablePath(url.pathname) &&
      !request.headers.get('Authorization') &&
      !request.headers.get('Cookie')
    ) {
      return cacheableGet(request, url, env, ctx, corsOrigin);
    }

    const upstream = await proxyToOrigin(request, url, env);
    return withCors(upstream, corsOrigin);
  },
};

/**
 * @param {string} pathname
 */
function isCacheablePath(pathname) {
  return CACHEABLE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

/**
 * @param {string} pathname
 * @param {string | undefined} csv
 */
function pathRequiresTurnstile(pathname, csv) {
  if (!csv || !csv.trim()) return false;
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/**
 * @param {Request} request
 * @param {URL} url
 * @param {Env} env
 * @param {ExecutionContext} ctx
 * @param {string | null} corsOrigin
 */
async function cacheableGet(request, url, env, ctx, corsOrigin) {
  const cache = caches.default;
  const cacheKey = new Request(cacheKeyUrl(url), { method: 'GET' });
  const hit = await cache.match(cacheKey);
  if (hit) {
    const out = new Response(hit.body, hit);
    out.headers.set('X-Lugemi-Edge-Cache', 'HIT');
    return withCors(out, corsOrigin);
  }

  const upstream = await proxyToOrigin(request, url, env);
  const ttl = Math.max(30, Number(env.CACHE_TTL_SECONDS || 120) || 120);
  const out = new Response(upstream.body, upstream);
  out.headers.set(
    'Cache-Control',
    `public, max-age=${ttl}, stale-while-revalidate=${ttl * 5}`,
  );
  out.headers.set('X-Lugemi-Edge-Cache', 'MISS');
  out.headers.delete('Set-Cookie');

  if (upstream.status === 200) {
    ctx.waitUntil(cache.put(cacheKey, out.clone()));
  }

  return withCors(out, corsOrigin);
}

/**
 * @param {URL} url
 */
function cacheKeyUrl(url) {
  const key = new URL(url.toString());
  key.searchParams.sort();
  return key.toString();
}

/**
 * @param {Request} request
 * @param {URL} url
 * @param {Env} env
 */
async function proxyToOrigin(request, url, env) {
  const base = (env.ORIGIN_API_URL || '').replace(/\/$/, '');
  if (!base) {
    return new Response(JSON.stringify({ error: 'ORIGIN_API_URL unset' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const target = new URL(base + url.pathname + url.search);
  const headers = new Headers();
  for (const [k, v] of request.headers) {
    if (HOP_BY_HOP.has(k.toLowerCase())) continue;
    headers.set(k, v);
  }

  // Nest clerk-auth.guard reads cf-ipcountry / x-lugemi-registered-from for signup geo.
  const country = request.headers.get('CF-IPCountry');
  const connectingIp = request.headers.get('CF-Connecting-IP');
  if (country && country !== 'XX' && country !== 'T1') {
    headers.set('CF-IPCountry', country);
    headers.set('X-Lugemi-Registered-From', country);
    headers.set('X-Lugemi-IP-Country', country);
  }
  if (connectingIp) {
    headers.set('CF-Connecting-IP', connectingIp);
    headers.set('X-Forwarded-For', connectingIp);
  }
  headers.set('X-Lugemi-Edge', 'lugemi-edge');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    // @ts-expect-error duplex needed for streaming bodies in some runtimes
    init.duplex = 'half';
  }

  return fetch(target.toString(), init);
}

/**
 * @param {Request} request
 * @param {string} secret
 */
async function verifyTurnstile(request, secret) {
  let token =
    request.headers.get('cf-turnstile-response') ||
    request.headers.get('x-turnstile-token') ||
    '';
  if (!token) {
    try {
      const clone = request.clone();
      const ct = clone.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const body = await clone.json();
        token = body?.turnstileToken || body?.['cf-turnstile-response'] || '';
      }
    } catch {
      return false;
    }
  }
  if (!token) return false;

  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) form.set('remoteip', ip);

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: form },
  );
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data?.success);
}

/**
 * @param {string | null} corsOrigin
 */
function corsPreflight(corsOrigin) {
  const headers = new Headers({
    'access-control-allow-methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers':
      'Authorization,Content-Type,X-Lugemi-Workspace-Id,X-Lugemi-Organization-Id,X-Lugemi-Registered-From,CF-Turnstile-Response,X-Turnstile-Token',
    'access-control-max-age': '86400',
  });
  if (corsOrigin) headers.set('access-control-allow-origin', corsOrigin);
  return new Response(null, { status: 204, headers });
}

/**
 * @param {Response} response
 * @param {string | null} corsOrigin
 */
function withCors(response, corsOrigin) {
  if (!corsOrigin) return response;
  const out = new Response(response.body, response);
  out.headers.set('access-control-allow-origin', corsOrigin);
  out.headers.set('vary', mergeVary(out.headers.get('vary'), 'Origin'));
  return out;
}

/**
 * @param {string | null} existing
 * @param {string} value
 */
function mergeVary(existing, value) {
  if (!existing) return value;
  const parts = existing.split(',').map((s) => s.trim());
  if (!parts.includes(value)) parts.push(value);
  return parts.join(', ');
}
