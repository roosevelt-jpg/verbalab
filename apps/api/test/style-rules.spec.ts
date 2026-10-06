import { describe, expect, it } from 'vitest';
import { applyStyleRules, detectTone } from '../src/style/style-profiles';

describe('style rules',  => {
  it('professional expands informal wording and contractions',  => {
    const { rewritten, changes } = applyStyleRules("I'm gonna finish this ASAP, yeah?", 'professional');
    expect(rewritten).toContain('I am');
    expect(rewritten).toContain('going to');
    expect(rewritten).toContain('yes');
    expect(changes.length).toBeGreaterThan(0);
  });

  it('concise removes fillers',  => {
    const { rewritten } = applyStyleRules('This is really just basically fine.', 'concise');
    expect(rewritten.toLowerCase).not.toContain('really');
    expect(rewritten.toLowerCase).not.toContain('basically');
  });

  it('business expands ASAP shorthand',  => {
    const { rewritten } = applyStyleRules('Ship it ASAP', 'business');
    expect(rewritten.toLowerCase).toContain('as soon as possible');
  });

  it('detectTone scores marketing cues',  => {
    const result = detectTone('Buy now and unlock this campaign CTA');
    expect(result.detectedTone).toBe('marketing');
  });
});
