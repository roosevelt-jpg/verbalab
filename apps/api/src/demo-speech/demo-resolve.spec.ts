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

  it('aligns Algerian English + Kenyan Echo voice so gateway does not 422', () => {
    const out = resolveDemoSpeechTarget({
      text: 'Good morning. Welcome — please take a seat.',
      language: 'en-DZ',
      voice: 'own:en-ke-female',
    });
    expect(out.voice).toBe('own:en-ke-female');
    expect(out.language).toBe('en-KE');
    expect(out.remapped).toBe(true);
    expect(out.text).toContain('Welcome');
  });

  it('remaps Tagalog pack away from English-only Echo voice', () => {
    const out = resolveDemoSpeechTarget({
      text: 'Magandang umaga po!',
      language: 'fil-PH',
      voice: 'own:en-ph-female',
    });
    expect(out.remapped).toBe(true);
    expect(out.voice).toBe('own:en-ph-female');
    expect(out.language).toBe('en-PH');
  });

  it('remaps Thai pack that wrongly ships en-kofi onto Thai eSpeak', () => {
    const out = resolveDemoSpeechTarget({
      text: 'Sawatdee khrap!',
      language: 'th-TH',
      voice: 'own:en-kofi',
    });
    expect(out.remapped).toBe(true);
    expect(out.voice).toBe('own:th-pack');
    expect(out.language).toBe('th-TH');
  });

  it('routes Cameroonian Pidgin English away from pcm formant voice', () => {
    const out = resolveDemoSpeechTarget({
      text: 'How far my friend? Make we start the demo.',
      language: 'en-CM',
      voice: 'own:pcm-ng-female',
    });
    expect(out.remapped).toBe(true);
    expect(out.voice).toBe('own:en-ng-female');
    expect(out.language).toBe('en-NG');
  });

  it('routes Irish English through UK Echo locale for gateway nativeness', () => {
    const out = resolveDemoSpeechTarget({
      text: 'Good morning — welcome to Lugemi.',
      language: 'en-IE',
      voice: 'own:en-kofi',
    });
    expect(out.remapped).toBe(true);
    expect(out.voice).toBe('own:en-gb-female');
    expect(out.language).toBe('en-GB');
  });

  it('upgrades demo-safe France French eSpeak to Senegal French neural', () => {
    const phrase = 'Merci d’avoir appelé. Un agent Lugemi vous répondra.';
    const out = resolveDemoSpeechTarget({
      text: phrase,
      language: 'fr-FR',
      voice: 'own:fr-fr-female',
    });
    expect(out.remapped).toBe(true);
    expect(out.voice).toBe('own:fr-sn-female');
    expect(out.language).toBe('fr-SN');
    expect(out.text).toBe(phrase);
    expect(out.note).toMatch(/West African French/i);
  });

  it('remaps bare French language demos onto Senegal French neural', () => {
    const out = resolveDemoSpeechTarget({
      text: 'Bonjour.',
      language: 'fr',
    });
    expect(out.remapped).toBe(true);
    expect(out.voice).toBe('own:fr-sn-female');
    expect(out.language).toBe('fr-SN');
  });
});
