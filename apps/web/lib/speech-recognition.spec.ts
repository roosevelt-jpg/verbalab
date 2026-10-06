import { describe, expect, it } from 'vitest';
import { recognitionLangFor } from './speech-recognition';

describe('recognitionLangFor', () => {
  it('maps African and common locale codes used by Chat Studio live record', () => {
    expect(recognitionLangFor('en')).toBe('en-US');
    expect(recognitionLangFor('ak')).toBe('ak-GH');
    expect(recognitionLangFor('sw')).toBe('sw-KE');
    expect(recognitionLangFor('fr')).toBe('fr-FR');
  });

  it('passes through full BCP-47 tags', () => {
    expect(recognitionLangFor('en-GB')).toBe('en-GB');
  });
});
