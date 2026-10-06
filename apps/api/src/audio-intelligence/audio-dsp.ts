import { extractPcmMono } from '../speaker-intelligence/fingerprint';

export type SilenceRegion = {
  start: number;
  end: number;
  durationSeconds: number;
};

export type AudioAnalysis = {
  durationSeconds: number;
  sampleRate: number;
  sampleCount: number;
  rmsEnergy: number;
  peakAmplitude: number;
  noiseFloor: number;
  estimatedSnrDb: number;
  noisy: boolean;
  silenceRatio: number;
  silenceRegions: SilenceRegion[];
  speechRatio: number;
  note: string;
};

function frameRms(samples: Float32Array, start: number, end: number): number {
  let e = 0;
  const n = Math.max(1, end - start);
  for (let i = start; i < end; i++) {
    const s = samples[i] ?? 0;
    e += s * s;
  }
  return Math.sqrt(e / n);
}

/** Analyze PCM for noise/silence metrics. */
export function analyzeAudioBuffer(buffer: Buffer): AudioAnalysis {
  const { samples, sampleRate } = extractPcmMono(buffer);
  const durationSeconds = sampleRate > 0 ? samples.length / sampleRate : 0.1;
  if (!samples.length) {
    return {
      durationSeconds: 0.1,
      sampleRate,
      sampleCount: 0,
      rmsEnergy: 0,
      peakAmplitude: 0,
      noiseFloor: 0,
      estimatedSnrDb: 0,
      noisy: false,
      silenceRatio: 1,
      silenceRegions: [],
      speechRatio: 0,
      note: 'Empty or undecodable audio — WAV PCM preferred for best results.',
    };
  }

  const frameSize = Math.max(128, Math.floor(sampleRate * 0.02)); // 20ms
  const frameEnergies: number[] = [];
  for (let i = 0; i < samples.length; i += frameSize) {
    frameEnergies.push(frameRms(samples, i, Math.min(samples.length, i + frameSize)));
  }

  const sorted = [...frameEnergies].sort((a, b) => a - b);
  const noiseFloor = sorted[Math.max(0, Math.floor(sorted.length * 0.1))] ?? 0;
  const speechThresh = Math.max(noiseFloor * 3.5, 0.02);

  let peak = 0;
  let energySum = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i] ?? 0);
    if (a > peak) peak = a;
    energySum += (samples[i] ?? 0) ** 2;
  }
  const rmsEnergy = Math.sqrt(energySum / samples.length);

  const silenceRegions: SilenceRegion[] = [];
  let inSilence = false;
  let silStart = 0;
  let silentFrames = 0;
  for (let f = 0; f < frameEnergies.length; f++) {
    const silent = (frameEnergies[f] ?? 0) < speechThresh;
    if (silent) silentFrames += 1;
    const t = (f * frameSize) / sampleRate;
    if (silent && !inSilence) {
      inSilence = true;
      silStart = t;
    } else if (!silent && inSilence) {
      inSilence = false;
      const end = t;
      if (end - silStart >= 0.15) {
        silenceRegions.push({
          start: Number(silStart.toFixed(3)),
          end: Number(end.toFixed(3)),
          durationSeconds: Number((end - silStart).toFixed(3)),
        });
      }
    }
  }
  if (inSilence) {
    const end = durationSeconds;
    if (end - silStart >= 0.15) {
      silenceRegions.push({
        start: Number(silStart.toFixed(3)),
        end: Number(end.toFixed(3)),
        durationSeconds: Number((end - silStart).toFixed(3)),
      });
    }
  }

  const silenceRatio = silentFrames / Math.max(1, frameEnergies.length);
  const speechRatio = 1 - silenceRatio;
  const signal = Math.max(rmsEnergy, 1e-6);
  const noise = Math.max(noiseFloor, 1e-6);
  const estimatedSnrDb = Number((20 * Math.log10(signal / noise)).toFixed(2));
  const noisy = estimatedSnrDb < 12 || noiseFloor > 0.08;

  return {
    durationSeconds: Number(durationSeconds.toFixed(3)),
    sampleRate,
    sampleCount: samples.length,
    rmsEnergy: Number(rmsEnergy.toFixed(4)),
    peakAmplitude: Number(peak.toFixed(4)),
    noiseFloor: Number(noiseFloor.toFixed(4)),
    estimatedSnrDb,
    noisy,
    silenceRatio: Number(silenceRatio.toFixed(3)),
    silenceRegions,
    speechRatio: Number(speechRatio.toFixed(3)),
    note: 'Heuristic energy analysis on PCM — not a learned noise classifier.',
  };
}

