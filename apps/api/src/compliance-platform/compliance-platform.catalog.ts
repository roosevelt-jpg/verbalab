/**
 * Compliance Platform.
 * Tooling supports compliance work — does NOT certify GDPR/HIPAA/SOC2/PCI.
 */
export type FrameworkControl = {
  id: string;
  framework: 'SOC2' | 'ISO27001' | 'HIPAA' | 'GDPR' | 'CCPA' | 'NIST_AI_RMF' | 'EU_AI_ACT';
  control: string;
  evidenceRef: string;
  status: 'mapped' | 'partial' | 'gap';
  notes: string;
};

export function complianceControlsCatalog(): FrameworkControl[] {
  return [
    {
      id: 'cmp-soc2-1',
      framework: 'SOC2',
      control: 'CC6.1 Logical access',
      evidenceRef: 'audit:access-reviews',
      status: 'mapped',
      notes: 'Mapped to identity + audit events — not a SOC2 certification.',
    },
    {
      id: 'cmp-iso-1',
      framework: 'ISO27001',
      control: 'A.5.1 Policies',
      evidenceRef: 'policy-runtime:engine',
      status: 'mapped',
      notes: 'Policy Runtime evidence pointer.',
    },
    {
      id: 'cmp-hipaa-1',
      framework: 'HIPAA',
      control: '164.312 Technical safeguards',
      evidenceRef: 'privacy-platform:phi',
      status: 'shipped',
      notes: 'PHI detection tooling — not HIPAA certified.',
    },
    {
      id: 'cmp-gdpr-1',
      framework: 'GDPR',
      control: 'Art. 5 Principles',
      evidenceRef: 'privacy-platform:consent',
      status: 'shipped',
      notes: 'Consent tracking supports GDPR work — lawyers/auditors still required.',
    },
    {
      id: 'cmp-ccpa-1',
      framework: 'CCPA',
      control: 'Consumer rights request logging',
      evidenceRef: 'privacy-platform:assets',
      status: 'mapped',
      notes: 'Request logging catalog — not CCPA certification.',
    },
    {
      id: 'cmp-nist-1',
      framework: 'NIST_AI_RMF',
      control: 'Map / Measure / Manage / Govern',
      evidenceRef: 'ai-governance-platform:approvals',
      status: 'mapped',
      notes: 'Governance + risk mapping — not NIST certification.',
    },
    {
      id: 'cmp-eu-1',
      framework: 'EU_AI_ACT',
      control: 'High-risk system documentation',
      evidenceRef: 'explainability-platform:explanations',
      status: 'shipped',
      notes: 'Documentation support — not EU AI Act conformity assessment.',
    },
  ];
}

export function compliancePlatformEngineCatalog() {
  const controls = complianceControlsCatalog();
  return {
    product: 'Lugemi Compliance Platform',
    capabilities: [
      { id: 'soc2', name: 'SOC 2', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'iso27001', name: 'ISO 27001', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'hipaa', name: 'HIPAA', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'gdpr', name: 'GDPR', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'ccpa', name: 'CCPA', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'nist_ai_rmf', name: 'NIST AI RMF', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'eu_ai_act', name: 'EU AI Act', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'evidence', name: 'Audit Evidence', status: 'shipped', notes: 'Evidence catalog pointers.' },
      { id: 'policy_mapping', name: 'Policy Mapping', status: 'shipped', notes: 'Maps to Policy Runtime.' },
    ],
    controls,
    evidence: controls.map((c) => ({ id: c.id, ref: c.evidenceRef, framework: c.framework })),
    honesty: {
      complianceToolingNotCertification: true,
      notCertifiedCompliant: true,
      gdprCertified: false,
      hipaaCertified: false,
      soc2Certified: false,
      pciCertified: false,
      lawyersAuditorsStillRequired: true,
      certificationOs: false,
    },
    safety: {
      complianceToolingNotCertification: true,
      notCertifiedCompliant: true,
      note:
        'Dashboards and control mappings support compliance work. They do NOT make Lugemi GDPR/HIPAA/SOC2/PCI certified. Lawyers and external auditors are still required.',
    },
    docs: '/docs/COMPLIANCE_PLATFORM.md',
    note: 'Compliance Platform. Tooling not certification — lawyers/auditors still required.',
  };
}
