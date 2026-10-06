import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Twilio request validation:
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
export function signTwilioRequest(authToken: string, url: string, params: Record<string, string>): string {
  const data =
    url +
    Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], '');
  return createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
}

export function verifyTwilioSignature(input: {
  authToken: string;
  signature: string | undefined;
  url: string;
  params: Record<string, string>;
}): boolean {
  if (!input.authToken || !input.signature || !input.url) return false;
  const expected = signTwilioRequest(input.authToken, input.url, input.params);
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Parse application/x-www-form-urlencoded body into string map. */
export function parseFormBody(raw: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!raw) return params;
  for (const part of raw.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const key = decodeURIComponent((eq >= 0 ? part.slice(0, eq) : part).replace(/\+/g, ' '));
    const value = decodeURIComponent((eq >= 0 ? part.slice(eq + 1) : '').replace(/\+/g, ' '));
    params[key] = value;
  }
  return params;
}