/** Simple noise gate + soft high-pass-ish differentiation attenuate + normalize. */
export function enhanceAudio(
  buffer: Buffer,
  options?: {
    gateMultiplier?: number;
    targetPeak?: number;
    /** High-pass coefficient (0–1). Higher = stronger rumble cut. */
    hpAlpha?: number;
    /** Attenuation factor for gated (below-threshold) samples. */
    gateFloor?: number;
  },
): { wav: Buffer; analysisBefore: AudioAnalysis; analysisAfter: AudioAnalysis } {
  const before = analyzeAudioBuffer(buffer);
  const { samples, sampleRate } = extractPcmMono(buffer);
  const gate = Math.max(before.noiseFloor * (options?.gateMultiplier ?? 2.5), 0.01);
  const out = new Float32Array(samples.length);
  let prevY = 0;
  let prevX = 0;
  const alpha = options?.hpAlpha ?? 0.96;
  const gateFloor = options?.gateFloor ?? 0.12;
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i] ?? 0;
    // First-order high-pass then gate
    const y = alpha * (prevY + x - prevX);
    prevX = x;
    prevY = y;
    out[i] = Math.abs(y) < gate ? y * gateFloor : y;
  }
  const targetPeak = options?.targetPeak ?? 0.9;
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i] ?? 0));
  const gain = peak > 0 ? targetPeak / peak : 1;
  for (let i = 0; i < out.length; i++) out[i] = (out[i] ?? 0) * gain;

  const wav = encodeWavPcm16(out, sampleRate);
  const after = analyzeAudioBuffer(wav);
  return { wav, analysisBefore: before, analysisAfter: after };
}

/** Soft limiter / gentle compression for broadcast-ish loudness (heuristic, not LUFS mastering). */
export function softLimitAudio(
  buffer: Buffer,
  threshold = 0.75,
  ratio = 2.5,
): Buffer {
  const { samples, sampleRate } = extractPcmMono(buffer);
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i] ?? 0;
    const a = Math.abs(x);
    if (a <= threshold) {
      out[i] = x;
    } else {
      const over = a - threshold;
      const compressed = threshold + over / ratio;
      out[i] = Math.sign(x) * Math.min(0.98, compressed);
    }
  }
  return encodeWavPcm16(out, sampleRate);
}

/** Linear upsample (not generative audio upscaling). */
export function upscaleAudio(buffer: Buffer, targetRate = 32000): { wav: Buffer; fromRate: number; toRate: number } {
  const { samples, sampleRate } = extractPcmMono(buffer);
  const toRate = Math.max(sampleRate, Math.min(48000, targetRate));
  if (toRate === sampleRate) {
    return { wav: encodeWavPcm16(samples, sampleRate), fromRate: sampleRate, toRate };
  }
  const ratio = toRate / sampleRate;
  const outLen = Math.floor(samples.length * ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = i / ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(samples.length - 1, i0 + 1);
    const t = src - i0;
    out[i] = (samples[i0] ?? 0) * (1 - t) + (samples[i1] ?? 0) * t;
  }
  return { wav: encodeWavPcm16(out, toRate), fromRate: sampleRate, toRate };
}

/**
 * Energy VAD voice isolation — attenuate non-speech frames.
 * Not ML background separation / Demucs.
 */
export function isolateVoice(buffer: Buffer): {
  wav: Buffer;
  speechRatio: number;
  note: string;
} {
  const { samples, sampleRate } = extractPcmMono(buffer);
  const analysis = analyzeAudioBuffer(buffer);
  const frameSize = Math.max(128, Math.floor(sampleRate * 0.02));
  const thresh = Math.max(analysis.noiseFloor * 3.5, 0.02);
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += frameSize) {
    const end = Math.min(samples.length, i + frameSize);
    const rms = frameRms(samples, i, end);
    const keep = rms >= thresh;
    for (let j = i; j < end; j++) {
      out[j] = keep ? (samples[j] ?? 0) : (samples[j] ?? 0) * 0.05;
    }
  }
  return {
    wav: encodeWavPcm16(out, sampleRate),
    speechRatio: analysis.speechRatio,
    note: 'Energy VAD attenuation of low-energy frames — not neural voice isolation or source separation.',
  };
}

export function encodeWavPcm16(samples: Float32Array, sampleRate: number): Buffer {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buffer;
}
