import { NextResponse } from 'next/server';
import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

type Msg = { role: 'user' | 'assistant'; content: string };

type FaqItem = {
  keys: string[];
  answer: string;
  /** Soft escalate suggestion after self-serve answer */
  escalate?: boolean;
  /** Force escalate — complex / account / security */
  forceEscalate?: boolean;
};

/**
 * Self-serve FAQ — resolve common API, billing, and platform questions without a human.
 * Complex / account / security / refund paths escalate.
 */
const FAQ: FaqItem[] = [
  {
    keys: ['api key', 'lg_live', 'lg_test', 'authenticate', 'authorization', 'bearer', '401', 'unauthorized'],
    answer:
      'Create keys under Console → API keys. Send Authorization: Bearer lg_live_… (production) or lg_test_… (sandbox). 401 usually means a missing/expired key or wrong workspace header (X-Lugemi-Workspace-Id). Docs: /docs and /developers.',
  },
  {
    keys: ['rate limit', '429', 'too many', 'throttle'],
    answer:
      'Per-key and per-org rate limits scale with your plan (Free is lowest; Business/Enterprise highest). 429 means slow down or upgrade under /billing. Retry with exponential backoff; check response headers when present.',
  },
  {
    keys: ['quota', 'character', '402', 'exceeded', 'usage'],
    answer:
      'Monthly character quota lives on /billing. Free starts at 50k; paid plans raise the cap. Translate/speech return 402 quota_exceeded when you hit it — upgrade, or wait for the period reset. Usage charts: /usage and /dashboard.',
  },
  {
    keys: ['billing', 'invoice', 'upgrade', 'plan', 'price', 'checkout', 'payment', 'stripe', 'portal', 'card'],
    answer:
      'Plans: Free → Pro → Business → Enterprise. Open /billing to upgrade (Checkout) or manage payment methods (Customer Portal). Features unlock with the plan and apply to every workspace under your org. Enterprise is custom — escalate for sales.',
  },
  {
    keys: ['refund', 'chargeback', 'double charge', 'cancel subscription', 'dispute'],
    answer:
      'I can explain plans and how to open the billing portal, but refunds, chargebacks, and mid-cycle cancellations need a human with access to your Stripe customer record.',
    forceEscalate: true,
  },
  {
    keys: ['workspace', 'seat', 'create workspace', 'plan_required', 'extra workspace'],
    answer:
      'Workspace limits: Free–Pro = 1, Business = 3, Enterprise = unlimited. Creating beyond the limit returns plan_required — upgrade under /billing. Switch workspaces from the console header; each workspace inherits your org’s subscribed features.',
  },
  {
    keys: ['voice', 'tts', 'speech', 'own:', 'audio/speech', 'clone'],
    answer:
      'Speech: POST /v1/audio/speech or @lugemi/sdk. Prefer own:* voices when configured. Voice clones need Pro+ plus consent/ownership attestation under /voice-cloning. Neural TTS: /neural-tts.',
  },
  {
    keys: ['translate', 'language', 'twi', 'akan', 'swahili', 'yoruba', 'locale'],
    answer:
      'POST /v1/translate with source/target language codes (default panel pair is English → Twi / ak-GH). Locale packs: /locales. Coverage: /coverage. Formats (HTML/Markdown/SRT/CSV): /translate/formats.',
  },
  {
    keys: ['sdk', 'npm', 'typescript', 'cli', 'android', 'ios', 'kotlin', 'swift', 'mcp'],
    answer:
      'TypeScript: @lugemi/sdk + lugemi CLI. MCP: @lugemi/mcp for video/agent voice tools. Android (Kotlin) and iOS (Swift) clients live under packages/sdk-android and packages/sdk-ios. Start at /developers.',
  },
  {
    keys: ['webhook', 'callback', 'document', 'job', 'batch'],
    answer:
      'Document translate: POST /v1/documents/translate (returns a job). Poll GET /v1/jobs/:id. Optional webhookUrl on create. Ensure your endpoint returns 2xx quickly.',
  },
  {
    keys: ['cors', 'browser', 'frontend', 'next.js', 'origin'],
    answer:
      'Call Lugemi from your backend with the API key — never ship lg_live_ keys in a public browser bundle. For console UIs, use Clerk session auth against the API. See /playground for authenticated tries.',
  },
  {
    keys: ['region', 'residency', 'data region', 'gdpr', 'africa'],
    answer:
      'Data residency pins are under /data. Match your client to the regional API when a pin is set. Africa-first language coverage is the product priority; see /coverage and /african-language-registry.',
  },
  {
    keys: ['sso', 'saml', 'enterprise', 'scim'],
    answer:
      'SSO / dedicated capacity is Enterprise. Open /enterprise for the plan page, /enterprise/console for org controls, or escalate so sales can scope a contract.',
    escalate: true,
  },
  {
    keys: ['health', 'status', 'latency'],
    answer:
      'API health: GET /health (includes region). If health is ok but your calls fail, verify the key, quota, and X-Lugemi-Workspace-Id before escalating.',
  },
  {
    keys: ['error', '500', 'down', 'outage', 'broken', 'timeout'],
    answer:
      'First: hit /health, confirm the API key and quota on /billing, and retry once. If it still fails, escalate with your org id, request time (UTC), and any request/error id from the response.',
    escalate: true,
  },
  {
    keys: ['security', 'breach', 'leak', 'compromised', 'hacked', 'phishing'],
    answer:
      'If a key may be leaked: revoke it under /keys immediately, then escalate so a human can review audit logs and rotate anything else needed.',
    forceEscalate: true,
  },
  {
    keys: ['human', 'agent', 'support', 'escalate', 'person', 'talk to', 'speak to', 'real person'],
    answer:
      'I can queue a human escalation. Share a short summary, your org or email, and whether this is billing, API, or account security — someone from Lugemi Support will follow up.',
    forceEscalate: true,
  },
];

