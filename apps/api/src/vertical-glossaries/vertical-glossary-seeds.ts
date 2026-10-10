import type { GlossarySnapshotTerm } from '../glossary/glossary-snapshot-install';

export type VerticalGlossaryPack = {
  id: string;
  vertical: 'public-sector' | 'healthcare' | 'banking';
  title: string;
  description: string;
  sourceLang: string;
  targetLang: string;
  licenseTag: string;
  terms: GlossarySnapshotTerm[];
};

function t(sourceTerm: string, targetTerm: string): GlossarySnapshotTerm {
  return {
    sourceLang: 'en',
    targetLang: 'sw',
    sourceTerm,
    targetTerm,
    caseSensitive: false,
    wholeWord: true,
  };
}

/** Platform starter packs — curated EN→sw domain terms. */
export const VERTICAL_GLOSSARY_PACKS: VerticalGlossaryPack[] = [
  {
    id: 'public-sector-en-sw',
    vertical: 'public-sector',
    title: 'Public sector (EN→SW)',
    description: 'Citizen services, administration, and official communications.',
    sourceLang: 'en',
    targetLang: 'sw',
    licenseTag: 'proprietary',
    terms: [
      t('citizen', 'raia'),
      t('government', 'serikali'),
      t('ministry', 'wizara'),
      t('municipality', 'manispaa'),
      t('district', 'wilaya'),
      t('ward', 'kata'),
      t('identity card', 'kitambulisho'),
      t('passport', 'pasipoti'),
      t('birth certificate', 'cheti cha kuzaliwa'),
      t('application form', 'fomu ya maombi'),
      t('public notice', 'tangazo la umma'),
      t('hearing', 'usikilizaji'),
      t('complaint', 'malalamiko'),
      t('office hours', 'saa za ofisi'),
      t('civil servant', 'mtumishi wa umma'),
      t('election', 'uchaguzi'),
      t('voter registration', 'usajili wa wapiga kura'),
      t('tax office', 'ofisi ya kodi'),
      t('permit', 'kibali'),
      t('license', 'leseni'),
      t('regulation', 'kanuni'),
      t('policy', 'sera'),
      t('emergency services', 'huduma za dharura'),
      t('police station', 'kituo cha polisi'),
      t('court', 'mahakama'),
    ],
  },
  {
    id: 'healthcare-en-sw',
    vertical: 'healthcare',
    title: 'Healthcare (EN→SW)',
    description: 'Clinical and patient-facing terms for clinics and hospitals.',
    sourceLang: 'en',
    targetLang: 'sw',
    licenseTag: 'proprietary',
    terms: [
      t('clinic', 'kliniki'),
      t('hospital', 'hospitali'),
      t('patient', 'mgonjwa'),
      t('nurse', 'muuguzi'),
      t('doctor', 'daktari'),
      t('pharmacy', 'duka la dawa'),
      t('prescription', 'maagizo ya daktari'),
      t('appointment', 'miadi'),
      t('emergency room', 'chumba cha dharura'),
      t('blood pressure', 'shinikizo la damu'),
      t('vaccination', 'chanjo'),
      t('symptoms', 'dalili'),
      t('diagnosis', 'utambuzi'),
      t('treatment', 'matibabu'),
      t('referral', 'rufaa'),
      t('laboratory', 'maabara'),
      t('medical record', 'rekodi ya matibabu'),
      t('consent form', 'fomu ya idhini'),
      t('outpatient', 'mgonjwa wa nje'),
      t('inpatient', 'mgonjwa wa ndani'),
      t('maternity ward', 'wodi ya uzazi'),
      t('ambulance', 'ambulansi'),
      t('infection', 'maambukizi'),
      t('chronic disease', 'ugonjwa sugu'),
      t('mental health', 'afya ya akili'),
    ],
  },
  {
    id: 'banking-en-sw',
    vertical: 'banking',
    title: 'Banking (EN→SW)',
    description: 'Retail banking and payments terminology.',
    sourceLang: 'en',
    targetLang: 'sw',
    licenseTag: 'proprietary',
    terms: [
      t('bank account', 'akaunti ya benki'),
      t('savings account', 'akaunti ya akiba'),
      t('current account', 'akaunti ya kawaida'),
      t('loan', 'mkopo'),
      t('interest rate', 'kiwango cha riba'),
      t('deposit', 'amana'),
      t('withdrawal', 'utoaji'),
      t('transfer', 'uhamisho'),
      t('mobile money', 'pesa za rununu'),
      t('ATM', 'ATM'),
      t('PIN', 'PIN'),
      t('statement', 'taarifa ya akaunti'),
      t('balance', 'salio'),
      t('overdraft', 'deni la akaunti'),
      t('collateral', 'dhamana'),
      t('credit score', 'alama ya mikopo'),
      t('foreign exchange', 'ubadilishaji wa fedha'),
      t('remittance', 'utumaji fedha'),
      t('branch', 'tawi'),
      t('customer service', 'huduma kwa wateja'),
      t('fraud alert', 'tahadhari ya ulaghai'),
      t('KYC', 'KYC'),
      t('account number', 'nambari ya akaunti'),
      t('transaction', 'muamala'),
      t('insurance', 'bima'),
    ],
  },
];

export function findVerticalPack(id: string) {
  return VERTICAL_GLOSSARY_PACKS.find((p) => p.id === id) ?? null;
}

export const VERTICAL_PREVIEW_LIMIT = 12;
