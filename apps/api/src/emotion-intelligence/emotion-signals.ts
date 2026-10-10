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

export type SpeechSentimentLabel = 'positive' | 'neutral' | 'negative' | 'mixed';

export type SpeechToneLabel =
  | 'formal'
  | 'casual'
  | 'urgent'
  | 'empathetic'
  | 'assertive'
  | 'hesitant'
  | 'neutral';

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

export const SPEECH_TONE_LABELS: SpeechToneLabel[] = [
  'formal',
  'casual',
  'urgent',
  'empathetic',
  'assertive',
  'hesitant',
  'neutral',
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

const POSITIVE_POLARITY =
  /\b(good|great|excellent|amazing|love|happy|thanks|thank you|awesome|wonderful|pleased|delighted|karibu|asante)\b/gi;
const NEGATIVE_POLARITY =
  /\b(bad|terrible|awful|hate|angry|upset|worst|horrible|disappointed|frustrated|broken|fail|sad|miserable|grief|afraid|terrified)\b/gi;

const TONE_CUES: Array<{ label: SpeechToneLabel; re: RegExp; weight: number }> = [
  {
    label: 'formal',
    re: /\b(therefore|hereby|pursuant|respectfully|kindly|regarding|sincerely|please be advised)\b/gi,
    weight: 2,
  },
  {
    label: 'casual',
    re: /\b(hey|yeah|gonna|wanna|lol|btw|cool|chale|abeg|sasa|niaje)\b/gi,
    weight: 2,
  },
  {
    label: 'urgent',
    re: /\b(urgent|asap|immediately|right now|emergency|critical|hurry|deadline)\b/gi,
    weight: 2.2,
  },
  {
    label: 'empathetic',
    re: /\b(sorry|i understand|i hear you|that must be|with you|support|care)\b/gi,
    weight: 2,
  },
  {
    label: 'assertive',
    re: /\b(must|will|require|demand|definitely|ensure|need you to)\b/gi,
    weight: 1.8,
  },
  {
    label: 'hesitant',
    re: /\b(maybe|perhaps|not sure|i think|might|possibly|um+|uh+)\b/gi,
    weight: 1.8,
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

/** Lexicon polarity for Speech Cloud — not a production sentiment suite. */
export function analyzeSpeechSentiment(text: string): {
  label: SpeechSentimentLabel;
  score: number;
  confidence: number;
  positiveHits: number;
  negativeHits: number;
  note: string;
} {
  const pos = countMatches(text, POSITIVE_POLARITY);
  const neg = countMatches(text, NEGATIVE_POLARITY);
  let label: SpeechSentimentLabel = 'neutral';
  if (pos > 0 && neg > 0) label = 'mixed';
  else if (pos > neg) label = 'positive';
  else if (neg > pos) label = 'negative';

  const total = pos + neg;
  const score =
    total === 0 ? 0 : Number((((pos - neg) / total) * Math.min(1, total / 3)).toFixed(3));
  const confidence = total === 0 ? 0.35 : Math.min(0.9, 0.45 + total * 0.08);

  return {
    label,
    score,
    positiveHits: pos,
    negativeHits: neg,
    confidence: Number(confidence.toFixed(3)),
    note: 'Lexicon polarity scoring — not a trained sentiment model or commercial NLP suite.',
  };
}

/** Delivery-tone heuristics from text (+ emotion context) — not prosody ASR. */
export function analyzeSpeechTone(
  text: string,
  emotionLabel: SpeechEmotionLabel,
): {
  label: SpeechToneLabel;
  confidence: number;
  scores: Array<{ label: SpeechToneLabel; score: number }>;
  note: string;
} {
  const scores: Record<SpeechToneLabel, number> = {
    formal: 0,
    casual: 0,
    urgent: 0,
    empathetic: 0,
    assertive: 0,
    hesitant: 0,
    neutral: 0.15,
  };

  for (const cue of TONE_CUES) {
    const n = countMatches(text, cue.re);
    if (n > 0) scores[cue.label] += cue.weight * n;
  }

  if (emotionLabel === 'urgency') scores.urgent += 1.2;
  if (emotionLabel === 'confidence') scores.assertive += 0.8;
  if (emotionLabel === 'fear' || emotionLabel === 'stress') scores.hesitant += 0.6;
  if (emotionLabel === 'sad' || emotionLabel === 'happy') scores.empathetic += 0.35;
  if (emotionLabel === 'angry') scores.assertive += 0.7;

  const ranked = (Object.entries(scores) as Array<[SpeechToneLabel, number]>)
    .map(([label, score]) => ({ label, score: Number(score.toFixed(3)) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]!;
  const second = ranked[1]?.score ?? 0;
  const label: SpeechToneLabel =
    best.score <= 0.2
      ? 'neutral'
      : best.score - second < 0.12 && best.label !== 'neutral'
        ? best.score >= 0.35
          ? best.label
          : 'neutral'
        : best.label;

  const confidence =
    label === 'neutral' && best.score <= 0.2
      ? 0.38
      : Math.min(0.9, 0.4 + best.score * 0.1 + Math.max(0, best.score - second) * 0.18);

  return {
    label,
    confidence: Number(confidence.toFixed(3)),
    scores: ranked,
    note: 'Text/delivery-tone heuristics — not acoustic prosody analysis or NIST-certified emotion science.',
  };
}

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
  sentiment: ReturnType<typeof analyzeSpeechSentiment>;
  tone: ReturnType<typeof analyzeSpeechTone>;
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
    best.score <= 0.2
      ? 'neutral'
      : best.score - second < 0.15 && best.label !== 'neutral'
        ? best.score >= 0.35
          ? best.label
          : 'neutral'
        : best.label;

  const confidence =
    label === 'neutral' && best.score <= 0.2
      ? 0.4
      : Math.min(0.92, 0.4 + best.score * 0.12 + Math.max(0, best.score - second) * 0.2);

  const sentiment = analyzeSpeechSentiment(text);
  const tone = analyzeSpeechTone(text, label);

  return {
    label,
    confidence: Number(confidence.toFixed(3)),
    scores: ranked,
    signals,
    audioAdjusted,
    sentiment,
    tone,
    note: audioAdjusted
      ? 'Text cue emotion + soft audio energy/ZCR proxies with lexicon sentiment/tone — not trained SER or NIST emotion science.'
      : 'Text cue emotion buckets with lexicon sentiment/tone — not acoustic SER. Provide audio for soft energy proxies.',
  };
}
