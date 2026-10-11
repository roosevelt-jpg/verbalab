import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Same-origin OpenAPI proxy for /docs and /docs/api.
 * Avoids browser "Load failed" from cross-origin fetch of the large openapi.json
 * (CORS/PNA/intermittent API latency) while Nest remains the source of truth.
 */
export async function GET() {
  try {
    const upstream = await fetch(`${API_URL}/v1/openapi.json`, {
      headers: { Accept: 'application/json' },
      // Edge/CDN can cache briefly; browser still gets a same-origin URL.
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(10_000),
    });
    const body = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: {
            code: 'openapi_upstream_error',
            message: `OpenAPI upstream returned HTTP ${upstream.status}.`,
          },
        },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    }
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === 'TimeoutError' || err.name === 'AbortError'
          ? 'Upstream timed out'
          : err.message
        : 'Upstream unreachable';
    return NextResponse.json(
      {
        error: {
          code: 'openapi_upstream_unreachable',
          message: `Cannot reach API at ${API_URL}/v1/openapi.json (${message}).`,
        },
      },
      { status: 502 },
    );
  }
}
