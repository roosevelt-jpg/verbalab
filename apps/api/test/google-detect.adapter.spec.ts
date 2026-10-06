import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleDetectAdapter } from '../src/gateway/google-detect.adapter';
import { ApiException } from '../src/common/errors/api-exception';

describe('GoogleDetectAdapter',  => {
  afterEach( => {
    vi.unstubAllGlobals;
  });

  it('parses Google detect response', async  => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async  => ({
        ok: true,
        json: async  => ({
          data: { detections: [[{ language: 'sw', confidence: 0.88 }]] },
        }),
      })),
    );

    const adapter = new GoogleDetectAdapter('test-key');
    const result = await adapter.detect({ text: 'Habari' });
    expect(result).toEqual({
      language: 'sw',
      confidence: 0.88,
      provider: 'google_detect',
    });
  });

  it('throws when key missing', async  => {
    const adapter = new GoogleDetectAdapter('');
    await expect(adapter.detect({ text: 'Hi' })).rejects.toBeInstanceOf(ApiException);
  });

  it('throws on und language', async  => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async  => ({
        ok: true,
        json: async  => ({
          data: { detections: [[{ language: 'und', confidence: 0 }]] },
        }),
      })),
    );

    const adapter = new GoogleDetectAdapter('test-key');
    await expect(adapter.detect({ text: '???' })).rejects.toMatchObject({
      code: 'detection_failed',
    });
  });
});
