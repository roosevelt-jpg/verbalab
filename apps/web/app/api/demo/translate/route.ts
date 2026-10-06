import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Curated Africa-first demo pairs for realtime translate+play without auth. */
const DEMO_PAIRS: Array<{
  id: string;
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
  text: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  sourceVoice: string;
  targetVoice: string;
}> = [
  {
    id: 'en-sw',
    source: 'en',
    target: 'sw',
    sourceLabel: 'English',
    targetLabel: 'Kiswahili',
    text: 'Welcome to Lugemi. How can I help with shipping rates today?',
    translated: 'Karibu Lugemi. Ninawezaje kukusaidia na bei za usafirishaji leo?',
    sourceLang: 'en-US',
    targetLang: 'sw',
    sourceVoice: 'abe',
    targetVoice: 'amara',
  },
  {
    id: 'en-yo',
    source: 'en',
    target: 'yo',
    sourceLabel: 'English',
    targetLabel: 'Yorùbá',
    text: 'Good morning. Let us work on maths and science together.',
    translated: 'Ẹ káàárọ̀. Jẹ́ ká ṣiṣẹ́ lórí ìṣirò àti sáyẹ́ǹsì papọ̀.',
    sourceLang: 'en-NG',
    targetLang: 'yo',
    sourceVoice: 'abe',
    targetVoice: 'yo-ng-male',
  },
  {
    id: 'en-am',
    source: 'en',
    target: 'am',
    sourceLabel: 'English',
    targetLabel: 'Amharic',
    text: 'Hello. You can ask about service hours, documents, and language support.',
    translated: 'ሰላም። ስለ አገልግሎት ሰዓታት፣ ሰነዶች እና ቋንቋ ድጋፍ መጠየቅ ይችላሉ።',
    sourceLang: 'en-US',
    targetLang: 'am',
    sourceVoice: 'kwame',
    targetVoice: 'am-et-female',
  },
  {
    id: 'en-zu',
    source: 'en',
    target: 'zu',
    sourceLabel: 'English',
    targetLabel: 'isiZulu',
    text: 'Your order is ready for pickup this afternoon.',
    translated: 'I-oda yakho isilungile ukuthi ithathwe ntambama.',
    sourceLang: 'en-ZA',
    targetLang: 'zu',
    sourceVoice: 'thandi',
    targetVoice: 'zu-za-female',
  },
  {
    id: 'en-fr',
    source: 'en',
    target: 'fr',
    sourceLabel: 'English',
    targetLabel: 'French',
    text: 'Thank you for calling. A Lugemi agent will reply in your language.',
    translated: 'Merci d’avoir appelé. Un agent Lugemi vous répondra dans votre langue.',
    sourceLang: 'en-US',
    targetLang: 'fr-FR',
    sourceVoice: 'abe',
    targetVoice: 'fr-sn-female',
  },
  {
    id: 'en-ha',
    source: 'en',
    target: 'ha',
    sourceLabel: 'English',
    targetLabel: 'Hausa',
    text: 'Hello. I can help with product support. English or Hausa?',
    translated: 'Sannu. Ina iya taimaka da tallafi na samfurin. English ko Hausa?',
    sourceLang: 'en-NG',
    targetLang: 'ha',
    sourceVoice: 'abe',
    targetVoice: 'abe',
  },
  {
    id: 'en-ak',
    source: 'en',
    target: 'ak',
    sourceLabel: 'English',
    targetLabel: 'Akan (Twi)',
    text: 'Good morning. Welcome to Lugemi Chat Studio.',
    translated: 'Maakye. Akwaaba ba Lugemi Chat Studio.',
    sourceLang: 'en-GH',
    targetLang: 'ak',
    sourceVoice: 'kwame',
    targetVoice: 'kwame',
  },
];

/** Soft-sandbox phrasebook when live providers are unset — keeps Chat Studio realtime useful. */
const PHRASEBOOK: Record<string, Record<string, string>> = {
  ak: {
    hello: 'Hɛlo',
    hi: 'Hɛlo',
    'good morning': 'Maakye',
    'good afternoon': 'Maaha',
    'good evening': 'Maadwo',
    'thank you': 'Medaase',
    thanks: 'Medaase',
    please: 'Mepa wo kyɛw',
    yes: 'Aane',
    no: 'Daabi',
    welcome: 'Akwaaba',
    friends: 'nnamfoɔ',
    'how are you': 'Wo ho te sɛn?',
  },
  sw: {
    hello: 'Habari',
    hi: 'Habari',
    'good morning': 'Habari za asubuhi',
    'thank you': 'Asante',
    thanks: 'Asante',
    please: 'Tafadhali',
    yes: 'Ndiyo',
    no: 'Hapana',
    welcome: 'Karibu',
    friends: 'marafiki',
  },
  yo: {
    hello: 'Báwo',
    hi: 'Báwo',
    'good morning': 'Ẹ káàárọ̀',
    'thank you': 'E ṣe',
    thanks: 'E ṣe',
    please: 'Jọ̀wọ́',
    yes: 'Bẹ́ẹ̀ni',
    no: 'Rárá',
    welcome: 'Káàbọ̀',
  },
};

