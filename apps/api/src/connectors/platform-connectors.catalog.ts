/**
 * Lugemi Studio Connectors hub — platform installer registry.
 * Vendor names are integration targets. Lugemi is first-party speech + language.
 */

export type PlatformConnectorCategory =
  | 'voice'
  | 'video'
  | 'messaging'
  | 'contact-center'
  | 'crm'
  | 'lms'
  | 'healthcare'
  | 'conferencing'
  | 'gaming'
  | 'cms'
  | 'localization'
  | 'fintech'
  | 'chat'
  | 'office'
  | 'storage'
  | 'email';

export type PlatformConnectorField = 'apiKey' | 'webhookUrl' | 'accountSid' | 'projectId';

export const LUGEMI_PLATFORM_APIS = {
  translate: { method: 'POST', path: '/v1/translate', summary: 'Translate text between registry languages (Africa-first dialects).' },
  tts: { method: 'POST', path: '/v1/tts/synthesize', summary: 'Synthesize speech with Lugemi first-party voices (legacy: /v1/audio/speech).' },
  stt: { method: 'POST', path: '/v1/speech/recognize', summary: 'Speech-to-text with timestamps (legacy: /v1/audio/transcriptions).' },
  voiceClone: { method: 'GET', path: '/v1/voice-clones', summary: 'List workspace voice clone refs for TTS voice=clone:{id}.' },
  realtimeSegments: { method: 'POST', path: '/v1/speech/stream', summary: 'Realtime STT segment stream for live agents and captions.' },
  translateStream: { method: 'POST', path: '/v1/translate/stream', summary: 'SSE translate segments for live caption and agent loops.' },
  ttsStream: { method: 'POST', path: '/v1/tts/stream', summary: 'Chunked TTS stream for low-latency agent replies.' },
} as const;

export type PlatformConnectorEntry = {
  id: string; name: string; category: PlatformConnectorCategory; blurb: string; docs: string;
  integrationGuide: string; demoHref: string; demoLabel: string; fields: PlatformConnectorField[];
  envHint: string; lugemiApis: Array<keyof typeof LUGEMI_PLATFORM_APIS>; webhookHint?: string;
};

export const PLATFORM_CONNECTOR_CATEGORIES: { id: PlatformConnectorCategory; label: string; lead: string }[] = [
  { id: 'voice', label: 'Voice platforms', lead: 'Route Lugemi speech + dialect translate into telephony and voice agent stacks with one API key.' },
  { id: 'video', label: 'Video generation', lead: 'Drive lip-sync and localized video from Lugemi voice without stacking external audio noise.' },
  { id: 'messaging', label: 'Messaging & CPaaS', lead: 'WhatsApp-class and African USSD/SMS stacks that need dialect-aware reply audio and text.' },
  { id: 'contact-center', label: 'Contact centers', lead: 'Ingest call audio, transcribe dialects, coach agents, and speak back in the caller language.' },
  { id: 'crm', label: 'CRM', lead: 'Localize tickets, call notes, and outreach scripts for African and multilingual desks.' },
  { id: 'lms', label: 'LMS & edtech', lead: 'Dub training media, caption courses, and serve learners in local languages.' },
  { id: 'healthcare', label: 'Healthcare & government', lead: 'Patient and citizen language integrity — translate, speak, and attest official wording.' },
  { id: 'conferencing', label: 'Conferencing', lead: 'Live captions, interpret bridges, and meeting summaries across dialects.' },
  { id: 'gaming', label: 'Game engines', lead: 'NPC and tutorial voice in African languages with Lugemi clone refs.' },
  { id: 'cms', label: 'CMS', lead: 'Publish localized pages and media beds from Lugemi translate + TTS.' },
  { id: 'localization', label: 'Subtitle & localization', lead: 'Timed captions, dubbing stems, and TMS string tables powered by Lugemi.' },
  { id: 'fintech', label: 'African fintech', lead: 'Voice OTP, USSD confirmations, and support lines in customer dialects.' },
  { id: 'chat', label: 'Chat & collaboration', lead: 'Slash-command and channel localize for African trade and support teams.' },
  { id: 'office', label: 'Office', lead: 'Docs and sheets for glossary, contracts, and education materials.' },
  { id: 'storage', label: 'Storage', lead: 'Pull media into Chat Studio and localization jobs.' },
  { id: 'email', label: 'Email', lead: 'Draft replies in the recipient language — Twi, Yorùbá, Kiswahili, and more.' },
];

