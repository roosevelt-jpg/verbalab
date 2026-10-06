import { createHmac, timingSafeEqual } from 'crypto';

/** Slack request signing: https://api.slack.com/authentication/verifying-requests-from-slack */
export function signSlackRequest(signingSecret: string, timestamp: string, rawBody: string): string {
  const base = `v0:${timestamp}:${rawBody}`;
  const digest = createHmac('sha256', signingSecret).update(base).digest('hex');
  return `v0=${digest}`;
}

export function verifySlackSignature(input: {
  signingSecret: string;
  timestamp: string | undefined;
  signature: string | undefined;
  rawBody: string;
  nowSec?: number;
  maxAgeSec?: number;
}): boolean {
  if (!input.signingSecret || !input.timestamp || !input.signature) return false;
  const ts = Number(input.timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = input.nowSec ?? Math.floor(Date.now / 1000);
  const maxAge = input.maxAgeSec ?? 60 * 5;
  if (Math.abs(now - ts) > maxAge) return false;

  const expected = signSlackRequest(input.signingSecret, input.timestamp, input.rawBody);
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
