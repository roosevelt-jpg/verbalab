import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Public marketing TTS demo.
 * Uses OpenAI TTS when OPENAI_API_KEY is set; otherwise returns { mode: "browser" }
 * so the client falls back to Web Speech API.
 */
export async function POST(request: Request) {
  let body: { text?: string; openaiVoice?: string; voiceId?: string; lang?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 500) : '';
  if (!text) {
    return NextResponse.json({ error: { message: 'text required' } }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ mode: 'browser', voiceId: body.voiceId ?? null });
  }

  const voice = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(body.openaiVoice ?? '')
    ? body.openaiVoice!
    : 'alloy';

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      response_format: 'mp3',
    }),
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { mode: 'browser', error: { message: `Upstream TTS ${upstream.status}` } },
      { status: 200 },
    );
  }

  const audio = await upstream.arrayBuffer();
  return new NextResponse(audio, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
      'X-Lugemi-Demo-Voice': voice,
    },
  });
}
