/**
 * Lugemi data / identity residency.
 *
 * Person residency = where the person registered from (signup geo / org country / billing / explicit).
 * Model residency = the data center where that Lugemi model family is hosted.
 *
 * Affinity routing prefers matching user residency → nearby model hosting when possible.
 * This is affinity, not a hard geo-fence or multi-cloud mesh.
 */

export type HostedRegionAffinity = 'af' | 'eu' | 'us' | 'sea' | 'me' | 'na';

export type DataCenterDef = {
  /** Region / DC code used in product + API (e.g. af-west-1). */
  code: string;
  /** City / metro label. */
  city: string;
  /** ISO country of the DC. */
  country: string;
  /** Affinity bucket for selector scoring. */
  affinity: HostedRegionAffinity;
  /** Human label shown in UI. */
  label: string;
};

export const LUGEMI_DATA_CENTERS: DataCenterDef[] = [
  {
    code: 'af-west-1',
    city: 'Accra',
    country: 'GH',
    affinity: 'af',
    label: 'Accra · af-west-1',
  },
  {
    code: 'af-west-2',
    city: 'Lagos',
    country: 'NG',
    affinity: 'af',
    label: 'Lagos · af-west-2',
  },
  {
    code: 'af-south-1',
    city: 'Cape Town',
    country: 'ZA',
    affinity: 'af',
    label: 'Cape Town · af-south-1',
  },
  {
    code: 'af-east-1',
    city: 'Nairobi',
    country: 'KE',
    affinity: 'af',
    label: 'Nairobi · af-east-1',
  },
  {
    code: 'eu-west',
    city: 'Amsterdam',
    country: 'NL',
    affinity: 'eu',
    label: 'Amsterdam · eu-west',
  },
  {
    code: 'us-east',
    city: 'Ashburn',
    country: 'US',
    affinity: 'us',
    label: 'Ashburn · us-east',
  },
  {
    code: 'sea-central',
    city: 'Singapore',
    country: 'SG',
    affinity: 'sea',
    label: 'Singapore · sea-central',
  },
  {
    code: 'me-central',
    city: 'Dubai',
    country: 'AE',
    affinity: 'me',
    label: 'Dubai · me-central',
  },
];

/** Country → preferred DC affinity (Africa-first defaults). */
const COUNTRY_AFFINITY: Record<string, HostedRegionAffinity> = {
  GH: 'af',
  NG: 'af',
  ZA: 'af',
  KE: 'af',
  TZ: 'af',
  UG: 'af',
  RW: 'af',
  ET: 'af',
  SN: 'af',
  CI: 'af',
  BJ: 'af',
  TG: 'af',
  BF: 'af',
  ML: 'af',
  NE: 'af',
  CM: 'af',
  GA: 'af',
  CG: 'af',
  CD: 'af',
  AO: 'af',
  MZ: 'af',
  ZW: 'af',
  BW: 'af',
  NA: 'af',
  EG: 'me',
  MA: 'af',
  TN: 'af',
  DZ: 'af',
  LY: 'af',
  SD: 'af',
  SS: 'af',
  SO: 'af',
  DJ: 'af',
  ER: 'af',
  GM: 'af',
  GW: 'af',
  GN: 'af',
  SL: 'af',
  LR: 'af',
  MR: 'af',
  CV: 'af',
  ST: 'af',
  GQ: 'af',
  CF: 'af',
  TD: 'af',
  BI: 'af',
  MW: 'af',
  ZM: 'af',
  LS: 'af',
  SZ: 'af',
  MU: 'af',
  SC: 'af',
  KM: 'af',
  MG: 'af',
  // EU / UK
  NL: 'eu',
  DE: 'eu',
  FR: 'eu',
  BE: 'eu',
  IE: 'eu',
  ES: 'eu',
  PT: 'eu',
  IT: 'eu',
  AT: 'eu',
  SE: 'eu',
  NO: 'eu',
  DK: 'eu',
  FI: 'eu',
  PL: 'eu',
  GB: 'eu',
  UK: 'eu',
  CH: 'eu',
  // North America
  US: 'us',
  CA: 'na',
  MX: 'na',
  // SEA
  SG: 'sea',
  MY: 'sea',
  ID: 'sea',
  TH: 'sea',
  VN: 'sea',
  PH: 'sea',
  // Middle East
  AE: 'me',
  SA: 'me',
  QA: 'me',
  BH: 'me',
  KW: 'me',
  JO: 'me',
  IL: 'me',
};

/** Country → preferred data-center code (city affinity). */
const COUNTRY_DC: Record<string, string> = {
  GH: 'af-west-1',
  NG: 'af-west-2',
  BJ: 'af-west-2',
  TG: 'af-west-1',
  CI: 'af-west-1',
  SN: 'af-west-1',
  ZA: 'af-south-1',
  BW: 'af-south-1',
  NA: 'af-south-1',
  MZ: 'af-south-1',
  ZW: 'af-south-1',
  KE: 'af-east-1',
  TZ: 'af-east-1',
  UG: 'af-east-1',
  RW: 'af-east-1',
  ET: 'af-east-1',
  NL: 'eu-west',
  DE: 'eu-west',
  FR: 'eu-west',
  GB: 'eu-west',
  UK: 'eu-west',
  IE: 'eu-west',
  US: 'us-east',
  CA: 'us-east',
  SG: 'sea-central',
  MY: 'sea-central',
  ID: 'sea-central',
  AE: 'me-central',
  SA: 'me-central',
  EG: 'me-central',
};

