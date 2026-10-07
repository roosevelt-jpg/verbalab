import { afterEach, describe, expect, it, vi } from 'vitest';
import { GatewayService } from './gateway.service';
import { baseTtsLanguage, findNativeVoice } from './native-voice';
import { createOwnTtsAdapter, OWN_TTS_VOICES, UnconfiguredOwnTtsAdapter } from './own-tts.adapter';

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
