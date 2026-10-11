import { describe, expect, it } from 'vitest';
import { blobFromDataUrl, resolvePlayableMediaSrc } from './media-playback';

describe('media-playback', () => {
  it('decodes base64 data URLs into typed blobs', async () => {
    const payload = Buffer.from('ID3fake').toString('base64');
    const blob = blobFromDataUrl(`data:audio/mpeg;base64,${payload}`);
    expect(blob.type).toBe('audio/mpeg');
    expect(blob.size).toBe(7);
    expect(await blob.text()).toBe('ID3fake');
  });

  it('leaves blob and https sources untouched', () => {
    expect(resolvePlayableMediaSrc('blob:https://lugemi.com/abc')).toEqual({
      url: 'blob:https://lugemi.com/abc',
      revoke: false,
    });
    expect(resolvePlayableMediaSrc('https://api.lugemi.com/v1/demo/speech')).toEqual({
      url: 'https://api.lugemi.com/v1/demo/speech',
      revoke: false,
    });
  });

  it('converts data URLs into revocable object URLs', () => {
    const payload = Buffer.from('wav').toString('base64');
    const resolved = resolvePlayableMediaSrc(`data:audio/wav;base64,${payload}`);
    expect(resolved.revoke).toBe(true);
    expect(resolved.url.startsWith('blob:')).toBe(true);
    URL.revokeObjectURL(resolved.url);
  });
});
