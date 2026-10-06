import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Same-origin proxy for GET /v1/coverage.
 * Avoids browser CORS / Private Network Access failures on the Language coverage page
 * while still serving the Nest live registry when the API is up.
 */
export async function GET() {
  try {
    const upstream = await fetch(`${API_URL}/v1/coverage`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream unreachable';
    return NextResponse.json(
      {
        error: {
          code: 'coverage_upstream_unreachable',
          message: `Cannot reach API at ${API_URL}/v1/coverage (${message}).`,
        },
      },
      { status: 502 },
    );
  }
}
