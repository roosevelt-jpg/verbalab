import { afterEach, describe, expect, it, vi } from 'vitest';
import { GatewayService } from './gateway.service';
import { baseTtsLanguage, findNativeVoice, voiceSpeaksNatively } from './native-voice';
import {
  createOwnTtsAdapter,
  FixtureOwnTtsAdapter,
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

  it('finds the native Twi voice and language-default packs', () => {
    expect(findNativeVoice(OWN_TTS_VOICES, 'tw')?.id).toBe('own:ak-gh-female');
    expect(findNativeVoice(OWN_TTS_VOICES, 'xx')).toBeUndefined();
    expect(findNativeVoice(OWN_TTS_VOICES, 'de')?.id).toBe('own:de-pack');
    expect(findNativeVoice(OWN_TTS_VOICES, 'ja')?.id).toBe('own:ja-pack');
    expect(findNativeVoice(OWN_TTS_VOICES, 'th')?.id).toBe('own:th-pack');
  });

  it('uses the demo fixture when the speech engine URL is unset', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('OWN_TTS_URL', '');
    vi.stubEnv('OWN_TTS_FIXTURE', '');
    expect(createOwnTtsAdapter()).toBeInstanceOf(FixtureOwnTtsAdapter);
  });

  it('can disable the fixture when explicitly forced off', () => {
    vi.stubEnv('OWN_TTS_URL', '');
    vi.stubEnv('OWN_TTS_FIXTURE', '0');
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
    for (const region of ['US', 'GB', 'CA', 'AU', 'NZ', 'GH', 'NG', 'KE', 'PH', 'ZA']) {
      const genders = OWN_TTS_VOICES.filter((v) => v.locale === `en-${region}`).map((v) => v.gender);
      expect(new Set(genders)).toEqual(new Set(['female', 'male']));
    }
  });

  it('matches the requested country and defaults plain English to US', () => {
    expect(findNativeVoice(OWN_TTS_VOICES, 'en')?.locale).toBe('en-US');
    expect(findNativeVoice(OWN_TTS_VOICES, 'en-AU')?.locale).toBe('en-AU');
    expect(findNativeVoice(OWN_TTS_VOICES, 'en_NZ')?.locale).toBe('en-NZ');
    expect(findNativeVoice(OWN_TTS_VOICES, 'en-GH')?.locale).toBe('en-GH');
    expect(findNativeVoice(OWN_TTS_VOICES, 'en-NG')?.locale).toBe('en-NG');
    expect(findNativeVoice(OWN_TTS_VOICES, 'en-KE')?.locale).toBe('en-KE');
    // English regions without a dedicated pack fall back to language-default US Echo.
    expect(findNativeVoice(OWN_TTS_VOICES, 'en-IN')?.locale).toBe('en-US');
  });

  it('prefers a live voice over one still marked training', () => {
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

  it('names the accent in the refusal without training copy', async () => {
    const gateway = new GatewayService();
    try {
      await gateway.synthesize({ text: "G'day", voice: 'own:en-us-female', language: 'en-AU' });
      throw new Error('expected refuse');
    } catch (error) {
      const err = error as { code?: string; message?: string };
      expect(err.code).toBe('native_voice_unavailable');
      expect(err.message).toContain('English (Australia)');
      expect(err.message).not.toContain('not available yet');
      expect(err.message).not.toContain('still being trained');
    }
  });

  it('marks every catalog voice live and falls back to demo audio when the engine lacks a weight', async () => {
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
    expect(status['own:en-au-female']).toBe('live');
    expect(status['own:ak-gh-female']).toBe('live');
    expect(status['own:en-gh-male']).toBe('live');
    expect(status['own:en-ng-female']).toBe('live');

    const out = await adapter.synthesize({ text: 'Hello', voice: 'own:en-us-female', language: 'en-US' });
    expect(out.mimeType).toBe('audio/mpeg');
    const [, init] = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ voice: 'en-us-female', language: 'en-US' });
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer k');

    const demo = await adapter.synthesize({ text: 'Akwaaba', voice: 'own:ak-gh-female', language: 'ak-GH' });
    expect(demo.mimeType).toBe('audio/wav');
    expect(demo.audio.length).toBeGreaterThan(40);

    const gh = await adapter.synthesize({
      text: 'Good morning from Accra',
      voice: 'own:en-gh-male',
      language: 'en-GH',
    });
    expect(gh.audio.length).toBeGreaterThan(40);

    const ng = await adapter.synthesize({
      text: 'Good afternoon from Lagos',
      voice: 'own:en-ng-female',
      language: 'en-NG',
    });
    expect(ng.audio.length).toBeGreaterThan(40);
  });
});