function softSandboxTranslate(text: string, target: string): string | null {
  const book = PHRASEBOOK[target];
  if (!book) return null;
  const lower = text.toLowerCase().replace(/[.!?]+$/g, '').trim();
  if (book[lower]) return book[lower]!;

  // Replace longest phrases first inside free-form speech segments.
  const keys = Object.keys(book).sort((a, b) => b.length - a.length);
  let out = text;
  let hit = false;
  for (const key of keys) {
    const re = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (re.test(out)) {
      out = out.replace(re, book[key]!);
      hit = true;
    }
  }
  return hit ? out : null;
}

export async function GET() {
  return NextResponse.json({
    pairs: DEMO_PAIRS.map(({ translated: _t, ...meta }) => ({
      ...meta,
      // Include translation for demo client so playback works offline of OpenAI
      translated: DEMO_PAIRS.find((p) => p.id === meta.id)?.translated,
    })),
  });
}

export async function POST(request: Request) {
  let body: { text?: string; source?: string; target?: string; pairId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }

  const requestedTarget = (body.target || 'ak').trim();
  const requestedSource = (body.source || 'en').trim();
  const pair =
    (body.pairId ? DEMO_PAIRS.find((p) => p.id === body.pairId) : undefined) ??
    DEMO_PAIRS.find((p) => p.source === requestedSource && p.target === requestedTarget) ??
    DEMO_PAIRS.find((p) => p.target === requestedTarget) ??
    DEMO_PAIRS[0]!;

  const text = (typeof body.text === 'string' ? body.text.trim() : '') || pair.text;

  // Exact curated match (any pair) → instant demo translation
  const exact = DEMO_PAIRS.find((p) => p.text.toLowerCase() === text.toLowerCase());
  if (exact) {
    return NextResponse.json({
      mode: 'demo',
      source: exact.source,
      target: exact.target,
      sourceLabel: exact.sourceLabel,
      targetLabel: exact.targetLabel,
      text: exact.text,
      translated: exact.translated,
      sourceLang: exact.sourceLang,
      targetLang: exact.targetLang,
      sourceVoice: exact.sourceVoice,
      targetVoice: exact.targetVoice,
      pairId: exact.id,
    });
  }

  // Fuzzy: if user edits slightly, still use curated target when pair selected
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey && text.length > 0 && text.length < 400) {
    try {
      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: `Translate the user message from ${pair.sourceLabel} to ${pair.targetLabel}. Return only the translation, no quotes or notes.`,
            },
            { role: 'user', content: text },
          ],
        }),
      });
      if (upstream.ok) {
        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const translated = data.choices?.[0]?.message?.content?.trim();
        if (translated) {
          return NextResponse.json({
            mode: 'live',
            source: pair.source,
            target: pair.target,
            sourceLabel: pair.sourceLabel,
            targetLabel: pair.targetLabel,
            text,
            translated,
            sourceLang: pair.sourceLang,
            targetLang: pair.targetLang,
            sourceVoice: pair.sourceVoice,
            targetVoice: pair.targetVoice,
            pairId: pair.id,
          });
        }
      }
    } catch {
      // fall through to soft-sandbox / curated pair
    }
  }

  const soft = softSandboxTranslate(text, requestedTarget) ?? softSandboxTranslate(text, pair.target);
  if (soft) {
    return NextResponse.json({
      mode: 'demo',
      source: requestedSource === 'auto' ? 'en' : requestedSource,
      target: requestedTarget,
      sourceLabel: pair.sourceLabel,
      targetLabel: pair.targetLabel,
      text,
      translated: soft,
      sourceLang: pair.sourceLang,
      targetLang: pair.targetLang,
      sourceVoice: pair.sourceVoice,
      targetVoice: pair.targetVoice,
      pairId: pair.id,
      note: 'Soft-sandbox phrasebook (live translate provider unset).',
    });
  }

  return NextResponse.json({
    mode: 'demo',
    source: pair.source,
    target: pair.target,
    sourceLabel: pair.sourceLabel,
    targetLabel: pair.targetLabel,
    text,
    translated: pair.translated,
    sourceLang: pair.sourceLang,
    targetLang: pair.targetLang,
    sourceVoice: pair.sourceVoice,
    targetVoice: pair.targetVoice,
    pairId: pair.id,
    note: 'Using curated demo pair. Configure live translate for arbitrary text.',
  });
}
