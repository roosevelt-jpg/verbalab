import { describe, expect, it } from 'vitest';
import { flattenStrings, setAtPath, deepCloneJson } from '../src/localize/i18n-tree';
import { protectIcu, restoreIcu } from '../src/localize/icu';

describe('i18n-tree + icu', () => {
  it('flattens and writes back nested keys', () => {
    const tree = { app: { title: 'Hello', items: ['One', 'Two'] } };
    const flat = flattenStrings(tree);
    expect(flat).toEqual([
      { path: 'app.title', value: 'Hello' },
      { path: 'app.items[0]', value: 'One' },
      { path: 'app.items[1]', value: 'Two' },
    ]);
    const clone = deepCloneJson(tree);
    setAtPath(clone, 'app.title', 'Habari');
    expect(clone.app.title).toBe('Habari');
  });

  it('protects and restores ICU plural blocks', () => {
    const src = 'You have {count, plural, one {# item} other {# items}} left';
    const protectedText = protectIcu(src);
    expect(protectedText.text).toContain('⟦ICU0⟧');
    expect(protectedText.text).not.toContain('plural');
    const restored = restoreIcu(`[sw] ${protectedText.text}`, protectedText.slots);
    expect(restored).toBe(`[sw] ${src}`);
  });
});
