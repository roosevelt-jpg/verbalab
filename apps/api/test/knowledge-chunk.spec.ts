import { describe, expect, it } from 'vitest';
import { chunkText } from '../src/knowledge/knowledge.util';

describe('chunkText', () => {
  it('splits long text with overlap', () => {
    const text = 'a'.repeat(1000);
    const chunks = chunkText(text, { size: 400, overlap: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]!.length).toBeLessThanOrEqual(400);
  });

  it('returns empty for blank input', () => {
    expect(chunkText(' \n\n ')).toEqual([]);
  });
});
