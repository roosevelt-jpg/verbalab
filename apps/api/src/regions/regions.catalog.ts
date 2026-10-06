export type RegionCode = 'us' | 'eu';

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
  return value === 'us' || value === 'eu';
}

/** This process's residency island — set per Fly app (VERBALAB_REGION). */
export function currentRegionCode(): RegionCode {
  const raw = (process.env.VERBALAB_REGION ?? 'us').trim().toLowerCase();
  return isRegionCode(raw) ? raw : 'us';
}

export function regionCatalog(): RegionDefinition[] {
  return (Object.keys(DEFAULTS) as RegionCode[]).map((code) => ({
    ...DEFAULTS[code],
    apiBaseUrl: (
      process.env[`VERBALAB_API_URL_${code.toUpperCase()}`] ??
      (code === 'us'
        ? process.env.VERBALAB_API_URL_US ?? 'https://verbalab-api.fly.dev'
        : process.env.VERBALAB_API_URL_EU ?? 'https://verbalab-api-eu.fly.dev')
    ).replace(/\/$/, ''),
    webBaseUrl: (
      process.env[`VERBALAB_WEB_URL_${code.toUpperCase()}`] ??
      (code === 'us'
        ? process.env.VERBALAB_WEB_URL_US ?? 'https://verbalab-web.fly.dev'
        : process.env.VERBALAB_WEB_URL_EU ?? 'https://verbalab-web-eu.fly.dev')
    ).replace(/\/$/, ''),
  }));
}

export function findRegion(code: string): RegionDefinition | undefined {
  return regionCatalog().find((r) => r.code === code);
}
