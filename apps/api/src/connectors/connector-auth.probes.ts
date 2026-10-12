import type { ConnectorCredentials } from './connector-crypto';

export type AuthProbeResult = {
  ok: boolean;
  provider: string;
  note: string;
  statusCode?: number;
};

type ProbeFn = (creds: ConnectorCredentials) => Promise<AuthProbeResult>;

async function httpProbe(input: {
  url: string;
  headers?: Record<string, string>;
  provider: string;
  method?: string;
}): Promise<AuthProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(input.url, {
      method: input.method ?? 'GET',
      headers: input.headers,
      signal: controller.signal,
      redirect: 'manual',
    });
    if (res.status >= 200 && res.status < 300) {
      return {
        ok: true,
        provider: input.provider,
        note: `Authenticated with ${input.provider} (${res.status}).`,
        statusCode: res.status,
      };
    }
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        provider: input.provider,
        note: `${input.provider} rejected these credentials (${res.status}).`,
        statusCode: res.status,
      };
    }
    return {
      ok: false,
      provider: input.provider,
      note: `${input.provider} auth probe returned HTTP ${res.status}.`,
      statusCode: res.status,
    };
  } catch (err) {
    return {
      ok: false,
      provider: input.provider,
      note:
        err instanceof Error
          ? `${input.provider} auth probe failed: ${err.message}`
          : `${input.provider} auth probe failed.`,
    };
  } finally {
    clearTimeout(timer);
  }
}

function requireFields(
  creds: ConnectorCredentials,
  fields: Array<keyof ConnectorCredentials>,
): string | null {
  for (const f of fields) {
    const v = creds[f]?.trim();
    if (!v) return `${f} is required for realtime auth`;
  }
  return null;
}

