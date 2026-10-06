export type SpeechEmotionLabel =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fear'
  | 'neutral'
  | 'stress'
  | 'confidence'
  | 'excitement'
  | 'urgency';

export const SPEECH_EMOTION_LABELS: SpeechEmotionLabel[] = [
  'happy',
  'sad',
  'angry',
  'fear',
  'neutral',
  'stress',
  'confidence',
  'excitement',
  'urgency',
];

const EMOTION_CUES: Array<{ label: SpeechEmotionLabel; re: RegExp; weight: number }> = [
  { label: 'happy', re: /\b(happy|joy|delighted|glad|cheerful|smile|wonderful|love)\b/gi, weight: 2 },
  { label: 'sad', re: /\b(sad|unhappy|depressed|miserable|cry|grief|heartbroken)\b/gi, weight: 2 },
  { label: 'angry', re: /\b(angry|furious|rage|hate|outraged|annoyed|mad)\b/gi, weight: 2 },
  { label: 'fear', re: /\b(afraid|scared|fear|worried|anxious|terrified|panic)\b/gi, weight: 2 },
  { label: 'stress', re: /\b(stress|stressed|overwhelmed|pressure|burnout|exhausted)\b/gi, weight: 2 },
  {
    label: 'confidence',
    re: /\b(confident|sure|certain|definitely|assured|capable|ready)\b/gi,
    weight: 2,
  },
  {
    label: 'excitement',
    re: /\b(excited|thrilled|pumped|eager|can't wait|amazing|wow)\b/gi,
    weight: 2,
  },
  {
    label: 'urgency',
    re: /\b(urgent|asap|immediately|right now|emergency|critical|hurry|deadline)\b/gi,
    weight: 2.2,
  },
];

function countMatches(text: string, re: RegExp): number {
  const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  return [...text.matchAll(global)].length;
}

export type EmotionScore = {
  label: SpeechEmotionLabel;
  score: number;
  matchedCues: number;
};

export type AudioEmotionHints = {
  rmsEnergy: number;
  zcrRate: number;
  durationSeconds: number;
};

/** Lexical emotion scoring for Speech Emotion Intelligence. */
export function analyzeSpeechEmotion(
  text: string,
  audioHints?: AudioEmotionHints | null,
): {
  label: SpeechEmotionLabel;
  confidence: number;
  scores: EmotionScore[];
  signals: Array<{ label: SpeechEmotionLabel; weight: number }>;
  audioAdjusted: boolean;
  note: string;
} {
  const scores: Record<SpeechEmotionLabel, number> = {
    happy: 0,
    sad: 0,
    angry: 0,
    fear: 0,
    neutral: 0.15,
    stress: 0,
    confidence: 0,
    excitement: 0,
    urgency: 0,
  };
  const signals: Array<{ label: SpeechEmotionLabel; weight: number }> = [];

  for (const cue of EMOTION_CUES) {
    const n = countMatches(text, cue.re);
    if (n > 0) {
      const w = cue.weight * n;
      scores[cue.label] += w;
      signals.push({ label: cue.label, weight: w });
    }
  }

  let audioAdjusted = false;
  if (audioHints) {
    // Soft acoustic proxies — not SER models.
    if (audioHints.rmsEnergy > 0.22) {
      scores.excitement += 0.35;
      scores.angry += 0.15;
      audioAdjusted = true;
    }
    if (audioHints.rmsEnergy < 0.06 && audioHints.durationSeconds > 0.5) {
      scores.sad += 0.25;
      scores.neutral += 0.1;
      audioAdjusted = true;
    }
    if (audioHints.zcrRate > 0.18) {
      scores.stress += 0.3;
      scores.urgency += 0.2;
      audioAdjusted = true;
    }
  }

  const ranked = (Object.entries(scores) as Array<[SpeechEmotionLabel, number]>)
    .map(([label, score]) => ({
      label,
      score: Number(score.toFixed(3)),
      matchedCues: signals.filter((s) => s.label === label).length,
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]!;
  const second = ranked[1]?.score ?? 0;
  const label: SpeechEmotionLabel =
    best.score <= 0.2 ? 'neutral' : best.score - second < 0.15 && best.label !== 'neutral'
      ? best.score >= 0.35
        ? best.label
        : 'neutral'
      : best.label;

  const confidence =
    label === 'neutral' && best.score <= 0.2
      ? 0.4
      : Math.min(0.92, 0.4 + best.score * 0.12 + Math.max(0, best.score - second) * 0.2);

  return {
    label,
    confidence: Number(confidence.toFixed(3)),
    scores: ranked,
    signals,
    audioAdjusted,
    note: audioAdjusted
      ? 'Text cue emotion with soft audio energy/ZCR proxies — not a trained speech emotion recognition model.'
      : 'Text cue emotion buckets — not acoustic SER. Provide audio for soft energy proxies.',
  };
}
