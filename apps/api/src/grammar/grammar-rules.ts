export type GrammarIssueType =
  | 'spelling'
  | 'grammar'
  | 'punctuation'
  | 'spacing'
  | 'capitalization'
  | 'style'
  | 'other';

export type GrammarIssueSeverity = 'error' | 'warning' | 'suggestion';

export type GrammarIssue = {
  type: GrammarIssueType;
  severity: GrammarIssueSeverity;
  message: string;
  original?: string;
  suggestion?: string;
  offset?: number;
  length?: number;
};

/** Small high-signal English misspellings — not a dictionary product. */
const COMMON_MISSPELLINGS: Record<string, string> = {
  teh: 'the',
  adn: 'and',
  recieve: 'receive',
  seperate: 'separate',
  definately: 'definitely',
  occured: 'occurred',
  untill: 'until',
  wierd: 'weird',
  lenght: 'length',
  gramatical: 'grammatical',
  accomodate: 'accommodate',
  begining: 'beginning',
  enviroment: 'environment',
  goverment: 'government',
  neccessary: 'necessary',
  publically: 'publicly',
  sucess: 'success',
  writting: 'writing',
};

export function listCommonMisspellings(): Record<string, string> {
  return { ...COMMON_MISSPELLINGS };
}

/** Spell-only pass. */
export function applySpellRules(text: string): {
  corrected: string;
  issues: GrammarIssue[];
} {
  const issues: GrammarIssue[] = [];
  let corrected = text;
  for (const [wrong, right] of Object.entries(COMMON_MISSPELLINGS)) {
    const re = new RegExp(`\\b${wrong}\\b`, 'gi');
    for (const match of collectMatches(corrected, re)) {
      const original = match[0];
      const suggestion =
        original[0] === original[0]!.toUpperCase() && original[0] !== original[0]!.toLowerCase()
          ? right.charAt(0).toUpperCase() + right.slice(1)
          : right;
      issues.push({
        type: 'spelling',
        severity: 'error',
        message: `Possible misspelling of "${suggestion}".`,
        original,
        suggestion,
        offset: match.index,
        length: original.length,
      });
    }
    corrected = corrected.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), (m) =>
      m[0] === m[0]!.toUpperCase() && m[0] !== m[0]!.toLowerCase()
        ? right.charAt(0).toUpperCase() + right.slice(1)
        : right,
    );
  }
  return { corrected: corrected.trimEnd(), issues };
}

const SUBJECT_VERB: Array<{ pattern: RegExp; message: string; replacement: string }> = [
  {
    pattern: /\bI has\b/gi,
    message: 'Subject–verb agreement: use "I have".',
    replacement: 'I have',
  },
  {
    pattern: /\bhe don't\b/gi,
    message: 'Subject–verb agreement: use "he doesn\'t".',
    replacement: "he doesn't",
  },
  {
    pattern: /\bshe don't\b/gi,
    message: 'Subject–verb agreement: use "she doesn\'t".',
    replacement: "she doesn't",
  },
  {
    pattern: /\bthey was\b/gi,
    message: 'Subject–verb agreement: use "they were".',
    replacement: 'they were',
  },
];

function collectMatches(text: string, re: RegExp): RegExpExecArray[] {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const global = new RegExp(re.source, flags);
  const out: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = global.exec(text)) !== null) {
    out.push(match);
    if (match[0].length === 0) global.lastIndex += 1;
  }
  return out;
}

/**
 * Deterministic grammar/spelling heuristics.
 * English-leaning; not a full grammar engine.
 */
export function applyGrammarRules(text: string): {
  corrected: string;
  issues: GrammarIssue[];
} {
  const issues: GrammarIssue[] = [];
  let corrected = text;

  for (const match of collectMatches(corrected, / {2,}/g)) {
    issues.push({
      type: 'spacing',
      severity: 'warning',
      message: 'Multiple consecutive spaces.',
      original: match[0],
      suggestion: ' ',
      offset: match.index,
      length: match[0].length,
    });
  }
  corrected = corrected.replace(/ {2,}/g, ' ');

  for (const match of collectMatches(corrected, /\b([A-Za-zÀ-ÿ']+)\s+\1\b/gi)) {
    issues.push({
      type: 'grammar',
      severity: 'warning',
      message: `Repeated word "${match[1]}".`,
      original: match[0],
      suggestion: match[1],
      offset: match.index,
      length: match[0].length,
    });
  }
  corrected = corrected.replace(/\b([A-Za-zÀ-ÿ']+)\s+\1\b/gi, '$1');

  for (const [wrong, right] of Object.entries(COMMON_MISSPELLINGS)) {
    const re = new RegExp(`\\b${wrong}\\b`, 'gi');
    for (const match of collectMatches(corrected, re)) {
      const original = match[0];
      const suggestion =
        original[0] === original[0]!.toUpperCase() && original[0] !== original[0]!.toLowerCase()
          ? right.charAt(0).toUpperCase() + right.slice(1)
          : right;
      issues.push({
        type: 'spelling',
        severity: 'error',
        message: `Possible misspelling of "${suggestion}".`,
        original,
        suggestion,
        offset: match.index,
        length: original.length,
      });
    }
    corrected = corrected.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), (m) =>
      m[0] === m[0]!.toUpperCase() && m[0] !== m[0]!.toLowerCase()
        ? right.charAt(0).toUpperCase() + right.slice(1)
        : right,
    );
  }

  for (const match of collectMatches(corrected, /\bi\b/g)) {
    issues.push({
      type: 'capitalization',
      severity: 'error',
      message: 'Capitalize the pronoun "I".',
      original: 'i',
      suggestion: 'I',
      offset: match.index,
      length: 1,
    });
  }
  corrected = corrected.replace(/\bi\b/g, 'I');

  for (const rule of SUBJECT_VERB) {
    for (const match of collectMatches(corrected, rule.pattern)) {
      issues.push({
        type: 'grammar',
        severity: 'error',
        message: rule.message,
        original: match[0],
        suggestion: rule.replacement,
        offset: match.index,
        length: match[0].length,
      });
    }
    corrected = corrected.replace(new RegExp(rule.pattern.source, rule.pattern.flags), rule.replacement);
  }

  const trimmed = corrected.trim();
  if (trimmed.length > 20 && !/[.!?…]"?$/.test(trimmed)) {
    issues.push({
      type: 'punctuation',
      severity: 'suggestion',
      message: 'Consider ending the text with terminal punctuation.',
      suggestion: `${trimmed}.`,
    });
  }

  return { corrected: corrected.trimEnd(), issues };
}
