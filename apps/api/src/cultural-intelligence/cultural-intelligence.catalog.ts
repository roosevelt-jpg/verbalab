
export type ConsentStatus = 'unverified' | 'attested' | 'restricted';

export type CulturalEntryKind =
  | 'greeting'
  | 'etiquette'
  | 'festival'
  | 'proverb'
  | 'idiom'
  | 'naming'
  | 'oral_history'
  | 'lifestyle'
  | 'habit'
  | 'routine';

export type CulturalEntry = {
  id: string;
  kind: CulturalEntryKind;
  title: string;
  summary: string;
  languageCodes: string[];
  regions: string[];
  /** Optional habits / routines context for culture-aware engines. */
  habits?: string[];
  routines?: string[];
  provenance: string;
  sourceCommunity: string;
  consentStatus: ConsentStatus;
};

/**
 * Cultural Intelligence.
 * Traditional knowledge requires provenance/sourceCommunity/consentStatus.
 * traditionalKnowledgeConsentRequired=true — not an extractive scrape.
 */
export function culturalIntelligenceSeed(): CulturalEntry[] {
  return [
    {
      id: 'greet-sw-habari',
      kind: 'greeting',
      title: 'Habari / Hujambo greeting pattern',
      summary: 'Common Swahili greeting exchange patterns used across East Africa.',
      languageCodes: ['sw'],
      regions: ['East Africa'],
      provenance: 'Public descriptive linguistics summary — community attestation pending',
      sourceCommunity: 'Swahili-speaking communities (East Africa)',
      consentStatus: 'unverified',
    },
    {
      id: 'etiquette-yo-respect',
      kind: 'etiquette',
      title: 'Yoruba age-respect greeting posture',
      summary: 'Age-graded greeting expectations in many Yoruba communities.',
      languageCodes: ['yo'],
      regions: ['West Africa'],
      provenance: 'Secondary ethnographic summaries — requires community review',
      sourceCommunity: 'Yoruba communities (Nigeria / diaspora)',
      consentStatus: 'unverified',
    },
    {
      id: 'festival-am-timket',
      kind: 'festival',
      title: 'Timket (Epiphany) public festival overview',
      summary: 'High-level public description of Timket celebrations in Ethiopia.',
      languageCodes: ['am'],
      regions: ['Horn of Africa'],
      provenance: 'Public cultural calendar descriptions',
      sourceCommunity: 'Ethiopian Orthodox communities',
      consentStatus: 'attested',
    },
    {
      id: 'proverb-ha-seed',
      kind: 'proverb',
      title: 'Hausa proverb seed (placeholder)',
      summary: 'Catalog slot for attested Hausa proverbs — content gated on consent.',
      languageCodes: ['ha'],
      regions: ['West Africa', 'Sahel'],
      provenance: 'Restricted until source-community attestation',
      sourceCommunity: 'Hausa communities',
      consentStatus: 'restricted',
    },
    {
      id: 'idiom-zu-seed',
      kind: 'idiom',
      title: 'Zulu idiom seed (placeholder)',
      summary: 'Catalog slot for attested Zulu idioms — content gated on consent.',
      languageCodes: ['zu'],
      regions: ['Southern Africa'],
      provenance: 'Restricted until source-community attestation',
      sourceCommunity: 'Zulu communities',
      consentStatus: 'restricted',
    },
    {
      id: 'naming-ig-seed',
      kind: 'naming',
      title: 'Igbo naming practice overview',
      summary: 'High-level public overview of meaning-bearing Igbo personal names.',
      languageCodes: ['ig'],
      regions: ['West Africa'],
      provenance: 'Public onomastics summaries — community attestation pending',
      sourceCommunity: 'Igbo communities',
      consentStatus: 'unverified',
    },
    {
      id: 'oral-so-seed',
      kind: 'oral_history',
      title: 'Somali oral poetry tradition overview',
      summary: 'Public overview of Somali oral poetry as cultural practice — not a corpus dump.',
      languageCodes: ['so'],
      regions: ['Horn of Africa'],
      provenance: 'Public literary histories — traditional texts not scraped',
      sourceCommunity: 'Somali communities',
      consentStatus: 'unverified',
    },
    {
      id: 'lifestyle-th-wai',
      kind: 'lifestyle',
      title: 'Thai wai and polite particles',
      summary: 'Public overview of wai greeting and polite speech particles in Thai daily life.',
      languageCodes: ['th'],
      regions: ['Southeast Asia', 'Thailand'],
      habits: ['wai greeting', 'shoe removal indoors'],
      routines: ['temple offerings on Buddhist holy days'],
      provenance: 'Public cultural etiquette summaries — community attestation pending',
      sourceCommunity: 'Thai communities',
      consentStatus: 'unverified',
    },
    {
      id: 'habit-vi-coffee',
      kind: 'habit',
      title: 'Vietnamese morning street coffee habit',
      summary: 'High-level public description of morning cà phê routines in urban Vietnam.',
      languageCodes: ['vi'],
      regions: ['Southeast Asia', 'Vietnam'],
      habits: ['morning street coffee'],
      routines: ['scooter commuting', 'evening family meals'],
      provenance: 'Public lifestyle descriptions',
      sourceCommunity: 'Vietnamese urban communities',
      consentStatus: 'unverified',
    },
    {
      id: 'routine-ar-iftar',
      kind: 'routine',
      title: 'Ramadan iftar hospitality routine',
      summary: 'Public overview of iftar gathering patterns common across many Arabic-speaking communities.',
      languageCodes: ['ar'],
      regions: ['Middle East', 'North Africa'],
      habits: ['Ramadan fasting'],
      routines: ['iftar hospitality', 'Friday congregational prayer'],
      provenance: 'Public cultural calendar descriptions',
      sourceCommunity: 'Arabic-speaking Muslim communities',
      consentStatus: 'attested',
    },
    {
      id: 'lifestyle-es-mx-family',
      kind: 'lifestyle',
      title: 'Mexican Spanish family gathering lifestyle',
      summary: 'Public overview of extended-family weekend gatherings and celebration calendars.',
      languageCodes: ['es'],
      regions: ['Latin America', 'Mexico', 'North America'],
      habits: ['compadrazgo social ties'],
      routines: ['weekend family gatherings', 'late dinners'],
      provenance: 'Public cultural summaries — attestation pending',
      sourceCommunity: 'Mexican Spanish-speaking communities',
      consentStatus: 'unverified',
    },
    {
      id: 'habit-en-gb-tea',
      kind: 'habit',
      title: 'British English tea-break habit',
      summary: 'Light public description of tea-break social norms in UK English contexts.',
      languageCodes: ['en'],
      regions: ['United Kingdom'],
      habits: ['tea breaks', 'queueing norms'],
      routines: ['bank-holiday weekends'],
      provenance: 'Public cultural descriptions',
      sourceCommunity: 'UK English-speaking communities',
      consentStatus: 'unverified',
    },
    {
      id: 'routine-fr-ca-cabane',
      kind: 'routine',
      title: 'Québécois sugar-shack season routine',
      summary: 'Public overview of cabane à sucre seasonal gatherings in French Canada.',
      languageCodes: ['fr'],
      regions: ['North America', 'Canada'],
      habits: ['Saint-Jean-Baptiste celebrations'],
      routines: ['cabane à sucre season', 'winter indoor social life'],
      provenance: 'Public cultural calendar descriptions',
      sourceCommunity: 'Québécois communities',
      consentStatus: 'unverified',
    },
    {
      id: 'lifestyle-pl-nameday',
      kind: 'lifestyle',
      title: 'Polish name-day social lifestyle',
      summary: 'Public overview of name-day (imieniny) visiting patterns in Polish communities.',
      languageCodes: ['pl'],
      regions: ['European Union', 'Poland'],
      habits: ['name-day celebrations'],
      routines: ['Sunday family dinners'],
      provenance: 'Public cultural summaries',
      sourceCommunity: 'Polish communities',
      consentStatus: 'unverified',
    },
  ];
}

