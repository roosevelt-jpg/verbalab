export type SpeakerCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type SpeakerCapability = {
  id: string;
  name: string;
  status: SpeakerCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 18 → Speaker Intelligence. */
export function speakerEngineCatalog {
  return {
    product: 'Lugemi Speaker Intelligence',
    note:
      'Bounded speaker profiles, local voice fingerprints, 1:1 verification, 1:N identification, and gap-based diarization over Whisper segments. Not a NIST biometrics / pyannote OS.',
    capabilities: [
      {
        id: 'profiles',
        name: 'Speaker Profiles',
        status: 'shipped',
        api: '/v1/speakers/profiles',
        notes: 'Workspace-scoped speaker profiles with enrollment metadata.',
      },
      {
        id: 'fingerprints',
        name: 'Voice Fingerprints',
        status: 'partial',
        api: 'POST /v1/speakers/profiles/:id/enroll',
        notes: 'Local energy/spectral envelope fingerprint — not a commercial biometric template.',
      },
      {
        id: 'verification',
        name: 'Speaker Verification',
        status: 'partial',
        api: 'POST /v1/speakers/verify',
        notes: '1:1 cosine match against an enrolled profile. Thresholded; not anti-spoof.',
      },
      {
        id: 'identification',
        name: 'Speaker Identification',
        status: 'partial',
        api: 'POST /v1/speakers/identify',
        notes: '1:N match against workspace enrollments.',
      },
      {
        id: 'diarization',
        name: 'Speaker Diarization',
        status: 'partial',
        api: 'POST /v1/speakers/diarize',
        notes: 'Silence-gap turn clustering over Whisper timed segments. Not neural diarization.',
      },
      {
        id: 'history',
        name: 'Speaker History',
        status: 'shipped',
        api: 'GET /v1/speakers/history',
        notes: 'Audit trail of enroll / verify / identify / diarize events for the workspace.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'partial',
        api: 'POST /v1/speakers/diarize/stream',
        notes: 'SSE progress for diarization. Not live multi-speaker WebSocket.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Request IDs + speaker.* audit actions.',
      },
    ] satisfies SpeakerCapability[],
    engines: [
      {
        id: 'lugemi_fingerprint_v1',
        name: 'Lugemi local fingerprint v1',
        role: 'primary',
        modes: ['enroll', 'verify', 'identify'],
      },
      {
        id: 'gap_diarization_v1',
        name: 'Gap-based diarization over Whisper segments',
        role: 'diarization',
        modes: ['batch', 'segment_sse'],
      },
    ],
    links: {
      console: '/speaker-intelligence',
      hub: '/speech',
      openapi: '/v1/openapi.json',
      docs: '/docs/SPEAKER_INTELLIGENCE.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@lugemi/sdk',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    },
  };
}
