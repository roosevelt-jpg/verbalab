export type BioCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type BioCapability = {
  id: string;
  name: string;
  status: BioCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Enterprise Voice Biometrics. Extends existing. */
export function voiceBiometricsEngineCatalog() {
  return {
    product: 'Lugemi Voice Biometrics',
    note:
      'Enterprise voice auth governance over Speaker Intelligence fingerprints: encrypt-at-rest templates, deletion path, heuristic anti-spoof/liveness/risk. Not NIST/PAD/ASVspoof certified. Prefer specialist vendor for regulated auth.',
    capabilities: [
      {
        id: 'biometric-engine',
        name: 'Biometric Engine',
        status: 'shipped',
        api: 'GET /v1/voice-biometrics/engine',
        notes: 'Catalog + honesty flags over existing.',
      },
      {
        id: 'voice-authentication',
        name: 'Voice Authentication',
        status: 'partial',
        api: 'POST /v1/voice-biometrics/authenticate',
        notes: 'Verify + anti-spoof + risk → accept/step_up/reject. Not a certified MFA factor alone.',
      },
      {
        id: 'speaker-verification',
        name: 'Speaker Verification',
        status: 'partial',
        api: 'POST /v1/voice-biometrics/verify',
        notes: 'Delegates to cosine verify (decrypts encrypted templates).',
      },
      {
        id: 'speaker-identification',
        name: 'Speaker Identification',
        status: 'partial',
        api: 'POST /v1/voice-biometrics/identify',
        notes: 'Delegates to 1:N identify.',
      },
      {
        id: 'fraud-detection',
        name: 'Fraud Detection',
        status: 'partial',
        api: 'GET /v1/voice-biometrics/risk',
        notes: 'Workspace reject-rate / spoof-flag risk — not a fraud ML platform.',
      },
      {
        id: 'anti-spoofing',
        name: 'Anti Spoofing',
        status: 'partial',
        api: 'POST /v1/voice-biometrics/anti-spoof',
        notes: 'Heuristic clipping/dynamics/flatness proxies. certifiedPad=false.',
      },
      {
        id: 'liveness-detection',
        name: 'Liveness Detection',
        status: 'partial',
        api: 'POST /v1/voice-biometrics/liveness',
        notes: 'Challenge phrase + duration/energy check. Not certified PAD.',
      },
      {
        id: 'risk-scoring',
        name: 'Risk Scoring',
        status: 'partial',
        api: 'GET /v1/voice-biometrics/risk',
        notes: 'Composite risk from spoof heuristics + recent verify rejects.',
      },
      {
        id: 'encryption-at-rest',
        name: 'Template encryption at rest',
        status: 'shipped',
        api: 'POST /v1/voice-biometrics/enroll',
        notes: 'AES-256-GCM on fingerprint JSON (VOICE_BIOMETRIC_KEY).',
      },
      {
        id: 'deletion',
        name: 'Biometric deletion',
        status: 'shipped',
        api: 'DELETE /v1/voice-biometrics/profiles/:id',
        notes: 'Purges fingerprint template + marks profile deleted.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/voice-biometrics/engine/analytics',
        notes: 'Audit voice_biometrics.* events.',
      },
    ] satisfies BioCapability[],
    honesty: {
      nistCertified: false,
      padCertified: false,
      asvspoofCertified: false,
      extendsVl152: true,
      specialistVendorRecommended: true,
    },
    links: {
      console: '/voice-biometrics',
      legacySpeakers: '/speaker-intelligence',
      hub: '/voice-cloud',
      openapi: '/v1/openapi.json',
      docs: '/docs/VOICE_BIOMETRICS.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@lugemi/sdk',
      cli: '@lugemi/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
      nistCertified: false,
      padCertified: false,
      templateEncryption: 'aes-256-gcm',
    },
  };
}
