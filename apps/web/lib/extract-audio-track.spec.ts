import { describe, expect, it } from 'vitest';
import { encodeWavMono } from './extract-audio-track';

describe('encodeWavMono', () => {
  it('writes a valid RIFF/WAVE header for mono PCM16', async () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const blob = encodeWavMono(samples, 16000);
    expect(blob.type).toBe('audio/wav');
    const buf = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(...buf.slice(0, 4))).toBe('RIFF');
    expect(String.fromCharCode(...buf.slice(8, 12))).toBe('WAVE');
    expect(buf.length).toBe(44 + samples.length * 2);
  });
});
