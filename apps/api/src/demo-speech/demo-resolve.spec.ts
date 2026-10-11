import { describe, expect, it } from 'vitest';
import { resolveDemoSpeechTarget } from './demo-resolve';

describe('resolveDemoSpeechTarget', () => {
  it('keeps demo-safe Ghanaian English as-is', () => {
    const out = resolveDemoSpeechTarget({
      text: 'Good morning. You are welcome.',
      language: 'en-GH',
      voice: 'own:en-gh-female',
    });
    expect(out.remapped).toBe(false);
    expect(out.voice).toBe('own:en-gh-female');
    expect(out.language).toBe('en-GH');
    expect(out.text).toContain('Good morning');
  });

  it('remaps Akan to Ghanaian English with intelligible sample', () => {
    const out = resolveDemoSpeechTarget({
      text: 'Akwaaba! Medaase pa.',
      language: 'ak-GH',
      voice: 'own:ak-gh-female',
    });
    expect(out.remapped).toBe(true);
    expect(out.voice).toBe('own:en-gh-female');
    expect(out.language).toBe('en-GH');
    expect(out.text.toLowerCase()).toMatch(/welcome|akwaaba|ghanaian/);
  });

  it('remaps Yoruba to Nigerian English — never formant / never silent', () => {
    const out = resolveDemoSpeechTarget({
      text: 'Bawo ni?',
      language: 'yo-NG',
      voice: 'own:yo-ng-male',
    });
    expect(out.remapped).toBe(true);
    expect(out.voice).toBe('own:en-ng-male');
    expect(out.language).toBe('en-NG');
  });

  it('remaps Zulu to South African English — not Afrikaans', () => {
    const out = resolveDemoSpeechTarget({
      text: 'Sawubona',
      language: 'zu-ZA',
      voice: 'own:zu-za-female',
    });
    expect(out.remapped).toBe(true);
    expect(out.voice).toBe('own:en-za-female');
    expect(out.language).toBe('en-ZA');
    expect(out.note).toMatch(/not Afrikaans/i);
  });

  it('keeps Pidgin orthography on Nigerian English eSpeak path', () => {
    const phrase = 'How far, my guy? Abeg no vex.';
    const out = resolveDemoSpeechTarget({
      text: phrase,
      language: 'pcm-NG',
      voice: 'own:pcm-ng-female',
    });
    expect(out.remapped).toBe(true);
    expect(out.voice).toBe('own:en-ng-female');
    expect(out.text).toBe(phrase);
  });

  it('accepts bare voice keys without own: prefix', () => {
    const out = resolveDemoSpeechTarget({
      text: 'Hello from Nairobi.',
      language: 'en-KE',
      voice: 'en-ke-female',
    });
    expect(out.voice).toBe('own:en-ke-female');
    expect(out.remapped).toBe(false);
  });
});
