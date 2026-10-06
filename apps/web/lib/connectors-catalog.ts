/**
 * Shared Lugemi connector / plugin catalog for Workspace Console + Chat Studio.
 * Vendor platform names here are integration targets (Twilio, VAPI, etc.).
 */

export type ConnectorCategory =
  | 'voice'
  | 'video'
  | 'chat'
  | 'office'
  | 'storage'
  | 'email';

export type ConnectorField = 'apiKey' | 'webhookUrl' | 'accountSid' | 'projectId';

export type ConnectorDef = {
  id: string;
  name: string;
  category: ConnectorCategory;
  blurb: string;
  docs: string;
  demoHref: string;
  demoLabel: string;
  fields: ConnectorField[];
  envHint: string;
  href?: string;
  liveStatus?: 'slack';
};

export type ConnectorInstall = {
  connected: boolean;
  apiKey?: string;
  webhookUrl?: string;
  accountSid?: string;
  projectId?: string;
  connectedAt?: number;
};

export const PLATFORM_CONNECTOR_KEY = 'lugemi_platform_connectors_v1';
export const CHAT_CONNECTOR_KEY = 'lugemi_chat_connectors_v1';

export const CONNECTOR_CATEGORIES: {
  id: ConnectorCategory;
  label: string;
  lead: string;
}[] = [
  {
    id: 'voice',
    label: 'Voice platforms',
    lead: 'Route Lugemi speech + dialect translate into telephony and voice agent stacks with one API key.',
  },
  {
    id: 'video',
    label: 'Video generation',
    lead: 'Drive lip-sync and localized video from Lugemi voice without stacking external audio noise.',
  },
  {
    id: 'chat',
    label: 'Chat & collaboration',
    lead: 'Slash-command and channel localize for African trade and support teams.',
  },
  {
    id: 'office',
    label: 'Office',
    lead: 'Docs and sheets for glossary, contracts, and education materials.',
  },
  {
    id: 'storage',
    label: 'Storage',
    lead: 'Pull media into Chat Studio and localization jobs.',
  },
  {
    id: 'email',
    label: 'Email',
    lead: 'Draft replies in the recipient’s language — Twi, Yorùbá, Kiswahili, and more.',
  },
];

