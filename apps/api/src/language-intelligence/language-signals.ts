export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'mixed';

export type EmotionLabel =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'disgust'
  | 'neutral';

export type IntentLabel =
  | 'question'
  | 'request'
  | 'complaint'
  | 'greeting'
  | 'thanks'
  | 'translate'
  | 'inform'
  | 'other';

const POSITIVE =
  /\b(good|great|excellent|amazing|love|happy|thanks|thank you|awesome|wonderful|pleased|delighted)\b/gi;
const NEGATIVE =
  /\b(bad|terrible|awful|hate|angry|upset|worst|horrible|disappointed|frustrated|broken|fail)\b/gi;

const EMOTION_CUES: Array<{ label: EmotionLabel; re: RegExp; weight: number }> = [
  { label: 'joy', re: /\b(happy|joy|delighted|excited|love|wonderful|glad)\b/gi, weight: 2 },
  { label: 'sadness', re: /\b(sad|unhappy|depressed|miserable|cry|grief)\b/gi, weight: 2 },
  { label: 'anger', re: /\b(angry|furious|rage|hate|outraged|annoyed)\b/gi, weight: 2 },
  { label: 'fear', re: /\b(afraid|scared|fear|worried|anxious|terrified)\b/gi, weight: 2 },
  { label: 'surprise', re: /\b(surprised|shock|unexpected|wow|amazed)\b/gi, weight: 2 },
  { label: 'disgust', re: /\b(disgust|gross|revolting|nasty)\b/gi, weight: 2 },
];

function countMatches(text: string, re: RegExp): number {
  const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  return [...text.matchAll(global)].length;
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Lexicon polarity — not a trained sentiment model. */
export function analyzeSentiment(text: string) {
  const pos = countMatches(text, POSITIVE);
  const neg = countMatches(text, NEGATIVE);
  let label: SentimentLabel = 'neutral';
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
    note: 'Lexicon polarity scoring — not a production sentiment suite.',
  };
}