export function culturalIntelligenceEngineCatalog() {
  const entries = culturalIntelligenceSeed();
  return {
    product: 'Lugemi Cultural Intelligence',
    note:
      'Cultural Intelligence. Greetings/etiquette/festivals/proverbs/idioms with provenance, sourceCommunity, and consentStatus. traditionalKnowledgeConsentRequired=true — not an extractive scrape of traditional knowledge.',
    capabilities: [
      {
        id: 'cultural-entries',
        name: 'Cultural Entries',
        status: 'shipped',
        api: 'GET /v1/cultural-intelligence/entries',
        notes: 'Seed entries with consent/provenance fields required.',
      },
      {
        id: 'consent-filter',
        name: 'Consent Filter',
        status: 'shipped',
        api: 'GET /v1/cultural-intelligence/entries?consentStatus=attested',
        notes: 'Filter by unverified|attested|restricted.',
      },
      {
        id: 'traditional-knowledge-guard',
        name: 'Traditional Knowledge Guard',
        status: 'shipped',
        api: 'GET /v1/cultural-intelligence/engine',
        notes: 'Engine honesty blocks extractive scrape claims.',
      },
    ],
    entries,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesPriorLayers: false,
      traditionalKnowledgeConsentRequired: true,
      extractiveTraditionalKnowledgeScrape: false,
    },
    honesty: {
      traditionalKnowledgeConsentRequired: true,
      extractiveTraditionalKnowledgeScrape: false,
      provenanceRequired: true,
      sourceCommunityRequired: true,
      consentStatusRequired: true,
      coverageComplete: false,
      regeneratesPriorLayers: false,
    },
    safety: {
      traditionalKnowledgeConsentRequired: true,
      extractiveTraditionalKnowledgeScrape: false,
      note:
        'Do not ingest traditional knowledge without attribution and consent. Restricted entries expose metadata only until attested.',
    },
    docs: '/docs/CULTURAL_INTELLIGENCE.md',
  };
}
