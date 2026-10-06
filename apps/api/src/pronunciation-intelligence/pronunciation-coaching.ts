export type CoachingTip = {
  id: string;
  severity: 'info' | 'practice' | 'focus';
  message: string;
};

const LANG_TIPS: Record<string, CoachingTip[]> = {
  en: [
    {
      id: 'en-schwa',
      severity: 'info',
      message: 'Reduce unstressed vowels toward schwa /ə/ in connected speech (about, sofa).',
    },
    {
      id: 'en-th',
      severity: 'practice',
      message: 'Keep tongue between teeth for /θ/ and /ð/ in think / this — avoid /s/ or /d/ substitutions.',
    },
    {
      id: 'en-final',
      severity: 'practice',
      message: 'Release final consonants clearly (walked, cats) so endings stay audible.',
    },
  ],
  sw: [
    {
      id: 'sw-penult',
      severity: 'focus',
      message: 'Place primary stress on the penultimate syllable (kiSWáhili, naKÚja).',
    },
    {
      id: 'sw-vowels',
      severity: 'practice',
      message: 'Keep the five Kiswahili vowels pure — avoid English diphthong glides.',
    },
  ],
  yo: [
    {
      id: 'yo-tone',
      severity: 'focus',
      message: 'Tone changes meaning in Yorùbá — practice high/mid/low contours with a native model.',
    },
  ],
  fr: [
    {
      id: 'fr-liaison',
      severity: 'practice',
      message: 'Link final consonants into following vowels (les‿amis) for fluent French rhythm.',
    },
  ],
};

export function coachingTips(input: {
  language: string;
  substitutions: string[];
  deletions: string[];
  insertions: string[];
  overall: number;
}): CoachingTip[] {
  const lang = input.language.toLowerCase.slice(0, 2);
  const tips: CoachingTip[] = [...(LANG_TIPS[lang] ?? LANG_TIPS.en!).slice(0, 2)];

  if (input.substitutions.length) {
    const sample = input.substitutions.slice(0, 3).join(', ');
    tips.push({
      id: 'mismatch-sub',
      severity: 'focus',
      message: `Practice substitutions heard as different words: ${sample}. Slow down and exaggerate target vowels.`,
    });
  }
  if (input.deletions.length) {
    tips.push({
      id: 'mismatch-del',
      severity: 'focus',
      message: `Missing words/syllables detected (${input.deletions.slice(0, 3).join(', ')}). Aim for complete articulation.`,
    });
  }
  if (input.insertions.length) {
    tips.push({
      id: 'mismatch-ins',
      severity: 'practice',
      message: 'Extra words appeared in the transcript — reduce fillers and stay on the reference phrase.',
    });
  }
  if (input.overall >= 85) {
    tips.push({
      id: 'strong',
      severity: 'info',
      message: 'Strong match — try a longer sentence or faster connected speech next.',
    });
  } else if (input.overall < 55) {
    tips.push({
      id: 'retry',
      severity: 'focus',
      message: 'Low match — speak closer to the mic, use a quiet room, and repeat the reference slowly.',
    });
  }

  tips.push({
    id: 'accent-crosslink',
    severity: 'info',
    message:
      'For spoken accent profile cues, use Accent Intelligence (`/accent-intelligence`) — separate from this score.',
  });

  return tips;
}
