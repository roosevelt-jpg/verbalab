export type RegionCode = 'us' | 'eu' | 'af';

export type RegionDefinition = {
  code: RegionCode;
  name: string;
  /** Fly primary_region for this residency island */
  flyRegion: string;
  residencyLabel: string;
  /** Public API base URL for this island (override via env). */
  apiBaseUrl: string;
  webBaseUrl: string;
};

const DEFAULTS: Record<RegionCode, Omit<RegionDefinition, 'apiBaseUrl' | 'webBaseUrl'>> = {
  af: {
    code: 'af',
    name: 'Africa',
    flyRegion: 'jnb',
    residencyLabel: 'Africa (Johannesburg)',
  },
  us: {
    code: 'us',
    name: 'United States',
    flyRegion: 'iad',
    residencyLabel: 'US / Americas',
  },
  eu: {
    code: 'eu',
    name: 'European Union',
    flyRegion: 'ams',
    residencyLabel: 'EU residency',
  },
};

export function isRegionCode(value: string): value is RegionCode {
  return value === 'us' || value === 'eu' || value === 'af';
}

/** This process's residency island — set per Fly app (LUGEMI_REGION). */
export function currentRegionCode(): RegionCode {
  const raw = (process.env.LUGEMI_REGION ?? 'us').trim().toLowerCase();
  return isRegionCode(raw) ? raw : 'us';
}

function defaultApiUrl(code: RegionCode): string {
  if (code === 'af') {
    return (
      process.env.LUGEMI_API_URL_AF ??
      process.env.LUGEMI_API_URL ??
      'https://verbalab-api.fly.dev'
    );
  }
  if (code === 'eu') {
    return process.env.LUGEMI_API_URL_EU ?? 'https://lugemi-api-eu.fly.dev';
  }
  return process.env.LUGEMI_API_URL_US ?? 'https://lugemi-api.fly.dev';
}

function defaultWebUrl(code: RegionCode): string {
  if (code === 'af') {
    return (
      process.env.LUGEMI_WEB_URL_AF ??
      process.env.LUGEMI_WEB_URL ??
      'https://verbalab-web.fly.dev'
    );
  }
  if (code === 'eu') {
    return process.env.LUGEMI_WEB_URL_EU ?? 'https://lugemi-web-eu.fly.dev';
  }
  return process.env.LUGEMI_WEB_URL_US ?? 'https://lugemi-web.fly.dev';
}

export function regionCatalog(): RegionDefinition[] {
  return (Object.keys(DEFAULTS) as RegionCode[]).map((code) => ({
    ...DEFAULTS[code],
    apiBaseUrl: (
      process.env[`LUGEMI_API_URL_${code.toUpperCase()}`] ?? defaultApiUrl(code)
    ).replace(/\/$/, ''),
    webBaseUrl: (
      process.env[`LUGEMI_WEB_URL_${code.toUpperCase()}`] ?? defaultWebUrl(code)
    ).replace(/\/$/, ''),
  }));
}

export function findRegion(code: string): RegionDefinition | undefined {
  return regionCatalog().find((r) => r.code === code);
}
