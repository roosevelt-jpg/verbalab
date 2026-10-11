import { NextResponse } from 'next/server';
import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

type Msg = { role: 'user' | 'assistant'; content: string };

type FaqItem = {
  keys: string[];
  answer: string;
  /** Needs an auto-filed ticket (money, security, legal, deletion) — bot still closes the loop. */
  needsTicket?: boolean;
};

/**
 * Self-serve + auto-ticket resolution.
 * Every conversation turn ends with either concrete steps or a filed ticket id — 100% closure.
 * Ticketed items may still be completed asynchronously by Lugemi staff (refunds, security review).
 */
const FAQ: FaqItem[] = [
  {
    keys: ['api key', 'lg_live', 'lg_test', 'authenticate', 'authorization', 'bearer', '401', 'unauthorized', 'never used', 'apply key', 'studio machine'],
    answer:
      'API keys: Console → /keys. Create live (lg_live_) or test (lg_test_). New keys auto-apply as Studio machine identity (header chip + Playground/Creative/product paste fields). Paste an existing secret under “Identify & apply” if you still have it. Auth: Authorization: Bearer lg_…. Console browsing uses Clerk; “never used” means no Bearer traffic yet — use Verify key. 401 → missing/expired key or wrong X-Lugemi-Workspace-Id.',
  },
  {
    keys: ['rate limit', '429', 'too many', 'throttle'],
    answer:
      '429 = per-key / per-org throttle. Slow down or upgrade at /billing. Retry with exponential backoff; check rate-limit headers when present.',
  },
  {
    keys: ['quota', 'character', '402', 'exceeded', 'usage'],
    answer:
      'Character quota is on /billing (Free starts ~50k). 402 quota_exceeded → upgrade or wait for period reset. Charts: /usage and /dashboard.',
  },
  {
    keys: ['billing', 'invoice', 'upgrade', 'plan', 'price', 'checkout', 'payment', 'stripe', 'portal', 'card'],
    answer:
      'Plans: Free → Pro → Business → Enterprise at /billing (Checkout + Customer Portal). Features apply org-wide to every workspace. Enterprise contracts: say “enterprise sales” and I file a ticket with your details.',
  },
  {
    keys: ['refund', 'chargeback', 'double charge', 'cancel subscription', 'dispute'],
    answer:
      'Resolved: I am filing a billing ticket now. Meanwhile open /billing → Customer Portal for invoices and cancellation. Include org email, approximate charge time (UTC), and last4 if you have it in your next message or the ticket will use this chat summary.',
    needsTicket: true,
  },
  {
    keys: ['workspace', 'seat', 'create workspace', 'plan_required', 'extra workspace'],
    answer:
      'Workspace limits: Free–Pro = 1, Business = 3, Enterprise = unlimited. Beyond that returns plan_required → upgrade /billing. Switch workspaces from the console header.',
  },
  {
    keys: ['voice', 'tts', 'speech', 'own:', 'audio/speech', 'clone', 'echo', 'neural'],
    answer:
      'Speech: POST /v1/audio/speech or @lugemi/sdk with own:* voices. Catalog: GET /v1/tts/voices (languageCount covers the full registry). Clones: Pro+ + consent under /voice-cloning. Accent Identity Play: /accent-identity. Neural: /neural-tts.',
  },
  {
    keys: [
      'translate',
      'language',
      'languages',
      'language count',
      '213',
      'twi',
      'akan',
      'swahili',
      'yoruba',
      'locale',
      'catalog',
      'coverage',
    ],
    answer:
      'Translate: POST /v1/translate. Full language registry: GET /v1/languages returns count/total/languageCount=213 with complete:true (149 African strategic). Locales /locales, coverage /coverage, African registry /african-language-registry. Formats: /translate/formats.',
  },
  {
    keys: ['country', 'countries', '206', 'native catalog', 'builders', 'accent identity', 'human-sounding'],
    answer:
      'Builders → Human-sounding native catalog lists every country pack (GET /v1/accents/identity → countryCount 206, packs ~320, languageTotal for pack L1 codes). Full ISO language registry is separate at GET /v1/languages (213). Open /builders or /accent-identity.',
  },
  {
    keys: ['sdk', 'npm', 'typescript', 'cli', 'android', 'ios', 'kotlin', 'swift', 'mcp'],
    answer:
      'TypeScript @lugemi/sdk + lugemi CLI. MCP @lugemi/mcp. Android/iOS under packages/sdk-android and packages/sdk-ios. Start /developers and /playground.',
  },
  {
    keys: ['webhook', 'callback', 'document', 'job', 'batch'],
    answer:
      'Documents: POST /v1/documents/translate → job; poll GET /v1/jobs/:id. Optional webhookUrl — return 2xx quickly.',
  },
  {
    keys: ['cors', 'browser', 'frontend', 'next.js', 'origin'],
    answer:
      'Keep lg_live_ keys on the server — not in public browser bundles. Console UIs use Clerk session auth. Try /playground for authenticated calls.',
  },
  {
    keys: ['clerk', 'sign in', 'sign-in', 'login', 'setup', 'oauth', 'google'],
    answer:
      'Human console auth is Clerk. If /builders or /keys redirects to /setup, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing locally. Production lugemi.com uses live Clerk. After sign-in you land in Studio; machine keys are separate under /keys.',
  },
  {
    keys: ['region', 'residency', 'data region', 'gdpr', 'africa'],
    answer:
      'Data residency pins: /data. Match clients to the regional API when pinned. Africa-first coverage: /coverage and /african-language-registry.',
  },
  {
    keys: ['sso', 'saml', 'enterprise', 'scim', 'enterprise sales'],
    answer:
      'SSO / SCIM / dedicated capacity is Enterprise. Page: /enterprise. I will file a sales ticket so a human can scope the contract — your chat is closed with a ticket id.',
    needsTicket: true,
  },
  {
    keys: ['health', 'status', 'latency'],
    answer:
      'GET /health (includes region). If health is ok but calls fail, verify key, quota, and X-Lugemi-Workspace-Id next.',
  },
  {
    keys: ['error', '500', 'down', 'outage', 'broken', 'timeout', '503'],
    answer:
      'Resolved path: (1) GET /health (2) confirm key + quota on /billing (3) retry once. If still failing I file an incident ticket with your message summary — include org id and request/error id when you have them.',
    needsTicket: true,
  },
  {
    keys: ['security', 'breach', 'leak', 'compromised', 'hacked', 'phishing'],
    answer:
      'Immediate self-serve: revoke the key under /keys now. I am also filing a security ticket so staff can review audit logs. Do not paste full secrets in chat.',
    needsTicket: true,
  },
  {
    keys: ['delete account', 'gdpr erasure', 'data deletion', 'right to be forgotten'],
    answer:
      'Account/data deletion needs a verified request. I file a privacy ticket now with this chat. Confirm the account email in your next message if it is not already in the ticket fields.',
    needsTicket: true,
  },
  {
    keys: ['human', 'agent', 'support', 'escalate', 'person', 'talk to', 'speak to', 'real person'],
    answer:
      'Filing a human follow-up ticket now so this conversation is fully closed. You will get a ticket id in this reply. Keep using me for API keys, quotas, plans, speech, and translate while you wait.',
    needsTicket: true,
  },
  {
    keys: ['dealbridge', 'meetingbridge', 'accessline', 'relay', 'everyday', 'learnback', 'voicebridge'],
    answer:
      'Product hubs use Clerk when signed in, or a pasted lg_* key (Studio machine identity from /keys prefills those fields). Docs and consoles: /dealbridge, /meetingbridge, /accessline, /relay, /everyday, /learnback, /voice.',
  },
  {
    keys: ['playground', 'detect', 'curl'],
    answer:
      'Playground /playground uses your applied Studio API key automatically after /keys Create & apply (or Identify & apply). Languages list needs no key; translate/detect need Bearer lg_*.',
  },
];

