/**
 * Studio-wide machine API key identity.
 * Console humans still auth with Clerk; this key is applied to Playground,
 * Creative/Voice Studio, and product paste fields (Everyday, Relay, …).
 */

export type StudioApiKeyEnvironment = 'live' | 'test';

export type StudioApiKeyIdentity = {
  id: string;
  name: string;
  prefix: string;
  environment: StudioApiKeyEnvironment;
  secret: string;
  appliedAt: string;
};

const SECRET_KEY = 'lugemi.studio.apiKey.v1';
const META_KEY = 'lugemi.studio.apiKey.meta.v1';
/** Legacy Creative-only storage — migrated on first read. */
const LEGACY_CREATIVE_KEY = 'lugemi.creative.apiKey.v1';
export const STUDIO_API_KEY_EVENT = 'lugemi:studio-api-key';

type MetaOnly = Omit<StudioApiKeyIdentity, 'secret'>;

function canUseStorage(): boolean {
  return typeof window !== 'undefined';
}

export function isLugemiApiKey(value: string): boolean {
  return (
    value.startsWith('lg_live_') ||
    value.startsWith('lg_test_') ||
    value.startsWith('vl_live_') ||
    value.startsWith('vl_test_')
  );
}

function environmentFromSecret(secret: string): StudioApiKeyEnvironment {
  return secret.startsWith('lg_test_') || secret.startsWith('vl_test_') ? 'test' : 'live';
}

function prefixFromSecret(secret: string): string {
  return secret.slice(0, Math.min(16, secret.length));
}

function notify() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(STUDIO_API_KEY_EVENT));
}

function readMeta(): MetaOnly | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MetaOnly;
    if (!parsed?.prefix || !parsed?.environment) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeMeta(meta: MetaOnly) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function migrateLegacyCreativeSecret(): string {
  if (!canUseStorage()) return '';
  try {
    const legacy = window.localStorage.getItem(LEGACY_CREATIVE_KEY) ?? '';
    if (!legacy || !isLugemiApiKey(legacy)) return '';
    if (!window.localStorage.getItem(SECRET_KEY)) {
      window.localStorage.setItem(SECRET_KEY, legacy);
    }
    return legacy;
  } catch {
    return '';
  }
}

export function loadStudioApiKeySecret(): string {
  if (!canUseStorage()) return '';
  try {
    const current = window.localStorage.getItem(SECRET_KEY) ?? '';
    if (current) return current;
    return migrateLegacyCreativeSecret();
  } catch {
    return '';
  }
}

export function loadStudioApiKeyIdentity(): StudioApiKeyIdentity | null {
  const secret = loadStudioApiKeySecret();
  if (!secret || !isLugemiApiKey(secret)) return null;
  const meta = readMeta();
  if (meta && secret.startsWith(meta.prefix)) {
    return { ...meta, secret };
  }
  return {
    id: meta?.id ?? '',
    name: meta?.name || (environmentFromSecret(secret) === 'live' ? 'Live key' : 'Test key'),
    prefix: meta?.prefix || prefixFromSecret(secret),
    environment: meta?.environment || environmentFromSecret(secret),
    secret,
    appliedAt: meta?.appliedAt || new Date(0).toISOString(),
  };
}

export function applyStudioApiKey(input: {
  id: string;
  name: string;
  prefix: string;
  environment: StudioApiKeyEnvironment;
  secret: string;
}): StudioApiKeyIdentity {
  if (!isLugemiApiKey(input.secret)) {
    throw new Error('Expected an lg_live_ or lg_test_ API key');
  }
  const identity: StudioApiKeyIdentity = {
    id: input.id,
    name: input.name.trim() || 'API key',
    prefix: input.prefix || prefixFromSecret(input.secret),
    environment: input.environment || environmentFromSecret(input.secret),
    secret: input.secret.trim(),
    appliedAt: new Date().toISOString(),
  };
  if (canUseStorage()) {
    window.localStorage.setItem(SECRET_KEY, identity.secret);
    // Keep Creative tools in sync with the same secret.
    window.localStorage.setItem(LEGACY_CREATIVE_KEY, identity.secret);
    writeMeta({
      id: identity.id,
      name: identity.name,
      prefix: identity.prefix,
      environment: identity.environment,
      appliedAt: identity.appliedAt,
    });
    notify();
  }
  return identity;
}

export function clearStudioApiKey() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(SECRET_KEY);
    window.localStorage.removeItem(META_KEY);
    window.localStorage.removeItem(LEGACY_CREATIVE_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

export function subscribeStudioApiKey(listener: () => void): () => void {
  if (!canUseStorage()) return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === SECRET_KEY ||
      event.key === META_KEY ||
      event.key === LEGACY_CREATIVE_KEY ||
      event.key === null
    ) {
      listener();
    }
  };
  window.addEventListener(STUDIO_API_KEY_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(STUDIO_API_KEY_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function formatStudioApiKeyLabel(identity: StudioApiKeyIdentity | null): string {
  if (!identity) return 'Apply an API key for Studio tools';
  return `${identity.name} · ${identity.prefix}… · ${identity.environment}`;
}

/**
 * Bearer for workspace product API calls (speech, translate, Creative, Playground, Chat, …).
 *
 * Prefers the applied Studio machine key (`lg_live_` / `lg_test_`) so an issued key is
 * actually used for metering and "last used" — not skipped because the human is signed in
 * with Clerk. Falls back to the Clerk session JWT when no machine key is applied.
 *
 * Keep Clerk-only for console identity ops (create/revoke keys, billing, workspace admin).
 */
export async function resolveWorkspaceBearer(
  getSessionToken?: () => Promise<string | null | undefined>,
  overrideKey?: string,
): Promise<string | null> {
  const override = overrideKey?.trim() ?? '';
  if (override && isLugemiApiKey(override)) return override;

  const applied = loadStudioApiKeySecret();
  if (applied && isLugemiApiKey(applied)) return applied;

  if (getSessionToken) {
    try {
      const session = await getSessionToken();
      if (session) return session;
    } catch {
      /* fall through */
    }
  }
  return null;
}
