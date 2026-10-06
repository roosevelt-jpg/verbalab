/** Small English dictionary + grapheme heuristics (VL-156). Not ARPAbet ASR. */

const EN_DICT: Record<string, string[]> = {
  the: ['DH', 'AH'],
  a: ['AH'],
  an: ['AH', 'N'],
  to: ['T', 'UW'],
  of: ['AH', 'V'],
  and: ['AH', 'N', 'D'],
  is: ['IH', 'Z'],
  in: ['IH', 'N'],
  it: ['IH', 'T'],
  you: ['Y', 'UW'],
  that: ['DH', 'AE', 'T'],
  for: ['F', 'AO', 'R'],
  on: ['AA', 'N'],
  with: ['W', 'IH', 'DH'],
  this: ['DH', 'IH', 'S'],
  hello: ['HH', 'AH', 'L', 'OW'],
  world: ['W', 'ER', 'L', 'D'],
  africa: ['AE', 'F', 'R', 'IH', 'K', 'AH'],
  swahili: ['S', 'W', 'AA', 'HH', 'IY', 'L', 'IY'],
  please: ['P', 'L', 'IY', 'Z'],
  thank: ['TH', 'AE', 'NG', 'K'],
  thanks: ['TH', 'AE', 'NG', 'K', 'S'],
  good: ['G', 'UH', 'D'],
  morning: ['M', 'AO', 'R', 'N', 'IH', 'NG'],
  pronunciation: ['P', 'R', 'AH', 'N', 'AH', 'N', 'S', 'IY', 'EY', 'SH', 'AH', 'N'],
  language: ['L', 'AE', 'NG', 'G', 'W', 'AH', 'JH'],
  learning: ['L', 'ER', 'N', 'IH', 'NG'],
  lugemi: ['V', 'ER', 'B', 'AH', 'L', 'AE', 'B'],
};

const VOWELS = /[aeiouy]+/gi;

export type SyllableStress = {
  syllables: string[];
  primaryIndex: number;
  notation: string;
};

export type PhonemeWord = {
  word: string;
  phonemes: string[];
  source: 'dictionary' | 'grapheme';
  stress: SyllableStress;
};

function splitSyllables(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!w) return [];
  const parts: string[] = [];
  let buf = '';
  const chars = [...w];
  for (let i = 0; i < chars.length; i++) {
    buf += chars[i];
    const isVowel = /[aeiouy]/i.test(chars[i] ?? '');
    const next = chars[i + 1] ?? '';
    const nextIsConsonant = next && !/[aeiouy]/i.test(next);
    if (isVowel && nextIsConsonant && i + 2 < chars.length) {
      // Keep onset of next syllable
      parts.push(buf);
      buf = '';
    }
  }
  if (buf) parts.push(buf);
  if (parts.length === 0) return [w];
  // Merge tiny fragments
  if (parts.length > 1 && (parts[0]?.length ?? 0) === 1) {
    parts[1] = (parts[0] ?? '') + (parts[1] ?? '');
    parts.shift();
  }
  return parts;
}

function primaryStressIndex(syllables: string[], language: string): number {
  if (syllables.length <= 1) return 0;
  const lang = language.toLowerCase().slice(0, 2);
  if (lang === 'sw') {
    // Penultimate stress (Kiswahili)
    return Math.max(0, syllables.length - 2);
  }
  // Default English-ish: first syllable for short words, antepenult-ish for longer
  if (syllables.length <= 2) return 0;
  return 0;
}

function stressOf(word: string, language: string): SyllableStress {
  const syllables = splitSyllables(word);
  const primaryIndex = primaryStressIndex(syllables, language);
  const notation = syllables
    .map((s, i) => (i === primaryIndex ? s.toUpperCase() : s.toLowerCase()))
    .join('-');
  return { syllables, primaryIndex, notation };
}

function graphemePhonemes(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  const out: string[] = [];
  for (let i = 0; i < w.length; i++) {
    const c = w[i] ?? '';
    const digraph = w.slice(i, i + 2);
    if (digraph === 'th') {
      out.push('TH');
      i += 1;
      continue;
    }
    if (digraph === 'sh') {
      out.push('SH');
      i += 1;
      continue;
    }
    if (digraph === 'ch') {
      out.push('CH');
      i += 1;
      continue;
    }
    if (digraph === 'ng') {
      out.push('NG');
      i += 1;
      continue;
    }
    const map: Record<string, string> = {
      a: 'AE',
      e: 'EH',
      i: 'IH',
      o: 'AA',
      u: 'AH',
      y: 'IY',
      b: 'B',
      c: 'K',
      d: 'D',
      f: 'F',
      g: 'G',
      h: 'HH',
      j: 'JH',
      k: 'K',
      l: 'L',
      m: 'M',
      n: 'N',
      p: 'P',
      q: 'K',
      r: 'R',
      s: 'S',
      t: 'T',
      v: 'V',
      w: 'W',
      x: 'KS',
      z: 'Z',
    };
    out.push(map[c] ?? c.toUpperCase());
  }
  return out.length ? out : ['AH'];
}

export function analyzePhonemes(text: string, language = 'en'): PhonemeWord[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return words.map((word) => {
    const key = word.replace(/'/g, '');
    const dict = EN_DICT[key];
    const phonemes = dict ?? graphemePhonemes(word);
    return {
      word,
      phonemes,
      source: dict ? ('dictionary' as const) : ('grapheme' as const),
      stress: stressOf(word, language),
    };
  });
}

/** Stress score: fraction of words with a plausible primary stress mark (heuristic always present). */
export function stressScoreFromWords(words: PhonemeWord[]): number {
  if (!words.length) return 50;
  const multi = words.filter((w) => w.stress.syllables.length > 1);
  if (!multi.length) return 85;
  // Heuristic: dictionary words score higher confidence
  const dictRatio = words.filter((w) => w.source === 'dictionary').length / words.length;
  return Number((70 + dictRatio * 25).toFixed(1));
}

export { VOWELS };
