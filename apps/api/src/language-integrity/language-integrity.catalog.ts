export type IntegrityStatus = 'shipped' | 'partial' | 'deferred';

export type IntegrityCapability = {
  id: string;
  name: string;
  status: IntegrityStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * Language Integrity — provenance, watermark disclosure, consent attestation,
 * audit trails, and human-reviewed official translations.
 * Honest framing: not NIST deepfake detection or courtroom certification theater.
 */
export function languageIntegrityEngineCatalog() {
  const capabilities: IntegrityCapability[] = [
    {
      id: 'synthetic-disclosure',
      name: 'Synthetic speech disclosure',
      status: 'shipped',
      api: 'POST /v1/audio/speech → X-Lugemi-Watermark',
      console: '/language-integrity',
      notes:
        'Clone and generative speech paths set X-Lugemi-Watermark: required when watermark applies. Listeners and systems can require disclosure — not invisible magic.',
    },
    {
      id: 'clone-consent',
      name: 'Consent-gated voice clones',
      status: 'shipped',
      api: 'GET /v1/voice-cloning/consent/policy',
      console: '/voice-cloning',
      notes:
        'Enrollment requires consentAttested + descriptive notes; ownership attestation for professional mode; abuse review before approval.',
    },
    {
      id: 'provenance-verify',
      name: 'Provenance claim verify',
      status: 'shipped',
      api: 'POST /v1/language-integrity/verify',
      console: '/language-integrity',
      notes:
        'Checks Lugemi watermark headers, clone attestation status, and claim shape. Does not claim universal deepfake detection.',
    },
    {
      id: 'audit-trail',
      name: 'Workspace audit trail',
      status: 'shipped',
      api: 'GET /v1/audit-events',
      console: '/audit',
      notes: 'voice_clone.* and org events for create, review, disable, ownership, and license changes.',
    },
    {
      id: 'translation-review',
      name: 'Official translation + human review',
      status: 'shipped',
      api: 'GET /v1/reviews',
      console: '/reviews',
      notes:
        'Heuristic QE flags risky segments; humans accept/reject. Accept can upsert TM for bilingual filings and diplomacy drafts.',
    },
    {
      id: 'gov-protocol',
      name: 'Government adoption protocol',
      status: 'shipped',
      api: 'GET /v1/language-integrity/protocol',
      console: '/language-integrity',
      notes:
        'Policy language states can require: Lugemi attestation for synthetic media, watermark disclosure, consent for clones, human review for official bilingual text.',
    },
    {
      id: 'pad-biometrics',
      name: 'Presentation attack detection / NIST biometrics',
      status: 'deferred',
      api: null,
      console: '/voice-biometrics',
      notes: 'PAD / NIST-grade spoof detection stays in Voice Biometrics roadmap — not implied by this hub.',
    },
  ];

  return {
    product: 'Lugemi Language Integrity',
    note:
      'Prove what Lugemi generated or attested — watermark headers, consent-gated clones, audit events, and human-reviewed translations. Protects courts and ministries that require provenance for synthetic speech and official bilingual filings. Not a claim of foolproof deepfake detection or courtroom certification without published evidence.',
    capabilities,
    trust: {
      watermarkRequiredOnCloneSpeech: true,
      consentRequiredForClones: true,
      ownershipAttestationSupported: true,
      abuseReviewRequired: true,
      auditEvents: true,
      humanTranslationReview: true,
      deepfakeDetectionClaimed: false,
      courtroomCertificationClaimed: false,
    },
    honesty: {
      deepfakeDetectionClaimed: false,
      courtroomCertificationClaimed: false,
      nistPadDeferred: true,
      watermarkIsDisclosureNotInvisibleMagic: true,
      humanReviewRequiredForOfficialFilings: true,
    },
    safety: {
      note:
        'Require Lugemi attestation + human review for admissible synthetic media and official translations. Do not treat absence of a Lugemi watermark as proof a recording is human — only that it was not issued on a Lugemi watermarked clone path.',
    },
    docs: '/docs/LANGUAGE_INTEGRITY.md',
    marketing: '/p/legal-integrity',
  };
}

/** Adoption protocol for governments and heads of state briefings. */
export function languageIntegrityProtocol() {
  return {
    product: 'Lugemi Language Integrity Protocol',
    audience: ['ministries of justice', 'courts administration', 'foreign affairs', 'heads of state briefings'],
    africaFirst:
      'Trade desks, civic FAQ, education ministries, and diplomatic bilingual notices across African languages — then global partners on the same /v1 surface.',
    requirements: [
      {
        id: 'req-attestation',
        title: 'Require Lugemi attestation for synthetic media',
        body: 'When generative or cloned speech is offered as evidence or public messaging, require a Lugemi provenance claim: clone id (if any), X-Lugemi-Watermark status, consent attestation timestamp, and audit event ids.',
      },
      {
        id: 'req-disclosure',
        title: 'Mandatory synthetic disclosure',
        body: 'Listeners and clerks must see that speech was generated or cloned. Watermark header on clone speech paths is required and cannot be disabled.',
      },
      {
        id: 'req-consent',
        title: 'Consent-gated clones only',
        body: 'No clone enrollment without speaker consent attestation and workspace abuse review. Disable paths exist for misuse.',
      },
      {
        id: 'req-review',
        title: 'Human review for official bilingual filings',
        body: 'Diplomatic notes, court filings, and citizen notices that leave the ministry go through Translate → Reviews accept/reject before publish.',
      },
      {
        id: 'req-audit',
        title: 'Retain audit logs',
        body: 'Keep GET /v1/audit-events trails for clone create/review/disable and translation review decisions for the retention window your counsel sets.',
      },
    ],
    innocentProtection:
      'Innocent people are protected when courts and agencies refuse unattested synthetic voice as if it were live testimony — and when official translations carry human review, not silent machine output alone.',
    limits: [
      'Lugemi does not claim NIST PAD or universal deepfake detectors in this product surface.',
      'Absence of a Lugemi watermark does not prove human speech; it only means Lugemi did not issue watermarked clone speech for that payload.',
      'Legal counsel and jurisdiction rules decide admissibility — Lugemi supplies the protocol and controls.',
    ],
    endpoints: {
      engine: 'GET /v1/language-integrity/engine',
      protocol: 'GET /v1/language-integrity/protocol',
      verify: 'POST /v1/language-integrity/verify',
      consentPolicy: 'GET /v1/voice-cloning/consent/policy',
      reviews: 'GET /v1/reviews',
      audit: 'GET /v1/audit-events',
      speech: 'POST /v1/audio/speech (response header X-Lugemi-Watermark)',
    },
    docs: '/docs/LANGUAGE_INTEGRITY.md',
  };
}
