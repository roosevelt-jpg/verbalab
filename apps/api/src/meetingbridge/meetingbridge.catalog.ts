import { GHANA_LANGUAGE_STACK } from '../ghana/ghana-language-stack';
import { ghanaAsrCapability, ghanaEchoVoiceId } from './meetingbridge.adapters';
import type { IntegrationCapability } from './meetingbridge.integrations';
import type { MediaCapability } from './meetingbridge.media';
import {
  DEFAULT_APPROVAL_POLICY,
  MEETINGBRIDGE_CORRIDORS,
  MEETINGBRIDGE_MAX_PARTICIPANTS,
  MEETINGBRIDGE_NOTICE_VERSION,
  MEETINGBRIDGE_SCHEMA_VERSION,
} from './meetingbridge.types';

export function meetingbridgeCatalog(input?: {
  media?: MediaCapability;
  integrations?: IntegrationCapability;
}) {
  const media =
    input?.media ??
    ({
      mode: process.env.MEETINGBRIDGE_MEDIA_URL?.trim()
        ? 'webrtc_sfu'
        : process.env.MEETINGBRIDGE_MESH === '0'
          ? 'phrase_upload'
          : 'webrtc_mesh',
      provisioned: process.env.MEETINGBRIDGE_MESH !== '0' || Boolean(process.env.MEETINGBRIDGE_MEDIA_URL?.trim()),
      simultaneousInterpretation: process.env.MEETINGBRIDGE_SIMULTANEOUS === '1',
      signaling: process.env.MEETINGBRIDGE_MEDIA_URL?.trim()
        ? 'livekit'
        : process.env.MEETINGBRIDGE_MESH === '0'
          ? 'none'
          : 'rest_mesh',
      note: 'Default mesh WebRTC with REST signaling when no SFU URL is set.',
    } satisfies MediaCapability);

  const fixtureMt =
    process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_MT === '1';

  const ghanaVoices = GHANA_LANGUAGE_STACK.map((lang) => {
    const cap = ghanaAsrCapability(lang.code);
    return {
      code: lang.code,
      name: lang.nameEn,
      echoVoiceId: ghanaEchoVoiceId(lang.code),
      asr: cap.asr,
      tts: cap.tts,
      neuralClaim: cap.neuralClaim,
      note: cap.note,
    };
  });

  const integrations = input?.integrations;

  return {
    id: 'meetingbridge',
    name: 'Lugemi MeetingBridge',
    headline: 'Speak your language. Confirm the same plan.',
    description:
      'Multilingual meetings with supported listening channels, revision-linked transcripts, reviewed decisions, and explicitly confirmed action plans.',
    schemaVersion: MEETINGBRIDGE_SCHEMA_VERSION,
    noticeVersion: MEETINGBRIDGE_NOTICE_VERSION,
    featureFlag: 'meetingBridge',
    corridors: MEETINGBRIDGE_CORRIDORS,
    limits: {
      maxParticipants: MEETINGBRIDGE_MAX_PARTICIPANTS,
    },
    interpretationMode: media.simultaneousInterpretation ? 'simultaneous_optional' : 'turn_taking',
    media: {
      mode: media.mode,
      provisioned: media.provisioned,
      simultaneousInterpretation: media.simultaneousInterpretation,
      signaling: media.signaling,
      note: media.note,
    },
    ghanaVoices,
    translation: {
      fixtureAllowed: fixtureMt,
      note: fixtureMt
        ? 'Fixture MT allowed in test / MEETINGBRIDGE_ALLOW_FIXTURE_MT=1. Labeled in responses.'
        : 'Uses Lugemi Translate adapters. Unsupported pairs return capability errors.',
    },
    approvalPolicyDefault: DEFAULT_APPROVAL_POLICY,
    limitations: [
      'Silence, presence, playback, reaction emoji, and AI summaries are never agreement.',
      'Leaving the room does not authorize the organizer to confirm for another person.',
      'Neural Ghana ASR remains gated by MEETINGBRIDGE_GHANA_ASR=1 until measured coverage is published.',
      'Live simultaneous listen-channel TTS requires MEETINGBRIDGE_SIMULTANEOUS=1 plus corridor TTS capability.',
      'DealBridge handoff creates a proposed deal only; MeetingBridge confirmation is not a commercial receipt.',
      'Zoom/Teams bots and Slack/email/calendar writes require credentials or MEETINGBRIDGE_ALLOW_FIXTURE_INTEGRATIONS=1.',
    ],
    integrations: {
      voiceBridgeFollowUp: {
        available: true,
        endpoint: 'POST /v1/meetingbridge/meetings/:id/handoff/voicebridge',
        note: 'Creates a VoiceBridge follow-up thread from the meeting agenda and confirmed items after explicit organizer action.',
      },
      dealBridgeHandoff: {
        available: true,
        endpoint: 'POST /v1/meetingbridge/meetings/:id/handoff/dealbridge',
        note: 'Creates a proposed DealBridge session. Meeting confirmation is not a commercial receipt — DealBridge runs its own confirmations.',
      },
      taskSync: {
        mode: 'explicit_authorized_only',
        endpoint: 'POST /v1/meetingbridge/items/:itemId/sync',
        allowlistedDestinations: ['private_download', 'internal_queue', 'slack', 'email', 'calendar'],
        note: 'Slack/email/calendar writes require configured credentials (or fixture mode). Unauthorized destinations return capability errors.',
        slack: integrations?.slack,
        email: integrations?.email,
        calendar: integrations?.calendar,
      },
      conferencing: {
        zoom: integrations?.zoom ?? { available: false, note: 'Not probed' },
        teams: integrations?.teams ?? { available: false, note: 'Not probed' },
        broadcast: integrations?.broadcast ?? { available: false, note: 'Not probed' },
        endpoint: 'POST /v1/meetingbridge/meetings/:id/conferencing',
      },
      media: {
        tokenEndpoint: 'POST /v1/meetingbridge/meetings/:id/media/token',
        signalEndpoint: 'POST /v1/meetingbridge/meetings/:id/media/signal',
        pullEndpoint: 'GET /v1/meetingbridge/meetings/:id/media/signals',
      },
      itemRevisions: {
        available: true,
        endpoint: 'POST /v1/meetingbridge/items/:itemId/revisions',
      },
    },
    screens: {
      lobby: '/meetingbridge/meetings/:id/lobby',
      inbox: '/meetingbridge/meetings/:id/inbox',
      diagnostics: '/meetingbridge/meetings/:id/diagnostics',
      room: '/meetingbridge/meetings/:id',
      broadcast: '/meetingbridge/broadcast/:token',
    },
  };
}
