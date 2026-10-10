import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Soft-sandbox integrity verify for marketing / docs demos when callers hit the web app.
 * Proxies to the Lugemi API when reachable; otherwise returns an honest local demo verdict.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_URL}/v1/language-integrity/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (upstream.ok) {
      return NextResponse.json(await upstream.json());
    }
  } catch {
    // fall through
  }

  const watermark = String(body.watermarkHeader ?? '').toLowerCase();
  const consent = body.consentAttested === true;
  const watermarkOk = watermark === 'required' || watermark === 'present' || watermark === 'true';
  const verdict = watermarkOk && consent ? 'attested' : watermarkOk || consent ? 'partial' : 'unattested';

  return NextResponse.json({
    product: 'Lugemi Language Integrity',
    mode: 'demo',
    verdict,
    summary:
      verdict === 'attested'
        ? 'Demo sandbox: watermark disclosure + consent signals present.'
        : 'Demo sandbox: incomplete Lugemi attestation — do not treat as provenanced speech.',
    findings: [
      {
        code: 'demo',
        severity: 'info',
        detail: 'Served by /api/demo/integrity-verify soft-sandbox (API unreachable).',
      },
      {
        code: 'watermark',
        severity: watermarkOk ? 'pass' : 'warn',
        detail: watermarkOk
          ? 'Watermark header recognized in demo claim.'
          : 'No valid Lugemi watermark header in demo claim.',
      },
      {
        code: 'consent',
        severity: consent ? 'pass' : 'warn',
        detail: consent ? 'Consent attested in demo claim.' : 'Consent not attested in demo claim.',
      },
    ],
    honesty: {
      deepfakeDetectionClaimed: false,
      courtroomCertificationClaimed: false,
    },
    docs: '/docs/LANGUAGE_INTEGRITY.md',
  });
}

export async function GET() {
  return NextResponse.json({
    demo: true,
    post: '/api/demo/integrity-verify',
    upstream: `${API_URL}/v1/language-integrity/verify`,
    note: 'POST a provenance claim { watermarkHeader, consentAttested, attestationNotes, audioClaimText }.',
  });
}