export const PLATFORM_CONNECTOR_REGISTRY: PlatformConnectorEntry[] = [
  {
    id: 'twilio', name: 'Twilio', category: 'voice',
    blurb: 'PSTN / WhatsApp voice with Lugemi realtime dialect translate.',
    docs: 'Install with Account SID + Auth Token (or API key). Point Twilio webhooks at your Lugemi speech/translate gateway.',
    integrationGuide: 'On each turn call Lugemi STT → translate → TTS (or /v1/interpret). Use voice=clone:{id} for brand voice. Demo: POST /v1/connectors/platform/twilio/demo.',
    demoHref: '/playground?source=en&target=ak', demoLabel: 'Try en→Twi API playground',
    fields: ['accountSid', 'apiKey', 'webhookUrl'], envHint: 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN — configure in deploy env for production.',
    lugemiApis: ['stt', 'translate', 'tts', 'realtimeSegments', 'voiceClone'], webhookHint: '/v1/voice/twilio/inbound',
  },
  {
    id: 'vapi', name: 'VAPI', category: 'voice',
    blurb: 'Voice agent runtime that calls Lugemi as the speech + language layer.',
    docs: 'Paste a VAPI private key and optional webhook. Lugemi remains the Africa-first translate/TTS path.',
    integrationGuide: 'Custom STT/TTS → /v1/speech/stream and /v1/tts/stream; localize prompts with /v1/translate. Keep clone refs on Lugemi.',
    demoHref: '/chat', demoLabel: 'Open Chat Studio live demo',
    fields: ['apiKey', 'webhookUrl'], envHint: 'VAPI_API_KEY — set in env for live calls; soft-sandbox works without it.',
    lugemiApis: ['realtimeSegments', 'ttsStream', 'translate', 'voiceClone'],
  },
  {
    id: 'google-voice', name: 'Google Voice', category: 'voice',
    blurb: 'Business voice routing into Lugemi interpret + speech.',
    docs: 'Connect with OAuth project ID and API key when available. Save install state here and wire env later.',
    integrationGuide: 'Use /v1/interpret for bilingual turns on forwarded calls. Persist projectId for OAuth.',
    demoHref: '/interpret', demoLabel: 'Open Interpreter',
    fields: ['projectId', 'apiKey', 'webhookUrl'], envHint: 'GOOGLE_VOICE_PROJECT_ID, GOOGLE_VOICE_API_KEY — configure env later for live routing.',
    lugemiApis: ['stt', 'translate', 'tts'],
  },
  {
    id: 'vonage', name: 'Vonage', category: 'voice',
    blurb: 'Global voice API bridge for Lugemi dialect agents.',
    docs: 'API key + webhook URL. Lugemi handles language intelligence; Vonage carries the call media.',
    integrationGuide: 'On NCCO answer events, POST audio to /v1/speech/recognize, translate, then return Lugemi TTS.',
    demoHref: '/docs', demoLabel: 'Read voice API docs',
    fields: ['apiKey', 'webhookUrl'], envHint: 'VONAGE_API_KEY, VONAGE_API_SECRET — optional until go-live.',
    lugemiApis: ['stt', 'translate', 'tts', 'realtimeSegments'],
  },
  {
    id: 'livekit', name: 'LiveKit', category: 'voice',
    blurb: 'Realtime voice-agent rooms with Lugemi STT/TTS/translate plugins.',
    docs: 'API key + webhook. Point LiveKit agent workers at Lugemi realtime speech and dialect TTS.',
    integrationGuide: 'In LiveKit workers stream frames to /v1/speech/stream, translate if needed, speak with /v1/tts/stream using own:* or clone:{id}.',
    demoHref: '/playground?source=en&target=sw', demoLabel: 'Demo en→Kiswahili speech path',
    fields: ['apiKey', 'webhookUrl'], envHint: 'LIVEKIT_API_KEY, LIVEKIT_API_SECRET',
    lugemiApis: ['realtimeSegments', 'ttsStream', 'translate', 'voiceClone'],
  },
  {
    id: 'retell', name: 'Retell', category: 'voice',
    blurb: 'Voice agent builder that can delegate African language speech to Lugemi.',
    docs: 'Single API key install. Configure custom speech endpoints to Lugemi translate + TTS.',
    integrationGuide: 'Create agents with custom STT/TTS URLs that proxy to Lugemi. Use /v1/voice-clones for brand voice refs.',
    demoHref: '/voice', demoLabel: 'Open voice agents console',
    fields: ['apiKey', 'webhookUrl'], envHint: 'RETELL_API_KEY',
    lugemiApis: ['stt', 'tts', 'translate', 'voiceClone', 'realtimeSegments'],
  },
  {
    id: 'pipecat', name: 'Pipecat', category: 'voice',
    blurb: 'Open voice pipeline framework — Lugemi as the language intelligence transport.',
    docs: 'API key for Lugemi side; Pipecat services call Lugemi REST/SSE from your worker.',
    integrationGuide: 'Wire Pipecat STT/TTS services to Lugemi HTTP streaming endpoints for barge-in.',
    demoHref: '/docs/connectors#pipecat', demoLabel: 'Pipecat integration guide',
    fields: ['apiKey', 'webhookUrl'], envHint: 'LUGEMI_API_KEY (Pipecat worker env)',
    lugemiApis: ['realtimeSegments', 'ttsStream', 'translateStream', 'voiceClone'],
  },
  {
    id: 'telnyx', name: 'Telnyx', category: 'voice',
    blurb: 'Carrier-grade voice and messaging with Lugemi dialect agents.',
    docs: 'API key + Call Control webhook. Lugemi owns speech intelligence on the media path.',
    integrationGuide: 'On call events, forward audio to Lugemi STT and speak replies from Lugemi TTS.',
    demoHref: '/voice', demoLabel: 'Open voice console',
    fields: ['apiKey', 'webhookUrl'], envHint: 'TELNYX_API_KEY',
    lugemiApis: ['stt', 'tts', 'translate', 'realtimeSegments'],
  },
  {
    id: 'higgsfield', name: 'Higgsfield', category: 'video',
    blurb: 'Video generation synced to Lugemi voice tracks.',
    docs: 'Single API key install. Pipeline: Lugemi TTS/translate → clean audio → Higgsfield render.',
    integrationGuide: 'Generate dialogue with Lugemi TTS, then attach audio as the sole voice bed.',
    demoHref: '/audio', demoLabel: 'Generate Lugemi voice first',
    fields: ['apiKey', 'webhookUrl'], envHint: 'HIGGSFIELD_API_KEY — configure env when ready for production renders.',
    lugemiApis: ['translate', 'tts', 'voiceClone'],
  },
  {
    id: 'google-video', name: 'Google Video', category: 'video',
    blurb: 'Google video generation with Lugemi-localized audio beds.',
    docs: 'Project ID + API key. Keep voice/video sync on Lugemi.',
    integrationGuide: 'Translate scripts, synthesize with Lugemi, then pass audio to Google video jobs.',
    demoHref: '/translate?source=en&target=ak', demoLabel: 'Translate en→Twi for captions',
    fields: ['projectId', 'apiKey'], envHint: 'GOOGLE_VIDEO_PROJECT_ID, GOOGLE_VIDEO_API_KEY — requires credentials before use.',
    lugemiApis: ['translate', 'tts'],
  },
  {
    id: 'runway', name: 'Runway', category: 'video',
    blurb: 'Creative video jobs driven by Lugemi speech timing.',
    docs: 'API key install. Export Lugemi timing markers with audio so lip motion stays aligned.',
    integrationGuide: 'Call Lugemi TTS and feed Runway renders with Lugemi-only audio.',
    demoHref: '/playground', demoLabel: 'Test speech timing via playground',
    fields: ['apiKey'], envHint: 'RUNWAY_API_KEY — optional until creative pipeline is live.',
    lugemiApis: ['tts', 'stt', 'translate'],
  },
  {
    id: 'luma', name: 'Luma', category: 'video',
    blurb: 'Generative video with Lugemi-localized narration beds.',
    docs: 'API key install. Always generate speech in Lugemi first, then attach to Luma jobs.',
    integrationGuide: 'Translate scripts, synthesize Lugemi audio, then render — Lugemi owns speech.',
    demoHref: '/audio', demoLabel: 'Generate narration first',
    fields: ['apiKey'], envHint: 'LUMA_API_KEY',
    lugemiApis: ['translate', 'tts', 'voiceClone'],
  },
  {
    id: 'pika', name: 'Pika', category: 'video',
    blurb: 'Short-form video generation timed to Lugemi speech.',
    docs: 'API key. Export Lugemi timing with audio for lip-aware edits.',
    integrationGuide: 'Validate dialect lines in Playground, then attach Lugemi audio to Pika renders.',
    demoHref: '/playground?source=en&target=ak', demoLabel: 'Validate dialect line',
    fields: ['apiKey', 'webhookUrl'], envHint: 'PIKA_API_KEY',
    lugemiApis: ['tts', 'translate', 'stt'],
  },
  {
    id: 'whatsapp-cloud', name: 'WhatsApp Cloud API', category: 'messaging',
    blurb: 'Meta Cloud API messaging with Lugemi dialect reply text and voice notes.',
    docs: 'Phone number ID (project) + permanent token. Webhook for inbound messages.',
    integrationGuide: 'Inbound text → translate; voice notes → STT → translate → TTS reply note.',
    demoHref: '/translate?source=en&target=ha', demoLabel: 'Demo en→Hausa translate',
    fields: ['projectId', 'apiKey', 'webhookUrl'], envHint: 'WHATSAPP_CLOUD_TOKEN, WHATSAPP_PHONE_NUMBER_ID',
    lugemiApis: ['translate', 'stt', 'tts', 'voiceClone'],
  },
  {
    id: 'africas-talking', name: 'Africa\'s Talking', category: 'messaging',
    blurb: 'Pan-African SMS, USSD, voice, and WhatsApp with Lugemi language layer.',
    docs: 'Username as account SID + API key. Point voice/USSD callbacks at Lugemi-backed handlers.',
    integrationGuide: 'USSD/IVR prompts via translate + TTS; WhatsApp bots reuse the same dialect path.',
    demoHref: '/playground?source=en&target=ak', demoLabel: 'Try en→Twi playground',
    fields: ['accountSid', 'apiKey', 'webhookUrl'], envHint: 'AT_USERNAME, AT_API_KEY',
    lugemiApis: ['translate', 'tts', 'stt', 'realtimeSegments'],
  },
  {
    id: 'infobip', name: 'Infobip', category: 'messaging',
    blurb: 'Omnichannel CPaaS — Lugemi powers African language content on every channel.',
    docs: 'API key + optional Base URL webhook. Compose SMS/WhatsApp/voice with Lugemi translate/TTS.',
    integrationGuide: 'Localize templates before send; inbound media through /v1/speech/recognize.',
    demoHref: '/translate?source=en&target=yo', demoLabel: 'Demo en→Yorùbá',
    fields: ['apiKey', 'webhookUrl'], envHint: 'INFOBIP_API_KEY, INFOBIP_BASE_URL',
    lugemiApis: ['translate', 'tts', 'stt'],
  },
  {
    id: 'amazon-connect', name: 'Amazon Connect', category: 'contact-center',
    blurb: 'Contact-center flows with Lugemi dialect STT, coaching text, and TTS prompts.',
    docs: 'Connect Instance ARN / project ID + API key. Lambda hooks call Lugemi.',
    integrationGuide: 'Lambda: recordings → STT; IVR prompts from TTS; agent assist via translate.',
    demoHref: '/interpret', demoLabel: 'Try interpret STT→MT→TTS',
    fields: ['projectId', 'apiKey', 'webhookUrl'], envHint: 'AMAZON_CONNECT_INSTANCE_ID, AWS_REGION',
    lugemiApis: ['stt', 'translate', 'tts', 'realtimeSegments'],
  },
  {
    id: 'genesys', name: 'Genesys Cloud', category: 'contact-center',
    blurb: 'Enterprise CCaaS with Lugemi African language assist and voice prompts.',
    docs: 'OAuth client / API key + webhook. Architect actions invoke Lugemi speech APIs.',
    integrationGuide: 'Architect data actions → Lugemi translate/TTS; captions via speech + translate streams.',
    demoHref: '/chat', demoLabel: 'Chat Studio agent assist demo',
    fields: ['apiKey', 'webhookUrl', 'projectId'], envHint: 'GENESYS_CLIENT_ID, GENESYS_CLIENT_SECRET',
    lugemiApis: ['stt', 'translate', 'tts', 'realtimeSegments', 'translateStream'],
  },
  {
    id: 'salesforce', name: 'Salesforce', category: 'crm',
    blurb: 'CRM cases and Voice calls localized with Lugemi language intelligence.',
    docs: 'Connected App consumer key as API key + org/project ID. Apex or Flow calls Lugemi REST.',
    integrationGuide: 'Flow/Apex: translate case comments; STT call recordings; dialect fields on Contact.',
    demoHref: '/glossary', demoLabel: 'Open glossary for CRM terms',
    fields: ['apiKey', 'projectId', 'webhookUrl'], envHint: 'SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET',
    lugemiApis: ['translate', 'stt', 'tts'],
  },
  {
    id: 'hubspot', name: 'HubSpot', category: 'crm',
    blurb: 'Marketing and service hub with Lugemi multilingual tickets and call notes.',
    docs: 'Private app token as API key. Webhooks for ticket/conversation events.',
    integrationGuide: 'Localize ticket replies; transcribe calls before CRM note writeback.',
    demoHref: '/chat', demoLabel: 'Draft multilingual reply',
    fields: ['apiKey', 'webhookUrl'], envHint: 'HUBSPOT_PRIVATE_APP_TOKEN',
    lugemiApis: ['translate', 'stt'],
  },
  {
    id: 'moodle', name: 'Moodle', category: 'lms',
    blurb: 'Open LMS — course text, quiz, and video dubbing via Lugemi.',
    docs: 'Web services token as API key + site URL webhook.',
    integrationGuide: 'Batch course strings with /v1/localize; dub lectures STT → translate → TTS.',
    demoHref: '/translate?source=en&target=sw', demoLabel: 'Localize lesson en→Kiswahili',
    fields: ['apiKey', 'webhookUrl'], envHint: 'MOODLE_TOKEN, MOODLE_BASE_URL',
    lugemiApis: ['translate', 'stt', 'tts'],
  },
  {
    id: 'canvas-lms', name: 'Canvas LMS', category: 'lms',
    blurb: 'Instructure Canvas courses with Lugemi captions and dubbed media.',
    docs: 'Developer key / access token + account ID.',
    integrationGuide: 'Translate assignment HTML; generate Lugemi voice beds and SRT for video modules.',
    demoHref: '/audio', demoLabel: 'Generate lesson narration',
    fields: ['apiKey', 'projectId', 'webhookUrl'], envHint: 'CANVAS_ACCESS_TOKEN, CANVAS_ACCOUNT_ID',
    lugemiApis: ['translate', 'tts', 'stt'],
  },
  {
    id: 'dhis2', name: 'DHIS2', category: 'healthcare',
    blurb: 'Health information system UI and SMS/voice outreach in local languages.',
    docs: 'API token + instance base URL. Translate metadata and program messages with Lugemi.',
    integrationGuide: 'Localize program SMS; voice reminders via TTS; human review for clinical wording.',
    demoHref: '/language-integrity', demoLabel: 'Language integrity console',
    fields: ['apiKey', 'webhookUrl'], envHint: 'DHIS2_TOKEN, DHIS2_BASE_URL',
    lugemiApis: ['translate', 'tts'],
  },
  {
    id: 'openmrs', name: 'OpenMRS', category: 'healthcare',
    blurb: 'Open medical records — patient-facing language and voice explainers.',
    docs: 'Basic auth token / API key + server URL.',
    integrationGuide: 'Patient education leaflets + clinic IVR/WhatsApp voice notes via Lugemi.',
    demoHref: '/audio', demoLabel: 'Synthesize patient education audio',
    fields: ['apiKey', 'webhookUrl'], envHint: 'OPENMRS_USER, OPENMRS_PASS',
    lugemiApis: ['translate', 'tts', 'stt', 'voiceClone'],
  },
  {
    id: 'zoom', name: 'Zoom', category: 'conferencing',
    blurb: 'Meeting captions and interpret bridges powered by Lugemi dialects.',
    docs: 'OAuth app credentials (client id as project, secret as API key) + webhook.',
    integrationGuide: 'Meeting audio → speech/translate streams → captions; optional TTS interpret channel.',
    demoHref: '/interpret', demoLabel: 'Open live interpreter',
    fields: ['projectId', 'apiKey', 'webhookUrl'], envHint: 'ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET',
    lugemiApis: ['realtimeSegments', 'translateStream', 'tts'],
  },
  {
    id: 'daily', name: 'Daily', category: 'conferencing',
    blurb: 'WebRTC rooms with Lugemi live caption and voice agent participants.',
    docs: 'API key install. Bot participants call Lugemi realtime speech APIs.',
    integrationGuide: 'Daily bot forwards PCM to /v1/speech/stream and plays /v1/tts/stream replies.',
    demoHref: '/chat', demoLabel: 'Chat Studio live demo',
    fields: ['apiKey', 'webhookUrl'], envHint: 'DAILY_API_KEY',
    lugemiApis: ['realtimeSegments', 'ttsStream', 'translate'],
  },
  {
    id: 'unity', name: 'Unity', category: 'gaming',
    blurb: 'Game engine NPC dialogue and tutorials with Lugemi African voices.',
    docs: 'Project ID + API key via secure server proxy (never ship live keys in clients).',
    integrationGuide: 'Game server → /v1/tts/synthesize or stream; subtitle banks via /v1/localize.',
    demoHref: '/audio', demoLabel: 'Preview Lugemi game voices',
    fields: ['projectId', 'apiKey'], envHint: 'UNITY_LUGEMI_PROXY_URL, LUGEMI_API_KEY',
    lugemiApis: ['tts', 'ttsStream', 'translate', 'voiceClone'],
  },
  {
    id: 'unreal', name: 'Unreal Engine', category: 'gaming',
    blurb: 'Unreal MetaSound / runtime dialogue driven by Lugemi TTS and clones.',
    docs: 'API key via trusted backend. Soft-connect in Studio; runtime uses server proxy.',
    integrationGuide: 'HTTP via trusted backend to Lugemi TTS/STT; clone enrollment stays on Lugemi.',
    demoHref: '/voice-cloning', demoLabel: 'Open voice cloning',
    fields: ['apiKey', 'projectId'], envHint: 'UNREAL_LUGEMI_PROXY_URL, LUGEMI_API_KEY',
    lugemiApis: ['tts', 'voiceClone', 'translate'],
  },
  {
    id: 'contentful', name: 'Contentful', category: 'cms',
    blurb: 'Headless CMS entries localized with Lugemi translate and media TTS.',
    docs: 'Management API token + space ID.',
    integrationGuide: 'Publish webhook → translate/localize fields; optional TTS asset for spoken articles.',
    demoHref: '/localize', demoLabel: 'Open localize console',
    fields: ['apiKey', 'projectId', 'webhookUrl'], envHint: 'CONTENTFUL_MANAGEMENT_TOKEN, CONTENTFUL_SPACE_ID',
    lugemiApis: ['translate', 'tts'],
  },
  {
    id: 'wordpress', name: 'WordPress', category: 'cms',
    blurb: 'Posts and media localized with a Lugemi plugin key.',
    docs: 'Application password / API key + site webhook.',
    integrationGuide: 'Translate posts; featured audio via TTS; caption media via STT.',
    demoHref: '/translate', demoLabel: 'Open translate',
    fields: ['apiKey', 'webhookUrl'], envHint: 'WORDPRESS_APP_PASSWORD, WORDPRESS_SITE_URL',
    lugemiApis: ['translate', 'tts', 'stt'],
  },
  {
    id: 'captionhub', name: 'CaptionHub', category: 'localization',
    blurb: 'Professional captions and dubbing stems fed by Lugemi STT/TTS/translate.',
    docs: 'API key install. Push transcripts and pull timed files around Lugemi speech jobs.',
    integrationGuide: 'STT + translate cues + Lugemi TTS dubs; CaptionHub remains the editorial shell.',
    demoHref: '/playground', demoLabel: 'Test caption translate path',
    fields: ['apiKey', 'webhookUrl'], envHint: 'CAPTIONHUB_API_KEY',
    lugemiApis: ['stt', 'translate', 'tts'],
  },
  {
    id: 'phrase', name: 'Phrase', category: 'localization',
    blurb: 'TMS string tables and jobs with Lugemi machine translate + glossary.',
    docs: 'Access token + project ID. Sync keys through Lugemi /v1/localize.',
    integrationGuide: 'Export Phrase jobs → /v1/localize; glossary sync via /v1/glossary/terms.',
    demoHref: '/glossary', demoLabel: 'Open glossary',
    fields: ['apiKey', 'projectId'], envHint: 'PHRASE_ACCESS_TOKEN, PHRASE_PROJECT_ID',
    lugemiApis: ['translate'],
  },
  {
    id: 'flutterwave', name: 'Flutterwave', category: 'fintech',
    blurb: 'African payments — voice OTP, receipt readouts, and support in local languages.',
    docs: 'Secret key as API key + webhook for payment events. Lugemi never vaults cards.',
    integrationGuide: 'Charge webhooks → localized SMS/WhatsApp + optional TTS receipt audio.',
    demoHref: '/translate?source=en&target=yo', demoLabel: 'Localize payment SMS en→Yorùbá',
    fields: ['apiKey', 'webhookUrl'], envHint: 'FLUTTERWAVE_SECRET_KEY',
    lugemiApis: ['translate', 'tts'],
  },
  {
    id: 'paystack', name: 'Paystack', category: 'fintech',
    blurb: 'Nigerian and African checkout alerts with Lugemi dialect messaging.',
    docs: 'Secret key + webhook. Localize customer notifications; Lugemi does not vault cards.',
    integrationGuide: 'Translate settlement/OTP messages; IVR confirmations via Lugemi TTS + your CPaaS.',
    demoHref: '/translate?source=en&target=ha', demoLabel: 'Localize alerts en→Hausa',
    fields: ['apiKey', 'webhookUrl'], envHint: 'PAYSTACK_SECRET_KEY',
    lugemiApis: ['translate', 'tts'],
  },
  {
    id: 'slack', name: 'Slack', category: 'chat',
    blurb: 'Slash-command translate in channels.',
    docs: 'Link a Slack Team ID after installing the Lugemi Slack app. Signing secret and bot token live in API env.',
    integrationGuide: 'Slash Request URL → POST /v1/connectors/slack/commands; default dialect per Team ID.',
    demoHref: '/connectors#slack', demoLabel: 'Configure Slack install',
    fields: [], envHint: 'SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN',
    lugemiApis: ['translate'],
  },
  {
    id: 'teams', name: 'Microsoft Teams', category: 'chat',
    blurb: 'Meeting captions and channel localization.',
    docs: 'Save install intent + webhook. Full Graph credentials configure in env later.',
    integrationGuide: 'Meeting audio → /v1/speech/stream + /v1/translate/stream → Graph captions.',
    demoHref: '/chat', demoLabel: 'Try Chat Studio plugins',
    fields: ['webhookUrl', 'apiKey'], envHint: 'TEAMS_APP_ID, TEAMS_APP_SECRET — configure env later.',
    lugemiApis: ['realtimeSegments', 'translateStream', 'tts'],
  },
  {
    id: 'gmail', name: 'Gmail', category: 'email',
    blurb: 'Draft replies in the recipient’s language.',
    docs: 'OAuth / API key path. Soft-connect stores intent; production uses Google OAuth client secrets in env.',
    integrationGuide: 'Draft body through /v1/translate before send.',
    demoHref: '/translate?source=en&target=yo', demoLabel: 'Demo en→Yorùbá translate',
    fields: ['apiKey'], envHint: 'GOOGLE_OAUTH_CLIENT_ID — configure env later.',
    lugemiApis: ['translate'],
  },
  {
    id: 'outlook', name: 'Outlook', category: 'email',
    blurb: 'Office 365 mail + calendar phrasing.',
    docs: 'Microsoft Graph app registration. Soft-connect here; MS_GRAPH_* env for live mail.',
    integrationGuide: 'Localize subject/body with /v1/translate; glossary via workspace TM.',
    demoHref: '/chat', demoLabel: 'Draft in Chat Studio',
    fields: ['apiKey'], envHint: 'MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET',
    lugemiApis: ['translate'],
  },
  {
    id: 'gdrive', name: 'Google Drive', category: 'storage',
    blurb: 'Pull docs into Chat Studio for translate.',
    docs: 'Service account or OAuth. Soft-connect marks the plugin installed.',
    integrationGuide: 'Watch folders → /v1/documents/translate or knowledge upload.',
    demoHref: '/chat', demoLabel: 'Upload in Chat Studio',
    fields: ['apiKey', 'projectId'], envHint: 'GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON',
    lugemiApis: ['translate'],
  },
  {
    id: 'onedrive', name: 'OneDrive', category: 'storage',
    blurb: 'Sync Word/PDF folders for localization.',
    docs: 'Graph-backed folder watch. Soft-connect until ONEDRIVE_* env is set.',
    integrationGuide: 'Enqueue document_translate jobs; return localized copies to the folder.',
    demoHref: '/documents', demoLabel: 'Open Documents',
    fields: ['apiKey'], envHint: 'ONEDRIVE_CLIENT_ID',
    lugemiApis: ['translate'],
  },
  {
    id: 'dropbox', name: 'Dropbox', category: 'storage',
    blurb: 'Watch shared folders for new assets.',
    docs: 'App token + webhook. Soft-connect stores install; DROPBOX_ACCESS_TOKEN for live sync.',
    integrationGuide: 'Webhook file adds → STT for media, translate for text.',
    demoHref: '/chat', demoLabel: 'Attach files in Chat Studio',
    fields: ['apiKey', 'webhookUrl'], envHint: 'DROPBOX_ACCESS_TOKEN',
    lugemiApis: ['stt', 'translate', 'tts'],
  },
  {
    id: 'notion', name: 'Notion', category: 'office',
    blurb: 'Translate pages and knowledge bases.',
    docs: 'Internal integration token. Soft-connect for Chat Studio; NOTION_TOKEN for page sync.',
    integrationGuide: 'Export blocks → translate/localize → write localized pages back.',
    demoHref: '/knowledge', demoLabel: 'Open Knowledge',
    fields: ['apiKey'], envHint: 'NOTION_TOKEN',
    lugemiApis: ['translate'],
  },
  {
    id: 'sheets', name: 'Google Sheets', category: 'office',
    blurb: 'Batch glossary + string tables.',
    docs: 'Service account with sheet scope. Soft-connect until GOOGLE_SHEETS_* env is ready.',
    integrationGuide: 'Batch cells through /v1/translate; upsert glossary terms.',
    demoHref: '/glossary', demoLabel: 'Open Glossary',
    fields: ['apiKey', 'projectId'], envHint: 'GOOGLE_SHEETS_SERVICE_ACCOUNT',
    lugemiApis: ['translate'],
  },
  {
    id: 'docs', name: 'Google Docs', category: 'office',
    blurb: 'Export localized copies of long-form docs.',
    docs: 'Same Google Cloud project as Drive/Sheets. Soft-connect marks plugin ready.',
    integrationGuide: 'document_translate jobs; official filings on human review.',
    demoHref: '/translate/formats', demoLabel: 'Document formats',
    fields: ['apiKey', 'projectId'], envHint: 'GOOGLE_DOCS_API_KEY',
    lugemiApis: ['translate'],
  },
  {
    id: 'box', name: 'Box', category: 'storage',
    blurb: 'Enterprise file sync for localization jobs.',
    docs: 'JWT / developer token. Soft-connect; BOX_CLIENT_ID for production.',
    integrationGuide: 'Enterprise media → Lugemi STT/TTS/translate with audit events.',
    demoHref: '/documents', demoLabel: 'Open Documents',
    fields: ['apiKey'], envHint: 'BOX_CLIENT_ID, BOX_CLIENT_SECRET',
    lugemiApis: ['stt', 'translate', 'tts'],
  },
];