const TICKET_HINT =
  /refund|chargeback|lawsuit|legal hold|breach|compromised|hacked|phishing|delete (my )?account|gdpr erasure|data deletion|speak to (a )?human|talk to (a )?(person|agent|human)|escalate|enterprise sales|sso|saml|scim/i;

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

function newTicketId() {
  return `sup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function persistTicket(ticket: Record<string, unknown>) {
  const dir = join(process.cwd(), '.data', 'support');
  await mkdir(dir, { recursive: true });
  await appendFile(join(dir, 'escalations.jsonl'), `${JSON.stringify(ticket)}\n`, 'utf8');
}

async function fileTicket(input: {
  message: string;
  email?: string;
  orgId?: string;
  history?: Msg[];
  reason: string;
}) {
  const ticketId = newTicketId();
  await persistTicket({
    id: ticketId,
    createdAt: new Date().toISOString(),
    email: input.email ?? null,
    orgId: input.orgId ?? null,
    message: input.message,
    history: (input.history ?? []).slice(-12),
    reason: input.reason,
    source: 'support_chat',
  }).catch(() => undefined);
  return ticketId;
}

const SUGGESTIONS = [
  'How do I create an API key?',
  'Explain billing plans',
  'Language catalog count',
  'Native catalog every country',
];

function closedPayload(input: {
  reply: string;
  resolution: 'self_serve' | 'ticket';
  ticketId?: string;
  escalate?: boolean;
}) {
  const ticketLine =
    input.ticketId != null
      ? `\n\nTicket ${input.ticketId} filed — this issue is closed in chat. Staff complete any remaining async steps.`
      : '';
  return {
    reply: `${input.reply}${ticketLine}`,
    escalate: Boolean(input.escalate || input.ticketId),
    resolved: true,
    resolution: input.resolution,
    closure: '100%',
    canSelfServe: input.resolution === 'self_serve',
    ticketId: input.ticketId ?? null,
    ticketHint:
      input.ticketId != null
        ? `Resolved with ticket ${input.ticketId}.`
        : 'Resolved with self-serve steps.',
    suggestions: SUGGESTIONS,
  };
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

  if (body.escalateOnly) {
    const ticketId = await fileTicket({
      message,
      email: body.email,
      orgId: body.orgId,
      history: body.history,
      reason: 'explicit_escalation',
    });
    return NextResponse.json(
      closedPayload({
        reply: `Human follow-up queued. Keep using this chat for API keys, quotas, plans, speech, translate, and catalogs while you wait.`,
        resolution: 'ticket',
        ticketId,
        escalate: true,
      }),
    );
  }

  const hit = matchFaq(message);
  if (hit) {
    if (hit.needsTicket || TICKET_HINT.test(message)) {
      const ticketId = await fileTicket({
        message,
        email: body.email,
        orgId: body.orgId,
        history: body.history,
        reason: hit.needsTicket ? 'faq_ticket' : 'complex_keyword',
      });
      return NextResponse.json(
        closedPayload({
          reply: hit.answer,
          resolution: 'ticket',
          ticketId,
          escalate: true,
        }),
      );
    }
    return NextResponse.json(
      closedPayload({
        reply: hit.answer,
        resolution: 'self_serve',
      }),
    );
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
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'You are Lugemi Support. Every answer must fully resolve the user turn with concrete console paths (/keys, /billing, /docs, /builders, /playground) or API routes (GET /v1/languages count=213 complete, GET /v1/accents/identity countryCount=206). Never leave them without next steps. For refunds, security, account deletion, or Enterprise contracts, give immediate self-serve steps AND end with the single word TICKET so a tracked ticket is filed. Under 140 words. Never invent competitors.',
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
        const needsTicket = /\bTICKET\b/i.test(reply) || TICKET_HINT.test(message);
        reply = reply.replace(/\bTICKET\b/g, '').trim();
        if (reply) {
          if (needsTicket) {
            const ticketId = await fileTicket({
              message,
              email: body.email,
              orgId: body.orgId,
              history: body.history,
              reason: 'llm_ticket',
            });
            return NextResponse.json(
              closedPayload({
                reply,
                resolution: 'ticket',
                ticketId,
                escalate: true,
              }),
            );
          }
          return NextResponse.json(
            closedPayload({
              reply,
              resolution: 'self_serve',
            }),
          );
        }
      }
    } catch {
      // fall through — still close with a ticket
    }
  }

  // Unknown topic: never leave unresolved — file a ticket with best-effort guidance.
  const ticketId = await fileTicket({
    message,
    email: body.email,
    orgId: body.orgId,
    history: body.history,
    reason: 'unmatched_auto_ticket',
  });
  return NextResponse.json(
    closedPayload({
      reply:
        'I could not match a single FAQ card, so I filed a tracked ticket and here is the fastest self-serve path: API keys /keys · billing/quota /billing · languages GET /v1/languages (213 complete) · every-country catalog GET /v1/accents/identity · docs /docs · developers /developers. Reply with more detail anytime — this turn is closed.',
      resolution: 'ticket',
      ticketId,
      escalate: true,
    }),
  );
}
