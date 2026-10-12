import { createHash } from 'crypto';
import {
  PASSPORT_RESOLVER_VERSION,
  type ContextScope,
  type PassportEntryType,
} from './passport.types';
import { contextsCompatible, findPhraseSpans, normalizeSourceForm } from './passport.normalize';
import { entryTypesSupportedForProduct } from './passport.model-sync';

export type ResolvableEntry = {
  entryId: string;
  revision: number;
  type: PassportEntryType | string;
  sourceForm: string;
  languageVariety: string;
  sourceLang?: string | null;
  targetLang?: string | null;
  direction: string;
  approvedValue: unknown;
  context: ContextScope | Record<string, unknown>;
  status: string;
  precedence: 'task_override' | 'project' | 'business' | 'user' | 'shared';
};

export type ResolutionMatch = {
  entryId: string;
  revision: number;
  type: string;
  sourceForm: string;
  spans: Array<{ start: number; end: number; matched: string }>;
  approvedValue: unknown;
  precedence: ResolvableEntry['precedence'];
  adapterAction: string;
};

export type ResolutionConflict = {
  sourceForm: string;
  reason: string;
  candidates: Array<{ entryId: string; revision: number; approvedValue: unknown; precedence: string }>;
};

export type ResolutionPlan = {
  resolverVersion: string;
  outcome: 'applied' | 'clarification_required' | 'skipped' | 'paused';
  matched: ResolutionMatch[];
  conflicts: ResolutionConflict[];
  glossaryTerms: Array<{
    sourceLang: string;
    targetLang: string;
    sourceTerm: string;
    targetTerm: string;
    wholeWord: boolean;
    caseSensitive: boolean;
  }>;
  pronunciationAliases: Array<{ grapheme: string; alias: string; ipa?: string }>;
  unitClarifications: Array<{
    sourceForm: string;
    packageCount: string;
    packageSize: string;
    unit: string;
    product?: string;
  }>;
  asrVocabulary: string[];
  explain: string[];
};

function adapterActionFor(type: string): string {
  switch (type) {
    case 'terminology_meaning':
    case 'approved_translation':
    case 'preferred_name':
      return 'glossary_constraints';
    case 'pronunciation':
      return 'pronunciation_alias';
    case 'local_unit_definition':
      return 'unit_clarification';
    default:
      return 'preference_hint';
  }
}

function directionAllows(entry: ResolvableEntry, sourceLang?: string, targetLang?: string): boolean {
  if (entry.direction === 'bidirectional') return true;
  if (!sourceLang || !targetLang) return true;
  if (entry.direction === 'source_to_target') {
    return (
      (!entry.sourceLang || entry.sourceLang === sourceLang) &&
      (!entry.targetLang || entry.targetLang === targetLang)
    );
  }
  if (entry.direction === 'target_to_source') {
    return (
      (!entry.sourceLang || entry.sourceLang === targetLang) &&
      (!entry.targetLang || entry.targetLang === sourceLang)
    );
  }
  return true;
}

function varietyAllows(entry: ResolvableEntry, languageVariety?: string): boolean {
  if (!languageVariety) return true;
  if (!entry.languageVariety || entry.languageVariety === 'any') return true;
  return entry.languageVariety.toLowerCase() === languageVariety.toLowerCase();
}

