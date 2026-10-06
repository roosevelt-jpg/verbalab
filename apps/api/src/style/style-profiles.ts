export type StyleProfileId =
  | 'formal'
  | 'professional'
  | 'casual'
  | 'concise'
  | 'academic'
  | 'plain'
  | 'business'
  | 'marketing'
  | 'technical'
  | 'medical'
  | 'legal'
  | 'government';

export type StyleProfile = {
  id: StyleProfileId;
  name: string;
  description: string;
  domain?: 'general' | 'medical' | 'legal' | 'government' | 'marketing' | 'technical' | 'business';
  disclaimer?: string;
};

export const STYLE_PROFILES: StyleProfile[] = [
  {
    id: 'formal',
    name: 'Formal',
    description: 'High-formality register; expands informal wording and contractions.',
    domain: 'general',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clear business tone; expands informal contractions.',
    domain: 'general',
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Relaxed wording; light informal markers allowed.',
    domain: 'general',
  },
  {
    id: 'concise',
    name: 'Concise',
    description: 'Removes filler words and compresses spacing.',
    domain: 'general',
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'More formal register; expands contractions.',
    domain: 'general',
  },
  {
    id: 'plain',
    name: 'Plain language',
    description: 'Simpler wording; reduces jargon hedges.',
    domain: 'general',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Workplace clarity; expands informalisms and ASAP-style shorthand.',
    domain: 'business',
  },
  {
    id: 'marketing',
    name: 'Marketing (tone)',
    description: 'Clear persuasive tone. Not a campaign or copywriting product.',
    domain: 'marketing',
    disclaimer:
      'Tone assistance only — not campaign strategy, brand voice cloning, or advertising compliance review.',
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Precise engineering-adjacent wording; reduces vague nouns.',
    domain: 'technical',
  },
  {
    id: 'medical',
    name: 'Medical (tone)',
    description: 'Clear, precise clinical-adjacent tone. Not medical advice.',
    domain: 'medical',
    disclaimer:
      'Tone assistance only — not clinical documentation, diagnosis, or medical advice. Not certified for regulated health records.',
  },
  {
    id: 'legal',
    name: 'Legal (tone)',
    description: 'Formal, precise wording. Not legal advice.',
    domain: 'legal',
    disclaimer:
      'Tone assistance only — not legal advice, contract drafting, or attorney work product.',
  },
  {
    id: 'government',
    name: 'Government (plain formal)',
    description: 'Plain formal public-sector tone.',
    domain: 'government',
    disclaimer:
      'Tone assistance only — not policy approval, compliance certification, or official government publication standards.',
  },
];

export function isStyleProfileId(value: string): value is StyleProfileId {
  return STYLE_PROFILES.some((p) => p.id === value);
}

export type StyleChange = {
  type: 'formality' | 'filler' | 'contraction' | 'spacing' | 'domain' | 'other';
  message: string;
  original?: string;
  suggestion?: string;
};

export type ToneSignal = {
  tone: StyleProfileId;
  weight: number;
  cue: string;
};

export type ToneDetectResult = {
  detectedTone: StyleProfileId;
  confidence: number;
  scores: Record<string, number>;
  signals: ToneSignal[];
  suggestedProfile: StyleProfileId;
  note: string;
};

const FILLERS =
  /\b(really|very|just|basically|actually|literally|kind of|sort of|quite|rather)\b/gi;

const INFORMAL_TO_FORMAL: Array<[RegExp, string]> = [
  [/\bgonna\b/gi, 'going to'],
  [/\bwanna\b/gi, 'want to'],
  [/\bgotta\b/gi, 'have to'],
  [/\bkinda\b/gi, 'kind of'],
  [/\blemma\b/gi, 'let me'],
  [/\bdunno\b/gi, 'do not know'],
  [/\byeah\b/gi, 'yes'],
  [/\bnope\b/gi, 'no'],
];

