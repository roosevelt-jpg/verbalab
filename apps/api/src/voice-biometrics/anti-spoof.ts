import { extractPcmMono } from '../speaker-intelligence/fingerprint';

export type AntiSpoofResult = {
  riskScore: number;
  decision: 'pass' | 'review' | 'fail';
  signals: {
    durationSeconds: number;
    clippingRatio: number;
    energyVariance: number;
    spectralFlatness: number;
    speechLikeRatio: number;
  };
  flags: string[];
  note: string;
  certifiedPad: false;
};

/**
 * Heuristic replay/TTS-ish spoof proxies — NOT NIST PAD / ASVspoof.
 */
export function assessAntiSpoof(buffer: Buffer): AntiSpoofResult {
  const { samples, sampleRate } = extractPcmMono(buffer);
  const durationSeconds = sampleRate > 0 ? samples.length / sampleRate : 0;
  const flags: string[] = [];

  if (!samples.length) {
    return {
      riskScore: 1,
      decision: 'fail',
      signals: {
        durationSeconds: 0,
        clippingRatio: 0,
        energyVariance: 0,
        spectralFlatness: 1,
        speechLikeRatio: 0,
      },
      flags: ['empty_audio'],
      note: 'Heuristic anti-spoof only — not NIST PAD / ASVspoof certified.',
      certifiedPad: false,
    };
  }

  let clip = 0;
  let energySum = 0;
  let energySq = 0;
  const frame = Math.max(64, Math.floor(sampleRate * 0.02));
  const frameEnergies: number[] = [];
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i] ?? 0);
    if (a > 0.98) clip += 1;
    energySum += a;
    energySq += a * a;
  }
  for (let i = 0; i < samples.length; i += frame) {
    let e = 0;
    const end = Math.min(samples.length, i + frame);
    for (let j = i; j < end; j++) e += (samples[j] ?? 0) ** 2;
    frameEnergies.push(Math.sqrt(e / Math.max(1, end - i)));
  }

  const n = samples.length;
  const mean = energySum / n;
  const energyVariance = Math.max(0, energySq / n - mean * mean);
  const clippingRatio = clip / n;

  // Crude spectral flatness via frame-energy entropy proxy
  const sumE = frameEnergies.reduce((s, v) => s + v, 0) || 1;
  let entropy = 0;
  for (const e of frameEnergies) {
    const p = e / sumE;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(Math.max(2, frameEnergies.length));
  const spectralFlatness = maxEntropy > 0 ? entropy / maxEntropy : 1;

  const speechThresh = Math.max(0.02, mean * 0.5);
  const speechLikeRatio =
    frameEnergies.filter((e) => e >= speechThresh).length / Math.max(1, frameEnergies.length);

  let risk = 0;
  if (durationSeconds < 0.4) {
    risk += 0.35;
    flags.push('too_short');
  }
  if (clippingRatio > 0.08) {
    risk += 0.25;
    flags.push('heavy_clipping');
  }
  if (energyVariance < 0.0008) {
    risk += 0.25;
    flags.push('low_dynamics');
  }
  if (spectralFlatness > 0.92) {
    risk += 0.2;
    flags.push('noise_like');
  }
  if (spectralFlatness < 0.15 && energyVariance < 0.002) {
    risk += 0.3;
    flags.push('tone_like_synthetic');
  }
  if (speechLikeRatio < 0.15) {
    risk += 0.2;
    flags.push('low_speech_energy');
  }

  risk = Math.min(1, Number(risk.toFixed(3)));
  const decision = risk >= 0.65 ? 'fail' : risk >= 0.35 ? 'review' : 'pass';

  return {
    riskScore: risk,
    decision,
    signals: {
      durationSeconds: Number(durationSeconds.toFixed(3)),
      clippingRatio: Number(clippingRatio.toFixed(4)),
      energyVariance: Number(energyVariance.toFixed(6)),
      spectralFlatness: Number(spectralFlatness.toFixed(3)),
      speechLikeRatio: Number(speechLikeRatio.toFixed(3)),
    },
    flags,
    note: 'Heuristic anti-spoof proxies only — not NIST PAD / ASVspoof certified.',
    certifiedPad: false,
  };
}

const CHALLENGE_WORDS = [
  'karibu',
  'lugemi',
  'safari',
  'ubuntu',
  'nairobi',
  'lagos',
  'accra',
  'cairo',
];

export function createLivenessChallenge {
  const pick = [...CHALLENGE_WORDS].sort( => Math.random - 0.5).slice(0, 3);
  return {
    challengeId: `live_${Date.now.toString(36)}_${randomSuffix}`,
    phrase: pick.join(' '),
    minDurationSeconds: 1.2,
    expiresInSeconds: 120,
    note: 'Speak the phrase clearly. Heuristic duration/energy check only — not certified liveness PAD.',
    certifiedLiveness: false as const,
  };
}

function randomSuffix {
  return Math.random.toString(36).slice(2, 8);
}

export function assessLiveness(
  buffer: Buffer,
  opts?: { minDurationSeconds?: number },
): {
  passed: boolean;
  durationSeconds: number;
  speechLikeRatio: number;
  note: string;
  certifiedLiveness: false;
} {
  const spoof = assessAntiSpoof(buffer);
  const min = opts?.minDurationSeconds ?? 1.2;
  const passed =
    spoof.signals.durationSeconds >= min &&
    spoof.signals.speechLikeRatio >= 0.2 &&
    spoof.decision !== 'fail';
  return {
    passed,
    durationSeconds: spoof.signals.durationSeconds,
    speechLikeRatio: spoof.signals.speechLikeRatio,
    note: 'Heuristic liveness (duration + speech energy) — not certified presentation-attack detection.',
    certifiedLiveness: false,
  };
}
