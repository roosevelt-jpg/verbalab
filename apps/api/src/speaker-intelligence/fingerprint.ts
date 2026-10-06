/**
 * Lightweight acoustic fingerprint for enrollment / verification (VL-152).
 * Not a NIST-grade biometric template — energy + spectral envelope features only.
 */

const FINGERPRINT_DIM = 32;

export type VoiceFingerprint = {
  version: 1;
  dims: number;
  /** L2-normalized feature vector. */
  vector: number[];
  /** Rough duration estimate from PCM/payload size. */
  durationSeconds: number;
};

/** Decode PCM samples from common containers; falls back to raw byte energy. */
export function extractPcmMono(buffer: Buffer): { samples: Float32Array; sampleRate: number } {
  // WAV: look for 'data' chunk
  if (buffer.length >= 44 && buffer.toString('ascii', 0, 4) === 'RIFF') {
    let offset = 12;
    let sampleRate = 16000;
    let bitsPerSample = 16;
    let channels = 1;
    while (offset + 8 <= buffer.length) {
      const id = buffer.toString('ascii', offset, offset + 4);
      const size = buffer.readUInt32LE(offset + 4);
      if (id === 'fmt ' && offset + 24 <= buffer.length) {
        channels = buffer.readUInt16LE(offset + 10);
        sampleRate = buffer.readUInt32LE(offset + 12);
        bitsPerSample = buffer.readUInt16LE(offset + 22);
      }
      if (id === 'data') {
        const dataStart = offset + 8;
        const dataEnd = Math.min(buffer.length, dataStart + size);
        const raw = buffer.subarray(dataStart, dataEnd);
        const samples = pcmToMonoFloat(raw, bitsPerSample, channels);
        return { samples, sampleRate: sampleRate || 16000 };
      }
      offset += 8 + size + (size % 2);
    }
  }

  // Fallback: treat payload as unsigned bytes centered around 128
  const samples = new Float32Array(Math.min(buffer.length, 160_000));
  for (let i = 0; i < samples.length; i++) {
    samples[i] = ((buffer[i] ?? 128) - 128) / 128;
  }
  return { samples, sampleRate: 16000 };
}

function pcmToMonoFloat(raw: Buffer, bitsPerSample: number, channels: number): Float32Array {
  const ch = Math.max(1, channels);
  if (bitsPerSample === 16) {
    const frameCount = Math.floor(raw.length / (2 * ch));
    const out = new Float32Array(frameCount);
    for (let i = 0; i < frameCount; i++) {
      let sum = 0;
      for (let c = 0; c < ch; c++) {
        sum += raw.readInt16LE((i * ch + c) * 2) / 32768;
      }
      out[i] = sum / ch;
    }
    return out;
  }
  const frameCount = Math.floor(raw.length / ch);
  const out = new Float32Array(frameCount);
  for (let i = 0; i < frameCount; i++) {
    let sum = 0;
    for (let c = 0; c < ch; c++) {
      sum += ((raw[i * ch + c] ?? 128) - 128) / 128;
    }
    out[i] = sum / ch;
  }
  return out;
}

export function computeVoiceFingerprint(buffer: Buffer): VoiceFingerprint {
  const { samples, sampleRate } = extractPcmMono(buffer);
  const durationSeconds =
    sampleRate > 0 ? Math.max(0.1, samples.length / sampleRate) : Math.max(0.1, buffer.length / 2000);

  const vector = new Array<number>(FINGERPRINT_DIM).fill(0);
  if (samples.length === 0) {
    return { version: 1, dims: FINGERPRINT_DIM, vector, durationSeconds };
  }

  // Windowed energy + zero-crossing into dim buckets
  const window = Math.max(256, Math.floor(samples.length / FINGERPRINT_DIM));
  for (let d = 0; d < FINGERPRINT_DIM; d++) {
    const start = d * window;
    const end = Math.min(samples.length, start + window);
    if (start >= end) break;
    let energy = 0;
    let zcr = 0;
    let spectral = 0;
    for (let i = start; i < end; i++) {
      const s = samples[i] ?? 0;
      energy += s * s;
      if (i > start) {
        const prev = samples[i - 1] ?? 0;
        if ((s >= 0 && prev < 0) || (s < 0 && prev >= 0)) zcr += 1;
      }
      spectral += Math.abs(s) * ((i - start) / (end - start + 1));
    }
    const n = end - start;
    const rms = Math.sqrt(energy / n);
    const zcrRate = zcr / n;
    vector[d] = rms * 0.7 + zcrRate * 0.2 + spectral * 0.1;
  }

  return {
    version: 1,
    dims: FINGERPRINT_DIM,
    vector: l2Normalize(vector),
    durationSeconds: Math.round(durationSeconds * 1000) / 1000,
  };
}

export function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
  return vector.map((v) => Math.round((v / norm) * 1e6) / 1e6);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (!denom) return 0;
  return Math.round((dot / denom) * 1000) / 1000;
}

/** Heuristic turn grouping by silence gaps between STT segments. */
export function diarizeSegmentsByGaps(
  segments: Array<{ id: number; start: number; end: number; text: string; confidence?: number }>,
  gapSeconds = 0.85,
): Array<{
  speakerLabel: string;
  start: number;
  end: number;
  text: string;
  segmentIds: number[];
}> {
  if (!segments.length) return [];
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const turns: Array<{
    speakerIndex: number;
    start: number;
    end: number;
    texts: string[];
    segmentIds: number[];
  }> = [];

  let speakerIndex = 0;
  let current = {
    speakerIndex,
    start: sorted[0]!.start,
    end: sorted[0]!.end,
    texts: [sorted[0]!.text],
    segmentIds: [sorted[0]!.id],
  };

  for (let i = 1; i < sorted.length; i++) {
    const seg = sorted[i]!;
    const gap = seg.start - current.end;
    if (gap >= gapSeconds) {
      turns.push(current);
      // Alternate speakers on long gaps (heuristic 2-speaker assumption)
      speakerIndex = speakerIndex === 0 ? 1 : (speakerIndex + 1) % Math.min(4, turns.length + 2);
      // Prefer toggling A/B for typical dialogues
      const last = turns[turns.length - 1]!;
      speakerIndex = last.speakerIndex === 0 ? 1 : 0;
      current = {
        speakerIndex,
        start: seg.start,
        end: seg.end,
        texts: [seg.text],
        segmentIds: [seg.id],
      };
    } else {
      current.end = Math.max(current.end, seg.end);
      current.texts.push(seg.text);
      current.segmentIds.push(seg.id);
    }
  }
  turns.push(current);

  return turns.map((t) => ({
    speakerLabel: `SPEAKER_${String.fromCharCode(65 + t.speakerIndex)}`,
    start: t.start,
    end: t.end,
    text: t.texts.join(' ').trim(),
    segmentIds: t.segmentIds,
  }));
}