const CONTRACTIONS_EXPAND: Array<[RegExp, string]> = [
  [/\bdon't\b/gi, 'do not'],
  [/\bcan't\b/gi, 'cannot'],
  [/\bwon't\b/gi, 'will not'],
  [/\bisn't\b/gi, 'is not'],
  [/\baren't\b/gi, 'are not'],
  [/\bwasn't\b/gi, 'was not'],
  [/\bweren't\b/gi, 'were not'],
  [/\bhasn't\b/gi, 'has not'],
  [/\bhaven't\b/gi, 'have not'],
  [/\bhadn't\b/gi, 'had not'],
  [/\bI'm\b/g, 'I am'],
  [/\bit's\b/gi, 'it is'],
  [/\bwe're\b/gi, 'we are'],
  [/\bthey're\b/gi, 'they are'],
  [/\byou're\b/gi, 'you are'],
  [/\bthat's\b/gi, 'that is'],
];

const MEDICAL_SWAPS: Array<[RegExp, string]> = [
  [/\bbad\b/gi, 'adverse'],
  [/\bcheck up\b/gi, 'follow-up'],
  [/\bcheckup\b/gi, 'follow-up'],
];

const LEGAL_SWAPS: Array<[RegExp, string]> = [
  [/\bget\b/gi, 'obtain'],
  [/\bstart\b/gi, 'commence'],
  [/\bend\b/gi, 'terminate'],
];

const GOVERNMENT_SWAPS: Array<[RegExp, string]> = [
  [/\bfolks\b/gi, 'residents'],
  [/\bguys\b/gi, 'participants'],
  [/\bstuff\b/gi, 'materials'],
];

const BUSINESS_SWAPS: Array<[RegExp, string]> = [
  [/\bASAP\b/g, 'as soon as possible'],
  [/\bEOD\b/g, 'end of day'],
  [/\bfyi\b/gi, 'for your information'],
];

const MARKETING_SWAPS: Array<[RegExp, string]> = [
  [/\bbuy now\b/gi, 'get started'],
  [/\bcheap\b/gi, 'affordable'],
  [/\bfree\b/gi, 'complimentary'],
];

const TECHNICAL_SWAPS: Array<[RegExp, string]> = [
  [/\bthing\b/gi, 'component'],
  [/\bstuff\b/gi, 'data'],
  [/\bbug\b/gi, 'defect'],
];

function applyPairs(
  text: string,
  pairs: Array<[RegExp, string]>,
  type: StyleChange['type'],
  message: string,
  changes: StyleChange[],
): string {
  let out = text;
  for (const [re, replacement] of pairs) {
    const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    out = out.replace(global, (match) => {
      changes.push({ type, message, original: match, suggestion: replacement });
      return replacement;
    });
  }
  return out;
}

function countMatches(text: string, re: RegExp): number {
  const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  return [...text.matchAll(global)].length;
}

/**
 * Heuristic tone detection (VL-143). Cue scoring — not a trained classifier.
 */
export function detectTone(text: string): ToneDetectResult {
  const scores: Record<StyleProfileId, number> = {
    formal: 0,
    professional: 0,
    casual: 0,
    concise: 0,
    academic: 0,
    plain: 0,
    business: 0,
    marketing: 0,
    technical: 0,
    medical: 0,
    legal: 0,
    government: 0,
  };
  const signals: ToneSignal[] = [];

  const add = (tone: StyleProfileId, weight: number, cue: string) => {
    scores[tone] += weight;
    signals.push({ tone, weight, cue });
  };

  if (countMatches(text, /\b(gonna|wanna|gotta|yeah|nope|kinda)\b/i) > 0) {
    add('casual', 3, 'informal slang');
  }
  if (countMatches(text, /\b\w+n't\b|\bI'm\b|\bit's\b|\byou're\b/i) > 0) {
    add('casual', 2, 'contractions');
  }
  if (countMatches(text, FILLERS) > 0) {
    add('casual', 1, 'filler words');
    add('concise', 1, 'filler density suggests concision opportunity');
  }
  if (countMatches(text, /\b(therefore|moreover|thus|hypothesis|methodology)\b/i) > 0) {
    add('academic', 3, 'academic discourse markers');
    add('formal', 2, 'formal discourse');
  }
  if (countMatches(text, /\b(pursuant|hereinafter|shall|hereby|indemnify)\b/i) > 0) {
    add('legal', 4, 'legal phrasing');
    add('formal', 2, 'formal register');
  }
  if (countMatches(text, /\b(patient|diagnosis|dosage|clinical|symptom)\b/i) > 0) {
    add('medical', 4, 'clinical vocabulary');
  }
  if (countMatches(text, /\b(residents|constituents|agency|regulation|public sector)\b/i) > 0) {
    add('government', 3, 'public-sector vocabulary');
  }
  if (countMatches(text, /\b(ASAP|EOD|synergy|stakeholder|deliverable|KPI)\b/i) > 0) {
    add('business', 3, 'business shorthand/jargon');
    add('professional', 2, 'workplace register');
  }
  if (countMatches(text, /\b(buy now|limited time|unlock|convert|cta|campaign)\b/i) > 0) {
    add('marketing', 4, 'marketing cues');
  }
  if (countMatches(text, /\b(API|latency|throughput|refactor|deploy|endpoint|schema)\b/i) > 0) {
    add('technical', 4, 'technical vocabulary');
  }
  if (countMatches(text, /\b(please|kindly|regard|sincerely)\b/i) > 0) {
    add('professional', 2, 'courtesy markers');
    add('formal', 1, 'formal courtesy');
  }

  const ranked = (Object.entries(scores) as Array<[StyleProfileId, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  const top = ranked[0]!;
  const second = ranked[1]?.[1] ?? 0;
  const detectedTone = top[1] > 0 ? top[0] : 'plain';
  const confidence =
    top[1] <= 0 ? 0.35 : Math.min(0.95, 0.45 + (top[1] - second) * 0.08 + top[1] * 0.04);

  return {
    detectedTone,
    confidence: Number(confidence.toFixed(3)),
    scores,
    signals: signals.slice(0, 24),
    suggestedProfile: detectedTone,
    note: 'Heuristic cue scoring (VL-143) — not a trained tone classifier or author-style model.',
  };
}

/**
 * Deterministic style transforms (VL-134 / VL-142 / VL-143). English-leaning; not a style OS.
 */
export function applyStyleRules(
  text: string,
  profile: StyleProfileId,
): { rewritten: string; changes: StyleChange[] } {
  const changes: StyleChange[] = [];
  let rewritten = text.replace(/ {2,}/g, ' ').trim();

  const formalBase =
    profile === 'formal' ||
    profile === 'professional' ||
    profile === 'academic' ||
    profile === 'plain' ||
    profile === 'business' ||
    profile === 'technical' ||
    profile === 'medical' ||
    profile === 'legal' ||
    profile === 'government';

  if (
    profile === 'concise' ||
    profile === 'plain' ||
    profile === 'government' ||
    profile === 'business' ||
    profile === 'technical'
  ) {
    rewritten = rewritten.replace(FILLERS, (match) => {
      changes.push({
        type: 'filler',
        message: 'Removed filler word for concision.',
        original: match,
        suggestion: '',
      });
      return '';
    });
    rewritten = rewritten.replace(/ {2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
  }

  if (formalBase) {
    rewritten = applyPairs(
      rewritten,
      INFORMAL_TO_FORMAL,
      'formality',
      'Replaced informal wording.',
      changes,
    );
  }

  if (
    profile === 'formal' ||
    profile === 'professional' ||
    profile === 'academic' ||
    profile === 'business' ||
    profile === 'technical' ||
    profile === 'medical' ||
    profile === 'legal' ||
    profile === 'government'
  ) {
    rewritten = applyPairs(
      rewritten,
      CONTRACTIONS_EXPAND,
      'contraction',
      'Expanded contraction for a more formal register.',
      changes,
    );
  }

  if (profile === 'business') {
    rewritten = applyPairs(rewritten, BUSINESS_SWAPS, 'domain', 'Business wording preference.', changes);
  }
  if (profile === 'marketing') {
    rewritten = applyPairs(
      rewritten,
      INFORMAL_TO_FORMAL,
      'formality',
      'Normalized informal wording for clearer marketing copy.',
      changes,
    );
    rewritten = applyPairs(rewritten, MARKETING_SWAPS, 'domain', 'Marketing-tone wording preference.', changes);
  }
  if (profile === 'technical') {
    rewritten = applyPairs(
      rewritten,
      TECHNICAL_SWAPS,
      'domain',
      'Technical wording preference.',
      changes,
    );
  }
  if (profile === 'medical') {
    rewritten = applyPairs(rewritten, MEDICAL_SWAPS, 'domain', 'Medical-tone wording preference.', changes);
  }
  if (profile === 'legal') {
    rewritten = applyPairs(rewritten, LEGAL_SWAPS, 'domain', 'Legal-tone wording preference.', changes);
  }
  if (profile === 'government') {
    rewritten = applyPairs(
      rewritten,
      GOVERNMENT_SWAPS,
      'domain',
      'Government plain-language preference.',
      changes,
    );
  }

  if (profile === 'casual') {
    if (text !== rewritten) {
      changes.push({
        type: 'spacing',
        message: 'Normalized spacing.',
      });
    }
  }

  rewritten = rewritten.replace(/ {2,}/g, ' ').trim();
  return { rewritten, changes };
}
