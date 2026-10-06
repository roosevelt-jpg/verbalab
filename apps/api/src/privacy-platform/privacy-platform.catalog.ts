/**
 * Library Phase 163 → Privacy Platform (VL-296).
 * Enforces Volume 12 traditional knowledge consent fields.
 */
export type ConsentStatus = 'attested' | 'restricted' | 'unverified';

export type PrivacyAsset = {
  id: string;
  title: string;
  kind: 'traditional_knowledge' | 'pii_record' | 'phi_record' | 'financial_record' | 'general';
  provenance: string | null;
  sourceCommunity: string | null;
  consentStatus: ConsentStatus | null;
  notes: string;
};

export function seedPrivacyAssets(): PrivacyAsset[] {
  return [
    {
      id: 'priv-tk-ok',
      title: 'Attested oral history excerpt',
      kind: 'traditional_knowledge',
      provenance: 'community-archive-12',
      sourceCommunity: 'Yoruba heritage council',
      consentStatus: 'attested',
      notes: 'Release allowed — Volume 12 fields complete.',
    },
    {
      id: 'priv-tk-restricted',
      title: 'Restricted ceremonial knowledge',
      kind: 'traditional_knowledge',
      provenance: 'field-notes-9',
      sourceCommunity: 'Maasai elders',
      consentStatus: 'restricted',
      notes: 'Must reject release — consentStatus=restricted.',
    },
    {
      id: 'priv-tk-unverified',
      title: 'Unverified folklore scrape',
      kind: 'traditional_knowledge',
      provenance: 'web-scrape',
      sourceCommunity: 'unknown',
      consentStatus: 'unverified',
      notes: 'Must reject release — consentStatus=unverified.',
    },
    {
      id: 'priv-pii-001',
      title: 'Customer email batch',
      kind: 'pii_record',
      provenance: null,
      sourceCommunity: null,
      consentStatus: null,
      notes: 'PII detection + redaction candidate.',
    },
    {
      id: 'priv-phi-001',
      title: 'Clinic note snippet',
      kind: 'phi_record',
      provenance: null,
      sourceCommunity: null,
      consentStatus: null,
      notes: 'PHI detection + masking candidate.',
    },
    {
      id: 'priv-fin-001',
      title: 'Card last-four log',
      kind: 'financial_record',
      provenance: null,
      sourceCommunity: null,
      consentStatus: null,
      notes: 'Financial data detection — PCI honesty via Stripe/billing surfaces.',
    },
  ];
}

export function evaluatePrivacyRelease(asset: PrivacyAsset): {
  allowed: boolean;
  reason: string;
} {
  if (asset.kind === 'traditional_knowledge') {
    if (!asset.provenance || !asset.sourceCommunity || !asset.consentStatus) {
      return {
        allowed: false,
        reason:
          'Missing required Volume 12 consent fields: provenance, sourceCommunity, consentStatus.',
      };
    }
    if (asset.consentStatus === 'restricted' || asset.consentStatus === 'unverified') {
      return {
        allowed: false,
        reason: `Blocked: consentStatus=${asset.consentStatus}. Attested consent required for traditional-knowledge release.`,
      };
    }
    if (asset.consentStatus === 'attested') {
      return { allowed: true, reason: 'Attested traditional-knowledge consent — release allowed.' };
    }
    return { allowed: false, reason: 'Unknown consentStatus — blocked.' };
  }
  return {
    allowed: true,
    reason: 'Non-TK asset — proceed with PII/PHI/financial controls as applicable.',
  };
}

export function privacyPlatformEngineCatalog() {
  const assets = seedPrivacyAssets();
  return {
    product: 'VerbaLab Privacy Platform',
    capabilities: [
      { id: 'pii', name: 'PII Detection', status: 'shipped', notes: 'PII detectors.' },
      { id: 'phi', name: 'PHI Detection', status: 'shipped', notes: 'PHI detectors.' },
      { id: 'financial', name: 'Financial Data Detection', status: 'shipped', notes: 'Financial detectors.' },
      { id: 'redaction', name: 'Automatic Redaction', status: 'shipped', notes: 'Redaction controls.' },
      { id: 'tokenization', name: 'Tokenization', status: 'shipped', notes: 'Tokenization controls.' },
      { id: 'masking', name: 'Masking', status: 'shipped', notes: 'Masking controls.' },
      { id: 'anonymization', name: 'Anonymization', status: 'shipped', notes: 'Anonymization controls.' },
      { id: 'pseudonymization', name: 'Pseudonymization', status: 'shipped', notes: 'Pseudonymization controls.' },
      { id: 'encryption', name: 'Encryption', status: 'shipped', notes: 'Encryption posture catalog.' },
      { id: 'consent', name: 'Consent Tracking', status: 'shipped', notes: 'Volume 12 TK consent.' },
      { id: 'retention', name: 'Retention Policies', status: 'shipped', notes: 'Retention catalog.' },
    ],
    assets,
    controls: [
      { id: 'redact', name: 'Redaction', status: 'shipped' },
      { id: 'tokenize', name: 'Tokenization', status: 'shipped' },
      { id: 'mask', name: 'Masking', status: 'shipped' },
      { id: 'anonymize', name: 'Anonymization', status: 'shipped' },
    ],
    honesty: {
      traditionalKnowledgeConsentRequired: true,
      regeneratesVolume12: false,
      enforcesVolume12ConsentFields: true,
      requiredConsentFields: ['provenance', 'sourceCommunity', 'consentStatus'],
      privacyOsReplacement: false,
    },
    safety: {
      traditionalKnowledgeConsentRequired: true,
      note:
        'Before release of traditional knowledge, require Volume 12 consent fields. Block when consentStatus is restricted or unverified. Integrates with cultural consent concepts.',
    },
    docs: '/docs/PRIVACY_PLATFORM.md',
    note: 'Privacy Platform (VL-296). Detection/redaction + Volume 12 TK consent enforcement.',
  };
}