/** Text emotion buckets — not voice emotion recognition. */
export function analyzeEmotion(text: string) {
  const scores: Record<EmotionLabel, number> = {
    joy: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    surprise: 0,
    disgust: 0,
    neutral: 0.5,
  };
  const signals: Array<{ label: EmotionLabel; cue: string; weight: number }> = [];

  for (const row of EMOTION_CUES) {
    const n = countMatches(text, row.re);
    if (n > 0) {
      scores[row.label] += n * row.weight;
      scores.neutral = 0;
      signals.push({ label: row.label, cue: row.re.source, weight: n * row.weight });
    }
  }

  const ranked = (Object.entries(scores) as Array<[EmotionLabel, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  const top = ranked[0]!;
  const label = top[1] > 0.5 ? top[0] : 'neutral';
  const confidence =
    label === 'neutral' && top[1] <= 0.5
      ? 0.4
      : Math.min(0.88, 0.4 + top[1] * 0.1);

  return {
    label,
    scores,
    signals: signals.slice(0, 12),
    confidence: Number(confidence.toFixed(3)),
    note: 'Text cue emotion buckets — not acoustic emotion recognition.',
  };
}

/** Keyword/heuristic intents — not a trained NLU model. */
export function analyzeIntent(text: string) {
  const t = text.trim();
  const scores: Record<IntentLabel, number> = {
    question: 0,
    request: 0,
    complaint: 0,
    greeting: 0,
    thanks: 0,
    translate: 0,
    inform: 0,
    other: 0.2,
  };

  if (/\?/.test(t) || /^(who|what|when|where|why|how|is|are|can|do|does)\b/i.test(t)) {
    scores.question += 3;
  }
  if (/\b(please|could you|can you|would you|need you to)\b/i.test(t)) scores.request += 3;
  if (/\b(complaint|refund|broken|not working|issue|problem|bug)\b/i.test(t)) scores.complaint += 3;
  if (/\b(hi|hello|hey|good morning|good afternoon)\b/i.test(t)) scores.greeting += 3;
  if (/\b(thanks|thank you|thx|appreciate)\b/i.test(t)) scores.thanks += 3;
  if (/\b(translate|translation|into\s+\w+|from\s+\w+\s+to)\b/i.test(t)) scores.translate += 3;
  if (t.length > 40 && !/\?/.test(t)) scores.inform += 1.5;

  const ranked = (Object.entries(scores) as Array<[IntentLabel, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  const top = ranked[0]!;
  const label = top[1] >= 1 ? top[0] : 'other';
  const confidence = Number(Math.min(0.9, 0.4 + top[1] * 0.1).toFixed(3));

  return {
    label,
    scores,
    confidence,
    note: 'Heuristic intent labels — not a trained NLU/dialog model.',
  };
}

/** Flesch-like English readability heuristic. */
export function analyzeReadability(text: string) {
  const words = tokenizeWords(text);
  const sentences = splitSentences(text);
  const wordCount = Math.max(1, words.length);
  const sentenceCount = Math.max(1, sentences.length);
  const syllableCount = Math.max(1, words.reduce((sum, w) => sum + estimateSyllables(w), 0));

  const flesch =
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
  const score = Number(Math.max(0, Math.min(100, flesch)).toFixed(1));

  let level = 'college';
  if (score >= 90) level = 'very_easy';
  else if (score >= 80) level = 'easy';
  else if (score >= 70) level = 'fairly_easy';
  else if (score >= 60) level = 'standard';
  else if (score >= 50) level = 'fairly_difficult';
  else if (score >= 30) level = 'difficult';

  return {
    score,
    level,
    words: wordCount,
    sentences: sentenceCount,
    syllables: syllableCount,
    note: 'English-leaning Flesch-like heuristic — not a certified readability product.',
  };
}

/** Lexical/syntactic density complexity. */
export function analyzeComplexity(text: string) {
  const words = tokenizeWords(text);
  const sentences = splitSentences(text);
  const wordCount = Math.max(1, words.length);
  const unique = new Set(words).size;
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / wordCount;
  const longWords = words.filter((w) => w.length >= 8).length;
  const avgSentenceLen = wordCount / Math.max(1, sentences.length);

  const density = unique / wordCount;
  const raw =
    density * 35 +
    Math.min(25, avgWordLen * 3) +
    Math.min(20, (longWords / wordCount) * 40) +
    Math.min(20, avgSentenceLen);

  const score = Number(Math.max(0, Math.min(100, raw)).toFixed(1));
  let level: 'low' | 'medium' | 'high' = 'medium';
  if (score < 35) level = 'low';
  else if (score >= 65) level = 'high';

  return {
    score,
    level,
    lexicalDiversity: Number(density.toFixed(3)),
    averageWordLength: Number(avgWordLen.toFixed(2)),
    averageSentenceLength: Number(avgSentenceLen.toFixed(2)),
    longWordRatio: Number((longWords / wordCount).toFixed(3)),
    note: 'Lexical/syntactic density heuristic — not a linguistics complexity suite.',
  };
}

/**
 * Speech confidence from transcript heuristics (+ optional client STT score).
 * Whisper path has no native confidence.
 */
export function analyzeSpeechConfidence(input: {
  transcript: string;
  durationSeconds?: number;
  sttConfidence?: number;
}) {
  const text = input.transcript.trim();
  const words = tokenizeWords(text);
  const reasons: string[] = [];
  let score = 75;

  if (typeof input.sttConfidence === 'number' && Number.isFinite(input.sttConfidence)) {
    const c = Math.max(0, Math.min(1, input.sttConfidence));
    score = Math.round(c * 100);
    reasons.push('client_stt_confidence');
  } else {
    if (words.length < 3) {
      score -= 25;
      reasons.push('very_short_transcript');
    }
    if (countMatches(text, /\b(um+|uh+|er+|hmm+)\b/gi) > 0) {
      score -= 10;
      reasons.push('hesitation_markers');
    }
    if (/\[[^\]]+\]|\([^)]+\)/.test(text)) {
      score -= 8;
      reasons.push('annotation_brackets');
    }
    if (input.durationSeconds && input.durationSeconds > 0 && words.length > 0) {
      const wps = words.length / input.durationSeconds;
      if (wps < 0.5 || wps > 5) {
        score -= 12;
        reasons.push('unusual_speech_rate');
      }
    }
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    confidence: Number((score / 100).toFixed(3)),
    reasons,
    provider: 'heuristic',
    note: 'Transcript heuristics (+ optional client STT score). Not acoustic confidence from Whisper.',
  };
}
