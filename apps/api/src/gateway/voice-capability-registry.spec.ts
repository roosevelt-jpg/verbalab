import { describe, expect, it } from 'vitest';
import {
  capabilityForVoice,
  isDemoSafeVoice,
  resolveEspeakVoice,
} from './voice-capability-registry';
import { generateSpeechWav } from './own-tts.adapter';

describe('voice capability registry', () => {
  it('maps English regional varieties to distinct eSpeak voices', () => {
    expect(resolveEspeakVoice('own:en-us-female', 'en-US')).toMatchObject({
      kind: 'espeak',
      espeakVoice: 'en-us+f2',
    });
    expect(resolveEspeakVoice('own:en-gb-female', 'en-GB')).toMatchObject({
      kind: 'espeak',
      espeakVoice: 'en-gb+f2',
    });
    expect(resolveEspeakVoice('own:en-au-female', 'en-AU')).toMatchObject({
      kind: 'espeak',
      espeakVoice: 'en-au+f2',
    });
    expect(resolveEspeakVoice('own:en-nz-female', 'en-NZ')).toMatchObject({
      kind: 'espeak',
      espeakVoice: 'en-nz+f2',
    });
  });

  it('does not treat Yoruba as Nigerian English via substring ng', () => {
    const yo = resolveEspeakVoice('own:yo-ng-male', 'yo-NG');
    expect(yo.kind).toBe('formant');
    expect(isDemoSafeVoice('own:yo-ng-male', 'yo-NG')).toBe(false);
  });

  it('does not substitute Afrikaans for Zulu', () => {
    const zu = resolveEspeakVoice('own:zu-za-female', 'zu-ZA');
    expect(zu.kind).toBe('formant');
    expect(capabilityForVoice({ voiceId: 'own:zu-za-female', locale: 'zu-ZA' }).demoSafe).toBe(
      false,
    );
  });

  it('marks Swahili and French as demo-safe eSpeak paths', () => {
    expect(isDemoSafeVoice('own:sw-ke-female', 'sw-KE')).toBe(true);
    expect(isDemoSafeVoice('own:fr-fr-female', 'fr-FR')).toBe(true);
    expect(isDemoSafeVoice('own:fr-sn-female', 'fr-SN')).toBe(true);
  });

  it('generateSpeechWav produces RIFF/WAVE for eSpeak languages', () => {
    const out = generateSpeechWav('Karibu sana.', 'own:sw-ke-female', 'sw-KE', {
      allowFormant: false,
    });
    expect(out.engine).toBe('espeak');
    expect(out.audio.toString('ascii', 0, 4)).toBe('RIFF');
    expect(out.audio.toString('ascii', 8, 12)).toBe('WAVE');
    expect(out.audio.length).toBeGreaterThan(1000);
    // eSpeak --stdout placeholders must be rewritten or browsers mis-play audio.
    const riffSize = out.audio.readUInt32LE(4);
    const dataSize = out.audio.readUInt32LE(40);
    expect(riffSize).toBe(out.audio.length - 8);
    expect(dataSize).toBe(out.audio.length - 44);
    expect(dataSize).toBeLessThan(5_000_000);
  });

  it('refuses formant when requireIntelligible / allowFormant false', () => {
    expect(() =>
      generateSpeechWav('Bawo ni?', 'own:yo-ng-male', 'yo-NG', { allowFormant: false }),
    ).toThrow(/neural checkpoint|No eSpeak/i);
  });
});
