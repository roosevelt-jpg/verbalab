/** Normalize tokens for pronunciation alignment (VL-156). */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9'\s-]/gi, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export type WordAlignment = {
  reference: string | null;
  hypothesis: string | null;
  status: 'correct' | 'substitution' | 'deletion' | 'insertion';
};

/** Needleman–Wunsch-style word alignment (simple Levenshtein backtrace). */
export function alignWords(reference: string[], hypothesis: string[]): WordAlignment[] {
  const n = reference.length;
  const m = hypothesis.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i]![0] = i;
  for (let j = 0; j <= m; j++) dp[0]![j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = reference[i - 1] === hypothesis[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        (dp[i - 1]![j - 1] ?? 0) + cost,
        (dp[i - 1]![j] ?? 0) + 1,
        (dp[i]![j - 1] ?? 0) + 1,
      );
    }
  }

  const out: WordAlignment[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && reference[i - 1] === hypothesis[j - 1]) {
      out.push({ reference: reference[i - 1]!, hypothesis: hypothesis[j - 1]!, status: 'correct' });
      i -= 1;
      j -= 1;
    } else if (
      i > 0 &&
      j > 0 &&
      (dp[i]![j] ?? 0) === (dp[i - 1]![j - 1] ?? 0) + 1
    ) {
      out.push({
        reference: reference[i - 1]!,
        hypothesis: hypothesis[j - 1]!,
        status: 'substitution',
      });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || (dp[i]![j] ?? 0) === (dp[i]![j - 1] ?? 0) + 1)) {
      out.push({ reference: null, hypothesis: hypothesis[j - 1]!, status: 'insertion' });
      j -= 1;
    } else {
      out.push({ reference: reference[i - 1]!, hypothesis: null, status: 'deletion' });
      i -= 1;
    }
  }
  return out.reverse();
}

export type PronunciationScores = {
  overall: number;
  accuracy: number;
  fluency: number;
  stress: number;
  wordErrorRate: number;
  correctWords: number;
  referenceWords: number;
};

export function scoreFromAlignment(
  alignment: WordAlignment[],
  fluencyScore: number,
  stressScore: number,
): PronunciationScores {
  const refSlots = alignment.filter((a) => a.reference !== null);
  const correct = alignment.filter((a) => a.status === 'correct').length;
  const errors = alignment.filter((a) => a.status !== 'correct').length;
  const referenceWords = Math.max(1, refSlots.length);
  const wer = Math.min(1, errors / referenceWords);
  const accuracy = Number((Math.max(0, 1 - wer) * 100).toFixed(1));
  const fluency = Number(Math.max(0, Math.min(100, fluencyScore)).toFixed(1));
  const stress = Number(Math.max(0, Math.min(100, stressScore)).toFixed(1));
  const overall = Number((accuracy * 0.55 + fluency * 0.25 + stress * 0.2).toFixed(1));
  return {
    overall,
    accuracy,
    fluency,
    stress,
    wordErrorRate: Number(wer.toFixed(3)),
    correctWords: correct,
    referenceWords: refSlots.length,
  };
}

/** Fluency 0–100 from speaking rate (wps) and silence ratio. */
export function fluencyFromMetrics(input: {
  wordsPerSecond: number;
  silenceRatio: number;
  durationSeconds: number;
}): number {
  // Target ~2.0–3.5 wps for clear learner speech
  const rate = input.wordsPerSecond;
  let rateScore = 70;
  if (rate >= 1.5 && rate <= 4.0) rateScore = 95;
  else if (rate >= 1.0 && rate < 1.5) rateScore = 80;
  else if (rate > 4.0 && rate <= 5.5) rateScore = 75;
  else if (rate > 0) rateScore = 55;
  else rateScore = 40;

  const silencePenalty = Math.min(40, input.silenceRatio * 60);
  const durationBonus = input.durationSeconds >= 0.4 ? 5 : 0;
  return Math.max(0, Math.min(100, rateScore - silencePenalty + durationBonus));
}
