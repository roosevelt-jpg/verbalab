import { NextResponse } from 'next/server';

/** Lightweight liveness for Fly / Docker HEALTHCHECK (polish #4). */
export function GET() {
  return NextResponse.json({ status: 'ok', service: 'verbalab-web' });
}
