export type IndustryPackId = 'medical' | 'legal' | 'financial' | 'government';

export type SpeechVocabPack = {
  id: IndustryPackId;
  name: string;
  description: string;
  phrases: string[];
};

/** Industry vocabulary packs for Whisper prompt priming (VL-151). */
export function speechIndustryVocabularyPacks(): SpeechVocabPack[] {
  return [
    {
      id: 'medical',
      name: 'Medical',
      description: 'Clinical terms for healthcare dictation (soft prompt boost).',
      phrases: [
        'hypertension',
        'myocardial infarction',
        'electrocardiogram',
        'hemoglobin',
        'differential diagnosis',
        'contraindication',
        'auscultation',
        'pulse oximetry',
        'intravenous',
        'prescription',
      ],
    },
    {
      id: 'legal',
      name: 'Legal',
      description: 'Litigation and contracts terminology.',
      phrases: [
        ' Affidavit',
        'plaintiff',
        'defendant',
        'jurisdiction',
        'indemnification',
        'force majeure',
        'habeas corpus',
        'subpoena',
        'deposition',
        'pursuant to',
      ].map((p) => p.trim()),
    },
    {
      id: 'financial',
      name: 'Financial',
      description: 'Banking and capital-markets terminology.',
      phrases: [
        'amortization',
        'collateralized',
        'liquidity',
        'basis points',
        'accounts receivable',
        'fiduciary',
        'securitization',
        'counterparties',
        'mark to market',
        'Know Your Customer',
      ],
    },
    {
      id: 'government',
      name: 'Government',
      description: 'Public-sector and regulatory terminology.',
      phrases: [
        'procurement',
        'appropriation',
        'statutory',
        'regulatory compliance',
        'public hearing',
        'interagency',
        'freedom of information',
        'constituency',
        'ordinance',
        'memorandum of understanding',
      ],
    },
  ];
}

export function buildVocabularyPrompt(input: {
  industryPackIds?: IndustryPackId[];
  customPhrases?: string[];
}): string | undefined {
  const packs = speechIndustryVocabularyPacks();
  const phrases: string[] = [];
  for (const id of input.industryPackIds ?? []) {
    const pack = packs.find((p) => p.id === id);
    if (pack) phrases.push(...pack.phrases);
  }
  for (const phrase of input.customPhrases ?? []) {
    const t = phrase.trim();
    if (t) phrases.push(t);
  }
  const unique = [...new Set(phrases.map((p) => p.trim()).filter(Boolean))];
  if (!unique.length) return undefined;
  return unique.slice(0, 80).join(', ');
}