const COMPLEX =
  /refund|chargeback|lawsuit|legal hold|breach|compromised|hacked|phishing|delete (my )?account|gdpr erasure|data deletion request|speak to (a )?human|talk to (a )?(person|agent|human)|escalate/i;

function matchFaq(text: string): FaqItem | null {
  const lower = text.toLowerCase();
  let best: FaqItem | null = null;
  let score = 0;
  for (const item of FAQ) {
    const hits = item.keys.filter((k) => lower.includes(k)).length;
    if (hits > score) {
      score = hits;
      best = item;
    }
  }
  return score > 0 ? best : null;
}

function wantsHuman(text: string) {
  return COMPLEX.test(text) || /human|person|agent|escalate|speak to|talk to/i.test(text);
}

async function persistTicket(ticket: Record<string, unknown>) {
  const dir = join(process.cwd(), '.data', 'support');
  await mkdir(dir, { recursive: true });
  await appendFile(join(dir, 'escalations.jsonl'), `${JSON.stringify(ticket)}\n`, 'utf8');
}

export async function POST(request: Request) {
  let body: {
    message?: string;
    history?: Msg[];
    email?: string;
    orgId?: string;
    escalateOnly?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: { message: 'message required' } }, { status: 400 });
  }

  // Explicit escalation ticket (from UI after user confirms)
  if (body.escalateOnly) {
    const ticketId = `sup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await persistTicket({
      id: ticketId,
      createdAt: new Date().toISOString(),
      email: body.email ?? null,
      orgId: body.orgId ?? null,
      message,
      history: (body.history ?? []).slice(-12),
      source: 'support_chat',
    }).catch(() => undefined);
    return NextResponse.json({
      reply: `Human escalation ticket ${ticketId} is queued. A Lugemi teammate will follow up${
        body.email ? ` at ${body.email}` : ''
      }. Keep using the bot for API keys, quotas, plans, speech, and translate while you wait.`,
      escalate: true,
      ticketId,
      ticketHint: 'Ticket filed for human support.',
    });
  }

  const hit = matchFaq(message);
  if (hit) {
    const escalate = Boolean(hit.forceEscalate || hit.escalate || wantsHuman(message));
    return NextResponse.json({
      reply: hit.answer,
      escalate,
      canSelfServe: !hit.forceEscalate,
      ticketHint: escalate
        ? hit.forceEscalate
          ? 'This needs a human. Use “Escalate to human” below and leave an email if you want a reply.'
          : 'Still stuck? Escalate to a human with your org id and approximate time (UTC).'
        : null,
      suggestions: [
        'How do I create an API key?',
        'Explain billing plans',
        'What is my character quota?',
        'Escalate to human',
      ],
    });
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    try {
      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.25,
          messages: [
            {
              role: 'system',
              content:
                'You are Lugemi Support — a self-serve assistant for the Lugemi API and console. Help with API keys (lg_live_/lg_test_), billing plans (Free/Pro/Business/Enterprise), quotas, workspaces, speech (own:*), translate, SDKs, MCP, and health checks. Prefer concrete console paths (/billing, /keys, /docs). Never invent competitors. If the user needs refunds, account deletion, security incidents, or contract/Enterprise sales, tell them to escalate to a human and end with the word ESCALATE. Keep answers under 130 words.',
            },
            ...(body.history ?? []).slice(-8),
            { role: 'user', content: message },
          ],
        }),
      });
      if (upstream.ok) {
        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        let reply = data.choices?.[0]?.message?.content?.trim() ?? '';
        const escalate = /ESCALATE|escalat|human support|support ticket/i.test(reply) || wantsHuman(message);
        reply = reply.replace(/\bESCALATE\b/g, '').trim();
        if (reply) {
          return NextResponse.json({
            reply,
            escalate,
            canSelfServe: !escalate,
            ticketHint: escalate
              ? 'Marked for human follow-up — use Escalate to human to file a ticket.'
              : null,
          });
        }
      }
    } catch {
      // fall through
    }
  }

  if (wantsHuman(message)) {
    return NextResponse.json({
      reply:
        'This sounds like it needs a human. Use “Escalate to human”, leave a short summary and optional email, and Lugemi Support will follow up. Meanwhile I can still answer API keys, quotas, plans, speech, and translate.',
      escalate: true,
      canSelfServe: false,
      ticketHint: 'Ready to file a human escalation ticket.',
    });
  }

  return NextResponse.json({
    reply:
      'I handle Lugemi platform questions without a human for most cases — API keys, rate limits, quotas, billing plans, workspaces, speech, translate, SDKs, and health. Ask one of those, or say “escalate to human” for refunds, security, or complex account issues.',
    escalate: false,
    canSelfServe: true,
    ticketHint: null,
    suggestions: [
      'How do I create an API key?',
      'Explain billing plans',
      'Character quota exceeded',
      'Escalate to human',
    ],
  });
}
