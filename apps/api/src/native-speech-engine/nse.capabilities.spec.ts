import { describe, expect, it } from 'vitest';
import { assertTaskAuthorized, buildNseCapabilities } from './nse.capabilities';

describe('buildNseCapabilities', () => {
  it('exposes task modes and honesty rules without nationality inference', () => {
    const manifest = buildNseCapabilities([
      {
        id: 'own:en-gh-female',
        status: 'live',
        synthEngine: 'espeak_ng',
        verificationStatus: 'espeak_demo',
        languages: ['en'],
        locale: 'en-GH',
      },
    ]);
    expect(manifest.tasks).toContain('text_to_speech');
    expect(manifest.tasks).toContain('speech_to_text');
    expect(manifest.honesty.some((h) => /nationality/i.test(h) || /source accent/i.test(h))).toBe(
      true,
    );
    expect(manifest.capabilities.some((c) => c.voiceId === 'own:en-gh-female')).toBe(true);
  });

  it('never authorizes streaming_interpretation without lifecycle tests', () => {
    const manifest = buildNseCapabilities([]);
    expect(assertTaskAuthorized(manifest.capabilities, 'streaming_interpretation')).toBeNull();
  });

  it('authorizes verified TTS voices and rejects unavailable ones', () => {
    const manifest = buildNseCapabilities([
      {
        id: 'own:en-us-female',
        status: 'live',
        synthEngine: 'espeak_ng',
        verificationStatus: 'espeak_demo',
        languages: ['en'],
        locale: 'en-US',
      },
    ]);
    const hit = assertTaskAuthorized(
      manifest.capabilities,
      'text_to_speech',
      'own:en-us-female',
      'en-US',
    );
    expect(hit).not.toBeNull();
    expect(hit!.status).not.toBe('unavailable');
    expect(hit!.status).not.toBe('suspended');
  });
});
