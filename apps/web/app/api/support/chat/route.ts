import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Msg = { role: 'user' | 'assistant'; content: string };

const FAQ: Array<{ keys: string[]; answer: string; escalate?: boolean }> = [
  {
    keys: ['api key', 'lg_live', 'lg_test', 'authenticate', 'auth'],
    answer:
      'Create keys under Console → API keys. Use Authorization: Bearer lg_live_… for production or lg_test_… for soft sandbox. See /docs for examples.',
  },
  {
    keys: ['quota', 'character', 'limit', '402', 'exceeded'],
    answer:
      'Monthly character quota is on Billing. Free starts at 50k; Starter/Creator/Pro/Scale raise limits. When you hit the cap, translate/speech return 402 quota_exceeded — upgrade or wait for the period reset.',
  },
  {
    keys: ['billing', 'stripe', 'invoice', 'upgrade', 'plan', 'price', 'workspace'],
    answer:
      'Plans: Free → Starter → Creator → Pro → Scale → Enterprise (ElevenLabs-style). Free–Pro include 1 workspace; Scale includes 3; Enterprise is unlimited. Features unlock with your plan and apply to every workspace under the org. Open /billing to upgrade.',
  },
  {
    keys: ['seat', 'workspaces', 'extra workspace', 'create workspace'],
    answer:
      'Workspace limits follow your plan: 1 on Free–Pro, 3 on Scale, unlimited on Enterprise. Creating beyond the limit returns plan_required — upgrade under Billing. Your workspace inherits subscribed features (clones, marketplace, SSO, etc.).',
  },
  {
    keys: ['voice', 'tts', 'clone', 'speech', 'own:'],
    answer:
      'Generate speech via POST /v1/audio/speech or @lugemi/sdk. own:* voices are the production path when OWN_TTS_URL is set. Voice clones require Creator+ and consent.',
  },
  {
    keys: ['translate', 'language', 'swahili', 'yoruba'],
    answer:
      'POST /v1/translate with source/target language codes. Coverage is published at /coverage. Africa-first languages are the investment priority.',
  },
  {
    keys: ['sdk', 'npm', 'android', 'ios', 'mcp', 'cli'],
    answer:
      'TypeScript: @lugemi/sdk and lugemi CLI. MCP server: @lugemi/mcp for video/agent tools. Android (Kotlin) and iOS (Swift) SDK stubs are in packages/sdk-android and packages/sdk-ios.',
  },
  {
    keys: ['error', '500', 'down', 'outage', 'broken'],
    answer:
      'Check /health on web and API. If keys and quota look fine but calls still fail, escalate to a human with your request ID and org id.',
    escalate: true,
  },
  {
    keys: ['human', 'agent', 'support', 'escalate', 'person'],
    answer:
      'I can open a human escalation ticket with your question. Reply with a short summary of the issue and an email if you want a follow-up.',
    escalate: true,
  },
];

function matchFaq(text: string) {
  const lower = text.toLowerCase();
  let best: (typeof FAQ)[number] | null = null;
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

export async function POST(request: Request) {
  let body: { message?: string; history?: Msg[]; email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: { message: 'message required' } }, { status: 400 });
  }

  const hit = matchFaq(message);
  if (hit) {
    const escalate =
      hit.escalate ||
      /human|person|agent|escalate|speak to|talk to/i.test(message);
    return NextResponse.json({
      reply: hit.answer,
      escalate,
      ticketHint: escalate
        ? 'Escalation queued for human support. Include org id and approximate time of the issue.'
        : null,
    });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    try {
      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content:
                'You are Lugemi Support Bot. Help with API keys, billing plans (Free/Starter/Creator/Pro/Scale/Enterprise), speech, translate, and SDKs. If the issue needs account changes, refunds, or security incidents, say escalate=true in a short closing line. Keep answers under 120 words.',
            },
            ...(body.history ?? []).slice(-6),
            { role: 'user', content: message },
          ],
        }),
      });
      if (upstream.ok) {
        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) {
          const escalate = /escalat|human|support ticket/i.test(reply);
          return NextResponse.json({ reply, escalate, ticketHint: escalate ? 'Marked for human follow-up.' : null });
        }
      }
    } catch {
      // fall through
    }
  }

  return NextResponse.json({
    reply:
      'I can help with API keys, quotas, plans, speech, translate, and SDKs. Try asking about billing, lg_live_ keys, or voice clones — or say “escalate to human” for complex account issues.',
    escalate: false,
    ticketHint: null,
  });
}