export const PLATFORM_CONNECTORS: ConnectorDef[] = [
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'voice',
    blurb: 'PSTN / WhatsApp voice with Lugemi realtime dialect translate.',
    docs: 'Install with Account SID + Auth Token (or API key). Point Twilio webhooks at your Lugemi speech/translate gateway. Live credentials stay in env (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN) when not stored here.',
    demoHref: '/playground?source=en&target=ak',
    demoLabel: 'Try en→Twi API playground',
    fields: ['accountSid', 'apiKey', 'webhookUrl'],
    envHint: 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN — configure in deploy env for production.',
    href: '/connectors#twilio',
  },
  {
    id: 'vapi',
    name: 'VAPI',
    category: 'voice',
    blurb: 'Voice agent runtime that calls Lugemi as the speech + language layer.',
    docs: 'Paste a VAPI private key and optional webhook. Lugemi remains the Africa-first translate/TTS path; VAPI orchestrates the call loop. Production keys: VAPI_API_KEY in env.',
    demoHref: '/chat',
    demoLabel: 'Open Chat Studio live demo',
    fields: ['apiKey', 'webhookUrl'],
    envHint: 'VAPI_API_KEY — set in env for live calls; soft-sandbox works without it.',
    href: '/connectors#vapi',
  },
  {
    id: 'google-voice',
    name: 'Google Voice',
    category: 'voice',
    blurb: 'Business voice routing into Lugemi interpret + speech.',
    docs: 'Connect with OAuth project ID and API key when available. Until Google Voice APIs are provisioned, save the install state here and wire GOOGLE_VOICE_* env later.',
    demoHref: '/interpret',
    demoLabel: 'Open Interpreter',
    fields: ['projectId', 'apiKey', 'webhookUrl'],
    envHint: 'GOOGLE_VOICE_PROJECT_ID, GOOGLE_VOICE_API_KEY — configure env later for live routing.',
    href: '/connectors#google-voice',
  },
  {
    id: 'vonage',
    name: 'Vonage',
    category: 'voice',
    blurb: 'Global voice API bridge for Lugemi dialect agents.',
    docs: 'API key + webhook URL. Lugemi handles language intelligence; Vonage carries the call media.',
    demoHref: '/docs',
    demoLabel: 'Read voice API docs',
    fields: ['apiKey', 'webhookUrl'],
    envHint: 'VONAGE_API_KEY, VONAGE_API_SECRET — optional until go-live.',
    href: '/connectors#vonage',
  },
  {
    id: 'higgsfield',
    name: 'Higgsfield',
    category: 'video',
    blurb: 'Video generation synced to Lugemi voice tracks.',
    docs: 'Single API key install. Pipeline: Lugemi TTS/translate → clean audio → Higgsfield render. No third-party voice overlay — Lugemi audio is the source of truth.',
    demoHref: '/audio',
    demoLabel: 'Generate Lugemi voice first',
    fields: ['apiKey', 'webhookUrl'],
    envHint: 'HIGGSFIELD_API_KEY — configure env when ready for production renders.',
    href: '/connectors#higgsfield',
  },
  {
    id: 'google-video',
    name: 'Google Video',
    category: 'video',
    blurb: 'Google video generation with Lugemi-localized audio beds.',
    docs: 'Project ID + API key. Keep voice/video sync on Lugemi: generate speech here, attach to Google video jobs. Env: GOOGLE_VIDEO_API_KEY.',
    demoHref: '/translate?source=en&target=ak',
    demoLabel: 'Translate en→Twi for captions',
    fields: ['projectId', 'apiKey'],
    envHint: 'GOOGLE_VIDEO_PROJECT_ID, GOOGLE_VIDEO_API_KEY — deferred until credentials exist.',
    href: '/connectors#google-video',
  },
  {
    id: 'runway',
    name: 'Runway',
    category: 'video',
    blurb: 'Creative video jobs driven by Lugemi speech timing.',
    docs: 'API key install. Export Lugemi timing markers with audio so lip motion stays aligned — clean sync, no stacked vendor TTS.',
    demoHref: '/playground',
    demoLabel: 'Test speech timing via playground',
    fields: ['apiKey'],
    envHint: 'RUNWAY_API_KEY — optional until creative pipeline is live.',
    href: '/connectors#runway',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'chat',
    blurb: 'Slash-command translate in channels.',
    docs: 'Link a Slack Team ID after installing the Lugemi Slack app. Signing secret and bot token live in API env.',
    demoHref: '/connectors#slack',
    demoLabel: 'Configure Slack install',
    fields: [],
    envHint: 'SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN',
    href: '/connectors#slack',
    liveStatus: 'slack',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'chat',
    blurb: 'Meeting captions and channel localization.',
    docs: 'Save install intent + webhook. Full Graph credentials configure in env later (TEAMS_APP_ID / TEAMS_APP_SECRET).',
    demoHref: '/chat',
    demoLabel: 'Try Chat Studio plugins',
    fields: ['webhookUrl', 'apiKey'],
    envHint: 'TEAMS_APP_ID, TEAMS_APP_SECRET — configure env later.',
    href: '/connectors#teams',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'email',
    blurb: 'Draft replies in the recipient’s language.',
    docs: 'OAuth / API key path. Soft-connect stores intent; production uses Google OAuth client secrets in env.',
    demoHref: '/translate?source=en&target=yo',
    demoLabel: 'Demo en→Yorùbá translate',
    fields: ['apiKey'],
    envHint: 'GOOGLE_OAUTH_CLIENT_ID — configure env later.',
    href: '/connectors#gmail',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    category: 'email',
    blurb: 'Office 365 mail + calendar phrasing.',
    docs: 'Microsoft Graph app registration. Soft-connect here; MS_GRAPH_* env for live mail.',
    demoHref: '/chat',
    demoLabel: 'Draft in Chat Studio',
    fields: ['apiKey'],
    envHint: 'MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET',
    href: '/connectors#outlook',
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    category: 'storage',
    blurb: 'Pull docs into Chat Studio for translate.',
    docs: 'Service account or OAuth. Soft-connect marks the plugin installed; credentials in env for sync jobs.',
    demoHref: '/chat',
    demoLabel: 'Upload in Chat Studio',
    fields: ['apiKey', 'projectId'],
    envHint: 'GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON',
    href: '/connectors#gdrive',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    category: 'storage',
    blurb: 'Sync Word/PDF folders for localization.',
    docs: 'Graph-backed folder watch. Soft-connect until ONEDRIVE_* env is set.',
    demoHref: '/documents',
    demoLabel: 'Open Documents',
    fields: ['apiKey'],
    envHint: 'ONEDRIVE_CLIENT_ID',
    href: '/connectors#onedrive',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'storage',
    blurb: 'Watch shared folders for new assets.',
    docs: 'App token + webhook. Soft-connect stores install; DROPBOX_ACCESS_TOKEN for live sync.',
    demoHref: '/chat',
    demoLabel: 'Attach files in Chat Studio',
    fields: ['apiKey', 'webhookUrl'],
    envHint: 'DROPBOX_ACCESS_TOKEN',
    href: '/connectors#dropbox',
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'office',
    blurb: 'Translate pages and knowledge bases.',
    docs: 'Internal integration token. Soft-connect for Chat Studio; NOTION_TOKEN for page sync.',
    demoHref: '/knowledge',
    demoLabel: 'Open Knowledge',
    fields: ['apiKey'],
    envHint: 'NOTION_TOKEN',
    href: '/connectors#notion',
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    category: 'office',
    blurb: 'Batch glossary + string tables.',
    docs: 'Service account with sheet scope. Soft-connect until GOOGLE_SHEETS_* env is ready.',
    demoHref: '/glossary',
    demoLabel: 'Open Glossary',
    fields: ['apiKey', 'projectId'],
    envHint: 'GOOGLE_SHEETS_SERVICE_ACCOUNT',
    href: '/connectors#sheets',
  },
  {
    id: 'docs',
    name: 'Google Docs',
    category: 'office',
    blurb: 'Export localized copies of long-form docs.',
    docs: 'Same Google Cloud project as Drive/Sheets. Soft-connect marks plugin ready.',
    demoHref: '/translate/formats',
    demoLabel: 'Document formats',
    fields: ['apiKey', 'projectId'],
    envHint: 'GOOGLE_DOCS_API_KEY',
    href: '/connectors#docs',
  },
  {
    id: 'box',
    name: 'Box',
    category: 'storage',
    blurb: 'Enterprise file sync for localization jobs.',
    docs: 'JWT / developer token. Soft-connect; BOX_CLIENT_ID for production.',
    demoHref: '/documents',
    demoLabel: 'Open Documents',
    fields: ['apiKey'],
    envHint: 'BOX_CLIENT_ID, BOX_CLIENT_SECRET',
    href: '/connectors#box',
  },
];

