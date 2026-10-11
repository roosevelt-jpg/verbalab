import { africanMarketSummaries } from '../african-markets';
import {
  EVERYDAY_CORRIDORS,
  EVERYDAY_FEATURE,
  EVERYDAY_MODES,
  EVERYDAY_NOTICE_VERSION,
  EVERYDAY_POLICY_VERSION,
  EVERYDAY_SCHEMA_VERSION,
  everydayMaxPages,
  everydayMaxUploadBytes,
} from './everyday.types';

export function everydayCatalog() {
  const markets = africanMarketSummaries();
  return {
    id: 'everyday',
    name: 'Lugemi Everyday',
    headline: 'Read notices, ask grounded questions, and approve replies in your language.',
    description:
      'Photograph or upload a document, hear a faithful translation, request a separately labeled plain-language explanation, ask source-cited questions, and compose a reviewed reply. Private sessions across major African markets — no automatic external sending.',
    schemaVersion: EVERYDAY_SCHEMA_VERSION,
    noticeVersion: EVERYDAY_NOTICE_VERSION,
    featureFlag: EVERYDAY_FEATURE,
    policyVersion: EVERYDAY_POLICY_VERSION,
    modes: EVERYDAY_MODES.map((id) => ({
      id,
      label:
        id === 'read_this_to_me'
          ? 'Read this to me'
          : id === 'help_me_reply'
            ? 'Help me reply'
            : 'Explain this word',
    })),
    markets,
    marketCount: markets.length,
    corridorCount: EVERYDAY_CORRIDORS.length,
    corridors: EVERYDAY_CORRIDORS,
    limits: {
      maxUploadBytes: everydayMaxUploadBytes(),
      maxPages: everydayMaxPages(),
      supportedMime: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'],
      handwriting: 'limited_explicit_failure',
      complexTables: 'best_effort_with_layout_status',
      offlineInference: false,
      automaticSending: false,
      governmentFormFiling: false,
      clinicalDiagnosis: false,
      legalInterpretation: false,
    },
    endpoints: {
      catalog: 'GET /v1/everyday/catalog',
      sessions: 'GET /v1/everyday/sessions',
      createSession: 'POST /v1/everyday/sessions',
      getSession: 'GET /v1/everyday/sessions/:id',
      upload: 'POST /v1/everyday/sessions/:id/uploads',
      correctSource: 'POST /v1/everyday/documents/:id/source-revisions',
      translate: 'POST /v1/everyday/sources/:id/translations',
      explain: 'POST /v1/everyday/sources/:id/explanations',
      question: 'POST /v1/everyday/sources/:id/questions',
      audio: 'POST /v1/everyday/audio',
      reply: 'POST /v1/everyday/sessions/:id/replies',
      approveReply: 'POST /v1/everyday/replies/:id/approvals',
      term: 'POST /v1/everyday/sessions/:id/terms',
      events: 'GET /v1/everyday/sessions/:id/events',
      deleteSession: 'DELETE /v1/everyday/sessions/:id',
      getAudio: 'GET /v1/everyday/artifacts/:id/audio',
    },
    answerability: [
      'supported',
      'partially_supported',
      'not_found',
      'unreadable',
      'requires_clarification',
    ],
    honesty: [
      'Faithful translation and simple explanation are separate — explanation never silently replaces meaning.',
      'Answers cite validated source block IDs; invented or foreign block IDs fail.',
      'Unreadable or missing pages yield clarification or recapture — never guessed deadlines or amounts.',
      'Medical, legal, and financial categories require an explicit sensitive-policy acknowledgement.',
      'Reply approval is pinned to exact source/target presentation hashes; edits invalidate approval.',
      'Opening a share sheet after approval is not proof of delivery. Everyday never sends external messages.',
      'TTS uses language-specific voices when available; otherwise text is returned with an honest unsupported status — no neighboring-language substitution.',
      'Server processing is private to your organization but is not end-to-end encryption.',
    ],
    limitations: [
      'Handwriting, encrypted PDFs, and unsupported scripts fail clearly rather than guessing.',
      'Explanations are not professional advice.',
      'Downloaded copies cannot be recalled after export.',
      'Training on private documents requires separate optional consent and stays off by default.',
    ],
  };
}
