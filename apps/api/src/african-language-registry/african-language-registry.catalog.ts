
export type AfricanLanguageStatus = 'shipped' | 'partial' | 'deferred';

export type AfricanLanguageEntry = {
  code: string;
  name: string;
  family: string;
  writingSystems: string[];
  dialects: string[];
  regions: string[];
  status: AfricanLanguageStatus;
  notes: string;
};

/**
 * Library Phase 128 → African Language Registry (VL-261).
 * Representative seed — coverageComplete=false. Extends dialects/locales — not every African language.
 */
export function africanLanguageSeed(): AfricanLanguageEntry[] {
  return [
    {
      code: 'sw',
      name: 'Swahili',
      family: 'Niger-Congo / Bantu',
      writingSystems: ['Latin'],
      dialects: ['Kiunguja', 'Kimvita', 'Kiamu'],
      regions: ['East Africa'],
      status: 'shipped',
      notes: 'Representative seed — not exhaustive dialect coverage.',
    },
    {
      code: 'yo',
      name: 'Yoruba',
      family: 'Niger-Congo / Volta-Niger',
      writingSystems: ['Latin'],
      dialects: ['Oyo', 'Egba', 'Ijebu'],
      regions: ['West Africa'],
      status: 'shipped',
      notes: 'Representative seed.',
    },
    {
      code: 'am',
      name: 'Amharic',
      family: 'Afro-Asiatic / Semitic',
      writingSystems: ['Geʽez / Fidel'],
      dialects: ['Addis', 'Gojjam', 'Wollo'],
      regions: ['Horn of Africa'],
      status: 'shipped',
      notes: 'Representative seed.',
    },
    {
      code: 'ha',
      name: 'Hausa',
      family: 'Afro-Asiatic / Chadic',
      writingSystems: ['Latin', 'Ajami'],
      dialects: ['Kano', 'Sokoto', 'Katsina'],
      regions: ['West Africa', 'Sahel'],
      status: 'shipped',
      notes: 'Representative seed.',
    },
    {
      code: 'zu',
      name: 'Zulu',
      family: 'Niger-Congo / Bantu',
      writingSystems: ['Latin'],
      dialects: ['Standard Zulu'],
      regions: ['Southern Africa'],
      status: 'shipped',
      notes: 'Representative seed.',
    },
    {
      code: 'ig',
      name: 'Igbo',
      family: 'Niger-Congo / Volta-Niger',
      writingSystems: ['Latin'],
      dialects: ['Central Igbo', 'Onitsha', 'Owerri'],
      regions: ['West Africa'],
      status: 'shipped',
      notes: 'Representative seed.',
    },
    {
      code: 'so',
      name: 'Somali',
      family: 'Afro-Asiatic / Cushitic',
      writingSystems: ['Latin', 'Osmanya'],
      dialects: ['Northern', 'Benadir', 'Maay'],
      regions: ['Horn of Africa'],
      status: 'shipped',
      notes: 'Representative seed.',
    },
    {
      code: 'ar-maghreb',
      name: 'Maghrebi Arabic',
      family: 'Afro-Asiatic / Semitic',
      writingSystems: ['Arabic'],
      dialects: ['Darija (Morocco)', 'Tunisian', 'Algerian'],
      regions: ['North Africa'],
      status: 'partial',
      notes: 'Macro-variety placeholder — not a complete Maghrebi dialect atlas.',
    },
    {
      code: 'fr-africa',
      name: 'African French',
      family: 'Indo-European / Romance (African varieties)',
      writingSystems: ['Latin'],
      dialects: ['West African French', 'Central African French'],
      regions: ['West Africa', 'Central Africa'],
      status: 'partial',
      notes: 'Contact variety placeholder extending locales — not exhaustive.',
    },
    {
      code: 'en-africa',
      name: 'African English',
      family: 'Indo-European / Germanic (African varieties)',
      writingSystems: ['Latin'],
      dialects: ['Nigerian English', 'Kenyan English', 'South African English'],
      regions: ['West Africa', 'East Africa', 'Southern Africa'],
      status: 'partial',
      notes: 'Contact variety placeholder extending locales — not exhaustive.',
    },
  ];
}

export function africanLanguageFamilies() {
  return [
    { id: 'niger-congo', name: 'Niger-Congo', note: 'Largest family represented in seed (Bantu + Volta-Niger).' },
    { id: 'afro-asiatic', name: 'Afro-Asiatic', note: 'Semitic, Chadic, Cushitic representatives in seed.' },
    { id: 'indo-european-african', name: 'Indo-European (African varieties)', note: 'fr-africa / en-africa contact varieties.' },
  ];
}

export function africanLanguageRegistryEngineCatalog() {
  const languages = africanLanguageSeed();
  return {
    product: 'VerbaLab African Language Registry',
    note:
      'African Language Registry (VL-261). Representative language/dialect/writing-system seed extending dialects/locales. coverageComplete=false — not every African language.',
    capabilities: [
      {
        id: 'language-catalog',
        name: 'Language Catalog',
        status: 'shipped',
        api: 'GET /v1/african-language-registry/languages',
        notes: 'Seeded representative set with family metadata.',
      },
      {
        id: 'dialect-index',
        name: 'Dialect Index',
        status: 'partial',
        api: 'GET /v1/african-language-registry/languages',
        notes: 'Dialect names on seed entries — not a complete dialect atlas.',
      },
      {
        id: 'writing-systems',
        name: 'Writing Systems',
        status: 'shipped',
        api: 'GET /v1/african-language-registry/languages',
        notes: 'Latin, Geʽez, Ajami, Arabic, Osmanya represented in seed.',
      },
      {
        id: 'family-metadata',
        name: 'Family Metadata',
        status: 'shipped',
        api: 'GET /v1/african-language-registry/families',
        notes: 'High-level family groups for the seed set.',
      },
    ],
    languages,
    families: africanLanguageFamilies(),
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsDialects: true,
      extendsLocales: true,
      regeneratesVolumes1to11: false,
      coverageComplete: false,
    },
    honesty: {
      coverageComplete: false,
      everyAfricanLanguageComplete: false,
      regeneratesVolumes1to11: false,
      extendsDialectsLocales: true,
    },
    docs: '/docs/AFRICAN_LANGUAGE_REGISTRY.md',
  };
}
