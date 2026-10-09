import { afterEach, describe, expect, it, vi } from 'vitest';
import { GatewayService } from './gateway.service';
import { baseTtsLanguage, findNativeVoice, voiceSpeaksNatively } from './native-voice';
import {
  createOwnTtsAdapter,
  HttpOwnTtsAdapter,
  OWN_TTS_VOICES,
  UnconfiguredOwnTtsAdapter,
} from './own-tts.adapter';

describe('native voice rule', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('normalizes Twi codes and dialects to ak', () => {
    for (const code of ['tw', 'twi', 'ak-GH', 'ak-gh-asante', 'AK']) {
      expect(baseTtsLanguage(code)).toBe('ak');
    }
    expect(baseTtsLanguage('en-NG')).toBe('en');
  });

  it('finds the native Twi voice', () => {
    expect(findNativeVoice(OWN_TTS_VOICES, 'tw')?.id).toBe('own:ak-gh-female');
    expect(findNativeVoice(OWN_TTS_VOICES, 'xx')).toBeUndefined();
  });

  it('never uses placeholder audio in production without a native model', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('OWN_TTS_URL', '');
    vi.stubEnv('OWN_TTS_FIXTURE', '');
    expect(createOwnTtsAdapter()).toBeInstanceOf(UnconfiguredOwnTtsAdapter);
  });

  it('refuses Twi with a stock (non-native) voice', async () => {
    const gateway = new GatewayService();
    await expect(
      gateway.synthesize({ text: 'Akwaaba', voice: 'alloy', language: 'ak-GH' }),
    ).rejects.toMatchObject({ code: 'native_voice_unavailable' });
  });

  it("refuses a native voice speaking another language", async () => {
    const gateway = new GatewayService();
    await expect(
      gateway.synthesize({ text: 'Akwaaba', voice: 'own:sw-ke-female', language: 'tw' }),
    ).rejects.toMatchObject({ code: 'native_voice_unavailable' });
  });

  it('routes a language-only request to the native voice', async () => {
    const gateway = new GatewayService();
    const out = await gateway.synthesize({ text: 'Akwaaba', voice: '', language: 'twi' });
    expect(out.voice).toBe('own:ak-gh-female');
  });
});

describe('native English accents', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('has a male and a female voice for each native English country', () => {
    for (const region of ['US', 'GB', 'CA', 'AU', 'NZ']) {
      const genders = OWN_TTS_VOICES.filter((v) => v.locale === `en-${region}`).map((v) => v.gender);
      expect(genders.sort()).toEqual(['female', 'male']);
    }
  });

  it('matches the requested country and defaults plain English to US', () => {
    expect(findNativeVoice(OWN_TTS_VOICES, 'en')?.locale).toBe('en-US');
    expect(findNativeVoice(OWN_TTS_VOICES, 'en-AU')?.locale).toBe('en-AU');
    expect(findNativeVoice(OWN_TTS_VOICES, 'en_NZ')?.locale).toBe('en-NZ');
    expect(findNativeVoice(OWN_TTS_VOICES, 'en-GH')?.id).toBe('own:en-kofi');
    expect(findNativeVoice(OWN_TTS_VOICES, 'en-IN')).toBeUndefined();
  });

  it('prefers a live voice over one still in training', () => {
    const voices = OWN_TTS_VOICES.map((v) => ({
      ...v,
      status: v.id === 'own:en-au-male' ? ('live' as const) : ('training' as const),
    }));
    expect(findNativeVoice(voices, 'en-AU')?.id).toBe('own:en-au-male');
  });

  it('refuses a US voice for Australian English and a Kenyan voice for US English', () => {
    const us = OWN_TTS_VOICES.find((v) => v.id === 'own:en-us-female')!;
    const aisha = OWN_TTS_VOICES.find((v) => v.id === 'own:sw-aisha')!;
    expect(voiceSpeaksNatively(us, 'en-AU')).toBe(false);
    expect(voiceSpeaksNatively(us, 'en')).toBe(true);
    expect(voiceSpeaksNatively(aisha, 'en-US')).toBe(false);
    expect(voiceSpeaksNatively(aisha, 'en')).toBe(true);
  });

  it('names the accent in the refusal', async () => {
    const gateway = new GatewayService();
    await expect(
      gateway.synthesize({ text: "G'day", voice: 'own:en-us-female', language: 'en-AU' }),
    ).rejects.toMatchObject({ code: 'native_voice_unavailable', message: expect.stringContaining('English (Australia)') });
  });

  it('marks engine voices live and refuses voices still in training', async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      if (String(url).endsWith('/voices')) {
        return new Response(JSON.stringify({ voices: [{ id: 'en-us-female' }, { id: 'en-gb-male' }] }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(Buffer.from('ID3audio'), { headers: { 'content-type': 'audio/mpeg' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new HttpOwnTtsAdapter('http://lugemi-tts.internal:8080', 'k');
    await adapter.refreshLive();

    const status = Object.fromEntries(adapter.listVoices().map((v) => [v.id, v.status]));
    expect(status['own:en-us-female']).toBe('live');
    expect(status['own:en-gb-male']).toBe('live');
    expect(status['own:en-au-female']).toBe('training');
    expect(status['own:ak-gh-female']).toBe('training');

    const out = await adapter.synthesize({ text: 'Hello', voice: 'own:en-us-female', language: 'en-US' });
    expect(out.mimeType).toBe('audio/mpeg');
    const [, init] = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ voice: 'en-us-female', language: 'en-US' });
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer k');

    await expect(
      adapter.synthesize({ text: 'Akwaaba', voice: 'own:ak-gh-female', language: 'ak-GH' }),
    ).rejects.toMatchObject({ code: 'native_voice_unavailable' });
  });
});
