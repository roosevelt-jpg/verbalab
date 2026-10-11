import {
  DEFAULT_APPROVAL_POLICY,
  MEETINGBRIDGE_CORRIDORS,
  MEETINGBRIDGE_MAX_PARTICIPANTS,
  MEETINGBRIDGE_NOTICE_VERSION,
  MEETINGBRIDGE_SCHEMA_VERSION,
} from './meetingbridge.types';

export function meetingbridgeCatalog() {
  const mediaProvisioned = Boolean(process.env.MEETINGBRIDGE_MEDIA_URL?.trim());
  const fixtureMt =
    process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_MT === '1';

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
    interpretationMode: mediaProvisioned ? 'turn_taking' : 'turn_taking',
    media: {
      mode: mediaProvisioned ? 'webrtc' : 'phrase_upload',
      provisioned: mediaProvisioned,
      note: mediaProvisioned
        ? 'MEETINGBRIDGE_MEDIA_URL configured — authenticated room tokens available.'
        : 'No SFU/WebRTC URL configured. Rooms use controlled turn-taking with phrase-level captions and post-meeting review. Not advertised as live simultaneous interpretation.',
    },
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
      'Zoom/Teams/Meet bots, public broadcasts, legally binding resolutions, and autonomous task writes are out of scope.',
      'Live simultaneous interpretation requires media provisioning plus corridor quality gates.',
      'DealBridge handoff creates a proposed deal only; MeetingBridge confirmation is not a commercial receipt.',
    ],
    integrations: {
      voiceBridgeFollowUp: true,
      dealBridgeHandoff: true,
      taskSync: 'explicit_authorized_only',
    },
  };
}
