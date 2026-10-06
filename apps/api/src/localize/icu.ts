/**
 * Protect ICU placeholders / plural blocks so MT does not corrupt them.
 * Restores after translation. Also validates/formats for Localization Platform (VL-141).
 */

const ICU_BLOCK =
  /\{[^{}]+,\s*(?:plural|select|selectordinal)\s*,(?:[^{}]|\{[^{}]*\})*\}/g;
const ICU_VAR = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/g;

export function protectIcu(text: string): { text: string; slots: string[] } {
  const slots: string[] = [];
  let out = text.replace(ICU_BLOCK, (match) => {
    const i = slots.length;
    slots.push(match);
    return `⟦ICU${i}⟧`;
  });
  out = out.replace(ICU_VAR, (match) => {
    const i = slots.length;
    slots.push(match);
    return `⟦ICU${i}⟧`;
  });
  return { text: out, slots };
}

export function restoreIcu(text: string, slots: string[]): string {
  let out = text;
  for (let i = 0; i < slots.length; i++) {
    out = out.split(`⟦ICU${i}⟧`).join(slots[i]!);
  }
  return out;
}

export function extractIcuPlaceholders(message: string): string[] {
  const names = new Set<string>();
  for (const m of message.matchAll(ICU_BLOCK)) {
    const head = m[0].match(/^\{([a-zA-Z_][a-zA-Z0-9_]*)\s*,/);
    if (head?.[1]) names.add(head[1]);
  }
  for (const m of message.matchAll(ICU_VAR)) {
    names.add(m[0].slice(1, -1));
  }
  return [...names].sort();
}

export type IcuIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
};

export function validateIcuMessage(message: string): {
  valid: boolean;
  issues: IcuIssue[];
  placeholders: string[];
  hasPlural: boolean;
  hasSelect: boolean;
} {
  const issues: IcuIssue[] = [];
  let depth = 0;
  for (let i = 0; i < message.length; i++) {
    const ch = message[i]!;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth < 0) {
        issues.push({
          code: 'unbalanced_brace',
          message: 'Unmatched closing brace',
          severity: 'error',
        });
        depth = 0;
      }
    }
  }
  if (depth !== 0) {
    issues.push({
      code: 'unbalanced_brace',
      message: 'Unbalanced braces in ICU message',
      severity: 'error',
    });
  }

  const hasPlural = /,\s*plural\s*,/.test(message);
  const hasSelect = /,\s*select(?:ordinal)?\s*,/.test(message);
  if (hasPlural && !/other\s*\{/.test(message)) {
    issues.push({
      code: 'plural_missing_other',
      message: 'Plural/select blocks should include an `other` arm',
      severity: 'warning',
    });
  }

  const placeholders = extractIcuPlaceholders(message);
  return {
    valid: !issues.some((i) => i.severity === 'error'),
    issues,
    placeholders,
    hasPlural,
    hasSelect,
  };
}

/** Lightweight ICU format: simple vars + Intl.PluralRules for plural blocks. */
export function formatIcuMessage(
  message: string,
  values: Record<string, string | number>,
  locale = 'en',
): string {
  let out = message.replace(ICU_BLOCK, (block) => {
    const match = block.match(
      /^\{([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*(plural|select|selectordinal)\s*,([\s\S]*)\}$/,
    );
    if (!match) return block;
    const [, name, kind, body] = match;
    const raw = values[name!];
    if (kind === 'plural' || kind === 'selectordinal') {
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (Number.isNaN(n)) return block;
      const rules = new Intl.PluralRules(locale, {
        type: kind === 'selectordinal' ? 'ordinal' : 'cardinal',
      });
      const category = rules.select(n);
      const arm = pickPluralArm(body!, category) ?? pickPluralArm(body!, 'other');
      return (arm ?? block).replace(/#/g, String(n));
    }
    // select
    const key = String(raw ?? 'other');
    const arm = pickSelectArm(body!, key) ?? pickSelectArm(body!, 'other');
    return arm ?? block;
  });

  out = out.replace(ICU_VAR, (token) => {
    const name = token.slice(1, -1);
    if (!(name in values)) return token;
    return String(values[name]);
  });
  return out;
}

function pickPluralArm(body: string, category: string): string | null {
  const re = new RegExp(`${category}\\s*\\{([^{}]*)\\}`);
  const m = body.match(re);
  return m?.[1] ?? null;
}

function pickSelectArm(body: string, key: string): string | null {
  const safe = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${safe}\\s*\\{([^{}]*)\\}`);
  const m = body.match(re);
  return m?.[1] ?? null;
}