export function resolvePassportPlan(input: {
  text: string;
  product: string;
  sourceLang?: string;
  targetLang?: string;
  languageVariety?: string;
  context?: ContextScope;
  personalizationEnabled: boolean;
  entries: ResolvableEntry[];
  taskOverrides?: Array<{ sourceForm: string; approvedValue: unknown }>;
}): ResolutionPlan {
  const explain: string[] = [];
  if (!input.personalizationEnabled) {
    return {
      resolverVersion: PASSPORT_RESOLVER_VERSION,
      outcome: 'paused',
      matched: [],
      conflicts: [],
      glossaryTerms: [],
      pronunciationAliases: [],
      unitClarifications: [],
      asrVocabulary: [],
      explain: ['Personalization paused — Passport memory not applied.'],
    };
  }

  const text = input.text.normalize('NFC');
  if (!text.trim()) {
    return {
      resolverVersion: PASSPORT_RESOLVER_VERSION,
      outcome: 'skipped',
      matched: [],
      conflicts: [],
      glossaryTerms: [],
      pronunciationAliases: [],
      unitClarifications: [],
      asrVocabulary: [],
      explain: ['Empty text — nothing to resolve.'],
    };
  }

  const supported = new Set(entryTypesSupportedForProduct(input.product));
  const overrideForms = new Set(
    (input.taskOverrides ?? []).map((o) => normalizeSourceForm(o.sourceForm).toLocaleLowerCase('en')),
  );

  const candidates: Array<ResolvableEntry & { spans: ResolutionMatch['spans'] }> = [];
  for (const entry of input.entries) {
    if (entry.status !== 'approved') continue;
    if (supported.size && !supported.has(entry.type as PassportEntryType)) {
      explain.push(`Skipped ${entry.entryId}: type ${entry.type} unsupported for ${input.product}`);
      continue;
    }
    if (!directionAllows(entry, input.sourceLang, input.targetLang)) {
      explain.push(`Skipped ${entry.entryId}: direction/variety language mismatch`);
      continue;
    }
    if (!varietyAllows(entry, input.languageVariety)) {
      explain.push(`Skipped ${entry.entryId}: languageVariety mismatch`);
      continue;
    }
    const ctx = contextsCompatible(
      entry.context as Record<string, unknown>,
      input.context as Record<string, unknown>,
    );
    if (!ctx.ok) {
      explain.push(`Skipped ${entry.entryId}: ${ctx.reason}`);
      continue;
    }
    const formKey = normalizeSourceForm(entry.sourceForm).toLocaleLowerCase('en');
    if (overrideForms.has(formKey)) {
      explain.push(`Skipped ${entry.entryId}: current task override takes precedence`);
      continue;
    }
    const spans = findPhraseSpans(text, entry.sourceForm);
    if (!spans.length) continue;
    candidates.push({ ...entry, spans });
  }

  // Group by normalized source form — conflicts when values disagree.
  const byForm = new Map<string, typeof candidates>();
  for (const c of candidates) {
    const key = normalizeSourceForm(c.sourceForm).toLocaleLowerCase('en');
    const list = byForm.get(key) ?? [];
    list.push(c);
    byForm.set(key, list);
  }

  const matched: ResolutionMatch[] = [];
  const conflicts: ResolutionConflict[] = [];

  for (const [form, list] of byForm) {
    const values = list.map((c) => JSON.stringify(c.approvedValue));
    const unique = new Set(values);
    if (unique.size > 1) {
      conflicts.push({
        sourceForm: form,
        reason: 'conflicting_approved_values',
        candidates: list.map((c) => ({
          entryId: c.entryId,
          revision: c.revision,
          approvedValue: c.approvedValue,
          precedence: c.precedence,
        })),
      });
      continue;
    }
    // Precedence: project > business > user > shared
    const order = { task_override: 0, project: 1, business: 2, user: 3, shared: 4 } as const;
    list.sort((a, b) => order[a.precedence] - order[b.precedence]);
    const chosen = list[0]!;
    matched.push({
      entryId: chosen.entryId,
      revision: chosen.revision,
      type: chosen.type,
      sourceForm: chosen.sourceForm,
      spans: chosen.spans,
      approvedValue: chosen.approvedValue,
      precedence: chosen.precedence,
      adapterAction: adapterActionFor(chosen.type),
    });
  }

  const glossaryTerms: ResolutionPlan['glossaryTerms'] = [];
  const pronunciationAliases: ResolutionPlan['pronunciationAliases'] = [];
  const unitClarifications: ResolutionPlan['unitClarifications'] = [];
  const asrVocabulary: string[] = [];

  for (const m of matched) {
    const value = m.approvedValue as Record<string, unknown>;
    if (m.type === 'approved_translation' || m.type === 'terminology_meaning' || m.type === 'preferred_name') {
      const target =
        (typeof value.value === 'string' && value.value) ||
        (typeof value.targetTerm === 'string' && value.targetTerm) ||
        (typeof value.meaning === 'string' && value.meaning) ||
        '';
      if (target && input.sourceLang && input.targetLang) {
        glossaryTerms.push({
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          sourceTerm: m.sourceForm,
          targetTerm: target,
          wholeWord: true,
          caseSensitive: false,
        });
      }
      asrVocabulary.push(m.sourceForm);
      if (target) asrVocabulary.push(target);
    }
    if (m.type === 'pronunciation') {
      const alias =
        (typeof value.alias === 'string' && value.alias) ||
        (typeof value.value === 'string' && value.value) ||
        '';
      if (alias) {
        pronunciationAliases.push({
          grapheme: m.sourceForm,
          alias,
          ipa: typeof value.ipa === 'string' ? value.ipa : undefined,
        });
        asrVocabulary.push(m.sourceForm, alias);
      }
    }
    if (m.type === 'local_unit_definition') {
      const packageCount = String(value.packageCount ?? value.count ?? '');
      const packageSize = String(value.packageSize ?? value.size ?? '');
      const unit = String(value.unit ?? '');
      if (packageCount && packageSize && unit) {
        unitClarifications.push({
          sourceForm: m.sourceForm,
          packageCount,
          packageSize,
          unit,
          product: typeof (m as { product?: string }).product === 'string' ? undefined : (value.product as string | undefined),
        });
      }
    }
  }

  // Task overrides win for this request only — not saved unless user approves separately.
  for (const ov of input.taskOverrides ?? []) {
    const spans = findPhraseSpans(text, ov.sourceForm);
    if (!spans.length) continue;
    matched.push({
      entryId: 'task_override',
      revision: 0,
      type: 'task_override',
      sourceForm: ov.sourceForm,
      spans,
      approvedValue: ov.approvedValue,
      precedence: 'task_override',
      adapterAction: 'task_override',
    });
    explain.push(`Applied task override for “${ov.sourceForm}”.`);
  }

  const outcome = conflicts.length
    ? 'clarification_required'
    : matched.length
      ? 'applied'
      : 'skipped';

  return {
    resolverVersion: PASSPORT_RESOLVER_VERSION,
    outcome,
    matched,
    conflicts,
    glossaryTerms,
    pronunciationAliases,
    unitClarifications,
    asrVocabulary: [...new Set(asrVocabulary.filter(Boolean))],
    explain,
  };
}

export function hashSnapshotPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