export const FIELD_LABELS: Record<ConnectorField, string> = {
  apiKey: 'API key',
  webhookUrl: 'Webhook URL',
  accountSid: 'Account SID',
  projectId: 'Project ID',
};

export function loadInstalls(): Record<string, ConnectorInstall> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PLATFORM_CONNECTOR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, ConnectorInstall>;
      if (parsed && typeof parsed === 'object') return parsed;
    }
    const legacy = window.localStorage.getItem(CHAT_CONNECTOR_KEY);
    if (legacy) {
      const flags = JSON.parse(legacy) as Record<string, boolean>;
      const migrated: Record<string, ConnectorInstall> = {};
      for (const [id, on] of Object.entries(flags)) {
        if (on) migrated[id] = { connected: true, connectedAt: Date.now() };
      }
      saveInstalls(migrated);
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function saveInstalls(map: Record<string, ConnectorInstall>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PLATFORM_CONNECTOR_KEY, JSON.stringify(map));
  const flags: Record<string, boolean> = {};
  for (const [id, row] of Object.entries(map)) {
    flags[id] = Boolean(row.connected);
  }
  window.localStorage.setItem(CHAT_CONNECTOR_KEY, JSON.stringify(flags));
}

export function connectedFlags(map: Record<string, ConnectorInstall>): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const [id, row] of Object.entries(map)) {
    flags[id] = Boolean(row.connected);
  }
  return flags;
}

export function countConnected(map: Record<string, ConnectorInstall>) {
  return Object.values(map).filter((r) => r.connected).length;
}
