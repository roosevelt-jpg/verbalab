/** Live Clerk Frontend API only accepts lugemi.com (sub)domains — not bare localhost. */
export const LIVE_CLERK_LOCAL_HOST = 'local.lugemi.com';
export const LIVE_CLERK_LOCAL_ORIGIN = `https://${LIVE_CLERK_LOCAL_HOST}`;

export function isLiveClerkPublishableKey(key?: string | null): boolean {
  return Boolean(key?.startsWith('pk_live_'));
}

export function isBareLocalDevHost(hostOrHostname: string): boolean {
  const host = hostOrHostname.split(':')[0]?.toLowerCase() ?? '';
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
}

/** True when live keys are active and the request Host is bare localhost / 127.0.0.1. */
export function mustUseLiveClerkLocalOrigin(opts: {
  publishableKey?: string | null;
  hostHeader?: string | null;
}): boolean {
  if (!isLiveClerkPublishableKey(opts.publishableKey)) return false;
  return isBareLocalDevHost(opts.hostHeader ?? '');
}

export function liveClerkLocalUrl(pathnameAndSearch: string): string {
  const path = pathnameAndSearch.startsWith('/') ? pathnameAndSearch : `/${pathnameAndSearch}`;
  return `${LIVE_CLERK_LOCAL_ORIGIN}${path}`;
}
