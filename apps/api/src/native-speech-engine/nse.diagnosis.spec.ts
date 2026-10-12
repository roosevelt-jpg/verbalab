import { describe, expect, it } from 'vitest';
import { diagnoseSpeechAudio, looksLikeAudioBuffer } from './nse.diagnosis';

function minimalWav(pcmBytes = 22050): Buffer {
  const dataSize = pcmBytes;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(22050, 24);
  buf.writeUInt32LE(44100, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  // Non-silent ramp so integrity checks do not flag near-silence
  for (let i = 0; i < dataSize; i += 2) {
    buf.writeInt16LE(Math.floor(Math.sin(i / 20) * 8000), 44 + i);
  }
  return buf;
}

describe('diagnoseSpeechAudio', () => {
  it('rejects empty payloads', () => {
    const out = diagnoseSpeechAudio({
      audio: Buffer.alloc(0),
      mimeType: 'audio/wav',
    });
    expect(out.ok).toBe(false);
    expect(out.issues.some((i) => i.code === 'EMPTY_AUDIO')).toBe(true);
  });

  it('rejects JSON/HTML labeled as audio (beep root-cause layer: payload)', () => {
    const out = diagnoseSpeechAudio({
      audio: Buffer.from('{"error":"upstream failed"}'),
      mimeType: 'audio/mpeg',
    });
    expect(out.ok).toBe(false);
    expect(out.issues.some((i) => i.code === 'PROVIDER_ERROR_AS_AUDIO')).toBe(true);
  });

  it('rejects fixture text labeled as audio', () => {
    const out = diagnoseSpeechAudio({
      audio: Buffer.from('FIXTURE_TTS:hello'),
      mimeType: 'audio/wav',
    });
    expect(out.ok).toBe(false);
    expect(out.issues.some((i) => i.code === 'PROVIDER_ERROR_AS_AUDIO')).toBe(true);
  });

  it('flags absurd streaming WAV sizes (classic eSpeak echo/hang)', () => {
    const buf = minimalWav(200);
    buf.writeUInt32LE(0xffffffff, 4);
    const out = diagnoseSpeechAudio({
      audio: buf,
      mimeType: 'audio/wav',
      requireIntelligible: true,
    });
    expect(out.issues.some((i) => i.code === 'STREAMING_WAV_SIZE_MISMATCH')).toBe(true);
  });

  it('blocks formant placeholders on intelligible demo paths', () => {
    const out = diagnoseSpeechAudio({
      audio: minimalWav(),
      mimeType: 'audio/wav',
      verificationStatus: 'formant_placeholder',
      requireIntelligible: true,
    });
    expect(out.ok).toBe(false);
    expect(out.issues.some((i) => i.code === 'FORMANT_BLOCKED_FOR_DEMO')).toBe(true);
  });

  it('accepts a well-formed WAV from a verified synth path', () => {
    const audio = minimalWav();
    expect(looksLikeAudioBuffer(audio, 'audio/wav')).toBe(true);
    const out = diagnoseSpeechAudio({
      audio,
      mimeType: 'audio/wav',
      synthEngine: 'espeak_ng',
      verificationStatus: 'espeak_demo',
      requireIntelligible: true,
    });
    expect(out.ok).toBe(true);
    expect(out.durationHintMs).toBeGreaterThan(0);
  });
});
