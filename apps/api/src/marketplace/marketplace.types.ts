import { isPromptKey, type PromptKey } from '../prompts/prompt-defaults';

export type GlossarySnapshotTerm = {
  sourceLang: string;
  targetLang: string;
  sourceTerm: string;
  targetTerm: string;
  caseSensitive: boolean;
  wholeWord: boolean;
};

export type PromptSnapshotItem = {
  key: PromptKey;
  body: string;
};

export type DatasetSnapshotPair = {
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  targetText: string;
};

export const MARKETPLACE_KIND_GLOSSARY = 'glossary';
export const MARKETPLACE_KIND_PROMPT = 'prompt';
export const MARKETPLACE_KIND_DATASET = 'dataset';

export const MARKETPLACE_KINDS = [
  MARKETPLACE_KIND_GLOSSARY,
  MARKETPLACE_KIND_PROMPT,
  MARKETPLACE_KIND_DATASET,
] as const;

export type MarketplaceKind = (typeof MARKETPLACE_KINDS)[number];

export const MARKETPLACE_STATUS_PUBLISHED = 'published';
export const MARKETPLACE_STATUS_UNPUBLISHED = 'unpublished';

export function isMarketplaceKind(value: string): value is MarketplaceKind {
  return (MARKETPLACE_KINDS as readonly string[]).includes(value);
}

export function isPromptSnapshotItem(value: unknown): value is PromptSnapshotItem {
  if (!value || typeof value !== 'object') return false;
  const row = value as PromptSnapshotItem;
  return isPromptKey(row.key) && typeof row.body === 'string' && row.body.length > 0;
}