const PROBES: Record<string, ProbeFn> = {
  twilio: async (creds) => {
    const miss = requireFields(creds, ['accountSid', 'apiKey']);
    if (miss) return { ok: false, provider: 'twilio', note: miss };
    const token = Buffer.from(`${creds.accountSid}:${creds.apiKey}`).toString('base64');
    return httpProbe({
      provider: 'twilio',
      url: `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(creds.accountSid!)}.json`,
      headers: { Authorization: `Basic ${token}` },
    });
  },
  vapi: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'vapi', note: miss };
    return httpProbe({
      provider: 'vapi',
      url: 'https://api.vapi.ai/assistant',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  vonage: async (creds) => {
    const miss = requireFields(creds, ['apiKey', 'accountSid']);
    if (miss) return { ok: false, provider: 'vonage', note: miss };
    // accountSid field holds API secret for Vonage in our form mapping
    const token = Buffer.from(`${creds.apiKey}:${creds.accountSid}`).toString('base64');
    return httpProbe({
      provider: 'vonage',
      url: 'https://rest.nexmo.com/account/get-balance',
      headers: { Authorization: `Basic ${token}` },
    });
  },
  telnyx: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'telnyx', note: miss };
    return httpProbe({
      provider: 'telnyx',
      url: 'https://api.telnyx.com/v2/balance',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  retell: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'retell', note: miss };
    return httpProbe({
      provider: 'retell',
      url: 'https://api.retellai.com/list-agents',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  livekit: async (creds) => {
    const miss = requireFields(creds, ['apiKey', 'projectId']);
    if (miss) return { ok: false, provider: 'livekit', note: miss };
    // LiveKit Cloud: projectId = host URL, apiKey = API key (secret in webhookUrl or apiKey pair)
    const host = creds.projectId!.replace(/\/$/, '');
    return httpProbe({
      provider: 'livekit',
      url: `${host.startsWith('http') ? host : `https://${host}`}/twirp/livekit.RoomService/ListRooms`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  },
  hubspot: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'hubspot', note: miss };
    return httpProbe({
      provider: 'hubspot',
      url: 'https://api.hubapi.com/crm/v3/objects/contacts?limit=1',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  notion: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'notion', note: miss };
    return httpProbe({
      provider: 'notion',
      url: 'https://api.notion.com/v1/users/me',
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        'Notion-Version': '2022-06-28',
      },
    });
  },
  dropbox: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'dropbox', note: miss };
    return httpProbe({
      provider: 'dropbox',
      url: 'https://api.dropboxapi.com/2/users/get_current_account',
      method: 'POST',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  box: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'box', note: miss };
    return httpProbe({
      provider: 'box',
      url: 'https://api.box.com/2.0/users/me',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  contentful: async (creds) => {
    const miss = requireFields(creds, ['apiKey', 'projectId']);
    if (miss) return { ok: false, provider: 'contentful', note: miss };
    return httpProbe({
      provider: 'contentful',
      url: `https://api.contentful.com/spaces/${encodeURIComponent(creds.projectId!)}`,
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  daily: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'daily', note: miss };
    return httpProbe({
      provider: 'daily',
      url: 'https://api.daily.co/v1/',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  zoom: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'zoom', note: miss };
    return httpProbe({
      provider: 'zoom',
      url: 'https://api.zoom.us/v2/users/me',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  'whatsapp-cloud': async (creds) => {
    const miss = requireFields(creds, ['apiKey', 'projectId']);
    if (miss) return { ok: false, provider: 'whatsapp-cloud', note: miss };
    return httpProbe({
      provider: 'whatsapp-cloud',
      url: `https://graph.facebook.com/v19.0/${encodeURIComponent(creds.projectId!)}`,
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  'africas-talking': async (creds) => {
    // accountSid holds AT username in the installer form.
    const miss = requireFields(creds, ['apiKey', 'accountSid']);
    if (miss) return { ok: false, provider: 'africas-talking', note: miss };
    const username = encodeURIComponent(creds.accountSid!);
    return httpProbe({
      provider: 'africas-talking',
      url: `https://api.africastalking.com/version1/user?username=${username}`,
      headers: {
        apiKey: creds.apiKey!,
        Accept: 'application/json',
      },
    });
  },
  paystack: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'paystack', note: miss };
    return httpProbe({
      provider: 'paystack',
      url: 'https://api.paystack.co/balance',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  flutterwave: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'flutterwave', note: miss };
    return httpProbe({
      provider: 'flutterwave',
      url: 'https://api.flutterwave.com/v3/balances',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  slack: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) {
      return {
        ok: false,
        provider: 'slack',
        note: 'Bot token (apiKey) is required for realtime Slack auth. Team ID alone is not enough.',
      };
    }
    return httpProbe({
      provider: 'slack',
      url: 'https://slack.com/api/auth.test',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  runway: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'runway', note: miss };
    return httpProbe({
      provider: 'runway',
      url: 'https://api.dev.runwayml.com/v1/tasks',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  luma: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'luma', note: miss };
    return httpProbe({
      provider: 'luma',
      url: 'https://api.lumalabs.ai/dream-machine/v1/generations',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  genesys: async (creds) => {
    const miss = requireFields(creds, ['apiKey', 'projectId']);
    if (miss) return { ok: false, provider: 'genesys', note: miss };
    const region = creds.projectId!.replace(/\/$/, '');
    return httpProbe({
      provider: 'genesys',
      url: `${region.startsWith('http') ? region : `https://api.${region}`}/api/v2/users/me`,
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  },
  phrase: async (creds) => {
    const miss = requireFields(creds, ['apiKey']);
    if (miss) return { ok: false, provider: 'phrase', note: miss };
    return httpProbe({
      provider: 'phrase',
      url: 'https://cloud.memsource.com/web/api2/v1/authenticatedUser',
      headers: { Authorization: `ApiToken ${creds.apiKey}` },
    });
  },
};

/** Generic bearer probe when connector has apiKey but no named probe. */
async function genericBearerProbe(
  connectorId: string,
  creds: ConnectorCredentials,
): Promise<AuthProbeResult> {
  const miss = requireFields(creds, ['apiKey']);
  if (miss) return { ok: false, provider: connectorId, note: miss };
  // Prefer webhook URL as the authenticated resource probe when provided.
  if (creds.webhookUrl?.trim()) {
    try {
      const url = new URL(creds.webhookUrl.trim());
      if (!/^https?:$/i.test(url.protocol)) {
        return { ok: false, provider: connectorId, note: 'webhookUrl must be http(s)' };
      }
    } catch {
      return { ok: false, provider: connectorId, note: 'webhookUrl is not a valid URL' };
    }
    return httpProbe({
      provider: connectorId,
      url: creds.webhookUrl.trim(),
      method: 'GET',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    });
  }
  return {
    ok: false,
    provider: connectorId,
    note: `No realtime auth probe is registered for ${connectorId}. Provide a vendor API key that we can verify against a live endpoint, or use a connector with a known auth probe (Twilio, Slack, HubSpot, …).`,
  };
}

export async function verifyConnectorCredentials(
  connectorId: string,
  creds: ConnectorCredentials,
): Promise<AuthProbeResult> {
  // Test-only fixture: still requires non-empty credentials, never soft-connects empty.
  if (process.env.CONNECTOR_AUTH_FIXTURE === '1' && process.env.NODE_ENV === 'test') {
    const hasSecret = Boolean(creds.apiKey?.trim() || creds.accountSid?.trim());
    return hasSecret
      ? {
          ok: true,
          provider: connectorId,
          note: 'Fixture auth accepted (CONNECTOR_AUTH_FIXTURE).',
        }
      : { ok: false, provider: connectorId, note: 'Fixture auth requires credentials.' };
  }

  const probe = PROBES[connectorId];
  if (probe) return probe(creds);
  return genericBearerProbe(connectorId, creds);
}

export function hasRealtimeAuthProbe(connectorId: string): boolean {
  return Boolean(PROBES[connectorId]);
}