export function findPlatformConnector(id: string): PlatformConnectorEntry | undefined {
  const normalized = id.trim().toLowerCase();
  return PLATFORM_CONNECTOR_REGISTRY.find((c) => c.id === normalized);
}

export function platformConnectorsEngine() {
  return {
    product: 'Lugemi Platform Connectors',
    note: 'Studio Connectors hub registry for one-click plugin installs. Lugemi is first-party language intelligence; listed vendors are integration targets only.',
    categories: PLATFORM_CONNECTOR_CATEGORIES,
    apis: LUGEMI_PLATFORM_APIS,
    connectors: PLATFORM_CONNECTOR_REGISTRY.map((c) => ({
      id: c.id, name: c.name, category: c.category, blurb: c.blurb, fields: c.fields,
      demoHref: c.demoHref, lugemiApis: c.lugemiApis,
    })),
    console: '/connectors',
    docs: '/docs/connectors',
    sdk: {
      typescript: '@lugemi/sdk → platformConnectors(), platformConnector(id), platformConnectorDemo(id)',
      python: 'packages/sdk-python → Lugemi.platform_connectors()',
    },
  };
}

export function platformConnectorGuide(entry: PlatformConnectorEntry) {
  const apiLines = entry.lugemiApis
    .map((key) => {
      const api = LUGEMI_PLATFORM_APIS[key];
      return `${api.method} ${api.path} — ${api.summary}`;
    })
    .join('\n');
  const tsSnippet = `import { Lugemi } from '@lugemi/sdk';

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
  baseUrl: process.env.LUGEMI_BASE_URL,
});

// ${entry.name} → Lugemi language path
const translated = await client.translate({
  text: 'Hello',
  source: 'en',
  target: 'ak',
});

const speech = await client.speech({
  text: translated.text,
  voice: 'own:ak-gh-female', // or clone:{id}
});

const guide = await client.platformConnector('${entry.id}');
await client.platformConnectorDemo('${entry.id}', { text: 'Hello', target: 'ak' });`;

  const pySnippet = `from lugemi import Lugemi

client = Lugemi(api_key=os.environ["LUGEMI_API_KEY"])

translated = client.translate(text="Hello", source="en", target="ak")
audio = client.speech(text=translated["text"], voice="own:ak-gh-female")
guide = client.platform_connector("${entry.id}")
demo = client.platform_connector_demo("${entry.id}", text="Hello", target="ak")`;

  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    blurb: entry.blurb,
    docs: entry.docs,
    integrationGuide: entry.integrationGuide,
    fields: entry.fields,
    envHint: entry.envHint,
    demoHref: entry.demoHref,
    demoLabel: entry.demoLabel,
    webhookHint: entry.webhookHint ?? null,
    lugemiApis: entry.lugemiApis.map((key) => LUGEMI_PLATFORM_APIS[key]),
    apiReference: apiLines,
    sdk: { typescript: tsSnippet, python: pySnippet },
    demo: {
      method: 'POST',
      path: `/v1/connectors/platform/${entry.id}/demo`,
      summary: 'Soft-sandbox demo: translate sample text and echo connector wiring tips.',
    },
  };
}

