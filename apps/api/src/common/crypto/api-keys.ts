import { createHash, randomBytes } from 'crypto';

export type ApiKeyEnvironment = 'live' | 'test';

/** Current Lugemi prefixes (issued for new keys). */
const LIVE_PREFIX = 'lg_live_';
const TEST_PREFIX = 'lg_test_';

/** Legacy VerbaLab prefixes — accepted for one release. */
const LEGACY_LIVE_PREFIX = 'vl_live_';
const LEGACY_TEST_PREFIX = 'vl_test_';

export function keyPrefixForEnvironment(environment: ApiKeyEnvironment): string {
  return environment === 'test' ? TEST_PREFIX : LIVE_PREFIX;
}

export function environmentFromSecret(secret: string): ApiKeyEnvironment | null {
  if (secret.startsWith(TEST_PREFIX) || secret.startsWith(LEGACY_TEST_PREFIX)) return 'test';
  if (secret.startsWith(LIVE_PREFIX) || secret.startsWith(LEGACY_LIVE_PREFIX)) return 'live';
  return null;
}

export function generateApiKeySecret(
  environment: ApiKeyEnvironment = 'live',
): { secret: string; prefix: string; hash: string; environment: ApiKeyEnvironment } {
  const keyPrefix = keyPrefixForEnvironment(environment);
  const raw = randomBytes(24).toString('base64url');
  const secret = `${keyPrefix}${raw}`;
  const prefix = secret.slice(0, 16);
  return { secret, prefix, hash: hashApiKey(secret), environment };
}

export function hashApiKey(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function looksLikeApiKey(token: string): boolean {
  return (
    token.startsWith(LIVE_PREFIX) ||
    token.startsWith(TEST_PREFIX) ||
    token.startsWith(LEGACY_LIVE_PREFIX) ||
    token.startsWith(LEGACY_TEST_PREFIX)
  );
}
