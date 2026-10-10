export type WorldRegionId =
  | 'africa'
  | 'sea'
  | 'mena'
  | 'eu'
  | 'uk'
  | 'latam'
  | 'na'
  | 'global';

export type RegionalLanguageQuality = 'production' | 'preview' | 'catalog';

export type RegionalLanguageEntry = {
  code: string;
  name: string;
  nativeName?: string;
  family: string;
  writingSystems: string[];
  dialects: string[];
  accents: string[];
  regions: string[];
  worldRegions: WorldRegionId[];
  /** Lifestyle / routines context for culture-aware engines. */
  lifestyle?: {
    habits?: string[];
    routines?: string[];
    culturalNotes?: string;
  };
  /** Internal routing/quality honesty — not a UI badge. */
  quality: RegionalLanguageQuality;
  notes: string;
};

export type WorldRegionMeta = {
  id: WorldRegionId;
  label: string;
  shortLabel: string;
  note: string;
  africaFirst?: boolean;
};

export const WORLD_REGIONS: WorldRegionMeta[] = [
  {
    id: 'africa',
    label: 'Africa',
    shortLabel: 'Africa',
    note: 'Africa-first registry — default demo pair English → Twi (ak / ak-GH).',
    africaFirst: true,
  },
  {
    id: 'sea',
    label: 'Southeast Asia',
    shortLabel: 'SEA',
    note: 'Southeast Asian languages, dialects, accents, and lifestyle context.',
  },
  {
    id: 'mena',
    label: 'Middle East & North Africa bridge',
    shortLabel: 'MENA',
    note: 'Middle East languages plus shared Arabic varieties; Africa catalog remains primary for North Africa.',
  },
  {
    id: 'eu',
    label: 'European Union',
    shortLabel: 'EU',
    note: 'EU official and widely used regional languages.',
  },
  {
    id: 'uk',
    label: 'United Kingdom',
    shortLabel: 'UK',
    note: 'UK English and Celtic languages of the British Isles.',
  },
  {
    id: 'latam',
    label: 'Latin America',
    shortLabel: 'LATAM',
    note: 'Spanish/Portuguese markets plus Indigenous languages of Latin America.',
  },
  {
    id: 'na',
    label: 'North America',
    shortLabel: 'NA',
    note: 'US/Canada English, Spanish, French, and Indigenous languages.',
  },
  {
    id: 'global',
    label: 'Global',
    shortLabel: 'Global',
    note: 'Full Lugemi language registry across all regions.',
  },
];
