import { africanMarketSummaries } from '../african-markets';
import {
  LEARNBACK_CORRIDORS,
  LEARNBACK_FEATURE,
  LEARNBACK_NOTICE_VERSION,
  LEARNBACK_POLICY_VERSION,
  LEARNBACK_SCHEMA_VERSION,
  learnbackMaxAudioBytes,
  learnbackMaxAudioSeconds,
  pronunciationEnabled,
  SITUATIONS,
} from './learnback.types';

export function learnbackCatalog() {
  const pronunciationOn = pronunciationEnabled();
  const markets = africanMarketSummaries();
  return {
    id: 'learnback',
    name: 'Lugemi LearnBack',
    headline: 'Practise real situations with feedback in your language.',
    description:
      'Spoken practice for interviews, customer service, school meetings, and workplace talk across Africa, LATAM, Southeast Asia, the Middle East, and Anglosphere markets with country- and culture-identifying Englishes. Meaning-first feedback, honest pronunciation status, and a private phrasebook — not hiring judgment.',
    schemaVersion: LEARNBACK_SCHEMA_VERSION,
    noticeVersion: LEARNBACK_NOTICE_VERSION,
    featureFlag: LEARNBACK_FEATURE,
    policyVersion: LEARNBACK_POLICY_VERSION,
    situations: SITUATIONS,
    markets,
    marketCount: markets.length,
    corridorCount: LEARNBACK_CORRIDORS.length,
    corridors: LEARNBACK_CORRIDORS.map((c) => ({
      ...c,
      pronunciation: c.pronunciation && pronunciationOn,
    })),
    limits: {
      maxAudioBytes: learnbackMaxAudioBytes(),
      maxAudioSeconds: learnbackMaxAudioSeconds(),
      adultOnly: true,
      automaticTraining: false,
      externalMessaging: false,
      jobApplicationSubmission: false,
      standardizedProficiencyClaims: false,
    },
    endpoints: {
      catalog: 'GET /v1/learnback/catalog',
      scenarios: 'GET /v1/learnback/scenarios',
      profile: 'GET /v1/learnback/profile',
      updateProfile: 'PATCH /v1/learnback/profile',
      createSession: 'POST /v1/learnback/sessions',
      getSession: 'GET /v1/learnback/sessions/:id',
      listSessions: 'GET /v1/learnback/sessions',
      createAttempt: 'POST /v1/learnback/sessions/:id/attempts',
      correctTranscript: 'POST /v1/learnback/attempts/:id/transcript-revisions',
      feedback: 'GET /v1/learnback/attempts/:id/feedback',
      audio: 'POST /v1/learnback/audio',
      getAudio: 'GET /v1/learnback/artifacts/:id/audio',
      phrasebook: 'GET /v1/learnback/phrasebook',
      savePhrase: 'POST /v1/learnback/phrasebook',
      updatePhrase: 'PATCH /v1/learnback/phrasebook/:id',
      deletePhrase: 'DELETE /v1/learnback/phrasebook/:id',
      progress: 'GET /v1/learnback/progress',
      reminderPreferences: 'PATCH /v1/learnback/reminder-preferences',
      deleteSession: 'DELETE /v1/learnback/sessions/:id',
    },
    honesty: [
      'Feedback is descriptive and evidence-linked — not a 0–100 proficiency score without validated calibration.',
      'ASR uncertainty is never scored as a learner error; correct the transcript first.',
      'Pronunciation stays not_assessed when no validated assessor exists for the variety.',
      'Intelligible regional accents (including Ghanaian English) are not marked wrong for differing from US/UK norms.',
      'Improved examples preserve your facts and are labeled examples — not claims about your history.',
      'LearnBack never submits job applications or messages employers.',
      'Reminders are opt-in; without notification infrastructure, due items stay in-app only.',
      'Optional training consent is separate and off by default.',
      'English practice uses each market’s country-identifying accent (Ghanaian, Filipino, Mexican, Emirati, American, Canadian, Australian, New Zealand, British, Irish, …). Regional and ethnic Englishes are separate packs; accents are never marked wrong for differing from another national English.',
      'Local practice keeps country dialects and cultural varieties (Mexican Spanish, Gulf Arabic, Cebuano, Quechua, …) — not collapsed into generic language labels.',
    ],
    limitations: [
      'Adult practice product — not a compliant children’s product.',
      'Not career advice, hiring certification, or guaranteed learning outcomes.',
      'Downloaded audio cannot be recalled after export.',
    ],
  };
}