export type ModelHostingSeed = {
  hostedResidency: string;
  dataCenter: string;
  hostedRegion: HostedRegionAffinity;
};

export function findDataCenter(code: string): DataCenterDef | undefined {
  return LUGEMI_DATA_CENTERS.find((d) => d.code === code);
}

export function normalizeCountry(raw?: string | null): string | null {
  if (!raw) return null;
  const c = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return null;
  return c === 'UK' ? 'GB' : c;
}

export function affinityForCountry(country?: string | null): HostedRegionAffinity {
  const c = normalizeCountry(country);
  if (!c) return 'af';
  return COUNTRY_AFFINITY[c] ?? 'af';
}

export function preferredDataCenterForCountry(country?: string | null): DataCenterDef {
  const c = normalizeCountry(country);
  const code = (c && COUNTRY_DC[c]) || 'af-west-1';
  return findDataCenter(code) ?? LUGEMI_DATA_CENTERS[0]!;
}

export function regionLabelForCountry(country?: string | null): string {
  const dc = preferredDataCenterForCountry(country);
  const affinityLabels: Record<HostedRegionAffinity, string> = {
    af: 'Africa',
    eu: 'Europe',
    us: 'North America',
    na: 'North America',
    sea: 'Southeast Asia',
    me: 'Middle East',
  };
  return `${affinityLabels[dc.affinity]} · ${dc.city}`;
}

export function hostingFromDataCenter(code: string): ModelHostingSeed {
  const dc = findDataCenter(code) ?? LUGEMI_DATA_CENTERS[0]!;
  return {
    hostedResidency: dc.label,
    dataCenter: dc.code,
    hostedRegion: dc.affinity,
  };
}

/**
 * Default hosting per Lugemi model family slug prefix / exact slug.
 * Africa-first: primary families in Accra/Lagos/Cape Town; EU/SEA/NA/ME where relevant.
 */
export function defaultHostingForModelSlug(slug: string): ModelHostingSeed {
  // Accent / country-linked Echo variants — host near the identity country.
  const echoCountry = slug.match(/^lugemi-echo-voice-([a-z]{2})-/);
  if (echoCountry) {
    const iso = echoCountry[1]!.toUpperCase();
    return hostingFromDataCenter(preferredDataCenterForCountry(iso).code);
  }

  const map: Record<string, string> = {
    'lugemi-baobab-translate': 'af-west-1', // Accra — Africa-first MT
    'lugemi-echo-listen': 'af-west-2', // Lagos — ASR accents
    'lugemi-echo-voice': 'af-west-1', // Accra — neural TTS
    'lugemi-vision-docs': 'af-south-1', // Cape Town — docs OCR
    'lugemi-lid': 'af-west-1',
    'lugemi-atlas-reason': 'af-west-1', // Accra — reasoning LLM
    'lugemi-vector-embed': 'af-east-1', // Nairobi — retrieval
    'lugemi-fusion-video': 'af-west-2',
    'lugemi-sentinel': 'eu-west', // security / policy — EU + AF reachable
    'lugemi-lex': 'eu-west', // legal — EU residency affinity
    'lugemi-civic': 'af-east-1', // public sector — East Africa
    'lugemi-cover': 'af-south-1', // insurance — Southern Africa
    'lugemi-accord': 'me-central', // compliance / KYC — ME + AF corridor
  };

  if (map[slug]) return hostingFromDataCenter(map[slug]!);

  // Family prefix fallbacks
  if (slug.startsWith('lugemi-baobab')) return hostingFromDataCenter('af-west-1');
  if (slug.startsWith('lugemi-echo')) return hostingFromDataCenter('af-west-1');
  if (slug.startsWith('lugemi-atlas')) return hostingFromDataCenter('af-west-1');
  if (slug.startsWith('lugemi-vector')) return hostingFromDataCenter('af-east-1');
  if (slug.startsWith('lugemi-fusion')) return hostingFromDataCenter('af-west-2');
  if (slug.startsWith('lugemi-lex')) return hostingFromDataCenter('eu-west');
  if (slug.startsWith('lugemi-civic')) return hostingFromDataCenter('af-east-1');
  if (slug.startsWith('lugemi-cover')) return hostingFromDataCenter('af-south-1');
  if (slug.startsWith('lugemi-accord')) return hostingFromDataCenter('me-central');
  if (slug.startsWith('lugemi-sentinel')) return hostingFromDataCenter('eu-west');
  if (slug.startsWith('lugemi-')) return hostingFromDataCenter('af-west-1');

  // Legacy adapters — us-east silent fallback host tag (not branded).
  return hostingFromDataCenter('us-east');
}

export function residencyPolicyText(): string {
  return [
    'Lugemi data and identity residency',
    '',
    'Person / user residency is the country and region derived from where you registered',
    '(signup geography, organization country, billing country, or an explicit residency field).',
    'It is stored on your identity profile and organization workspace.',
    '',
    'Model / LLM residency is the Lugemi data center where that model family is hosted',
    '(for example af-west-1 Accra, af-west-2 Lagos, af-south-1 Cape Town, eu-west, us-east,',
    'sea-central, me-central). Each registry model carries hostedResidency, dataCenter, and',
    'hostedRegion.',
    '',
    'Inference routing prefers matching your residency to nearby model hosting when possible.',
    'This is affinity preference, not a hard geo-fence: if no nearby host is ready, Lugemi',
    'falls back to the next best ready model for that feature.',
    '',
    'Deploy islands (LUGEMI_REGION us|eu) remain separate databases for sales/compliance pins;',
    'person and model residency fields describe registration origin and model hosting.',
  ].join('\n');
}
