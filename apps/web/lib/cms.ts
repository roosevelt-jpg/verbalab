import { promises as fs } from 'fs';
import path from 'path';
import { CMS_DEFAULTS } from '@/data/cms-defaults';
import type { CmsDocument, CmsPage } from '@/data/cms-types';

const STORE_PATH = path.join(process.cwd, 'data', 'cms-store.json');

function deepMerge<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;
  if (Array.isArray(override)) return override as T;
  if (typeof base !== 'object' || base === null || typeof override !== 'object') {
    return override as T;
  }
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (key in result) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

async function readStore: Promise<Partial<CmsDocument> | null> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as Partial<CmsDocument>;
  } catch {
    return null;
  }
}

export async function getCmsDocument: Promise<CmsDocument> {
  const stored = await readStore;
  if (!stored) return structuredClone(CMS_DEFAULTS);
  return deepMerge(structuredClone(CMS_DEFAULTS), stored);
}

export async function saveCmsDocument(doc: CmsDocument): Promise<CmsDocument> {
  const next: CmsDocument = {
    ...doc,
    version: typeof doc.version === 'number' ? doc.version : 1,
    updatedAt: new Date.toISOString,
  };
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  const doc = await getCmsDocument;
  return doc.pages.find((p) => p.slug === slug) ?? null;
}

export async function listCmsPageSlugs: Promise<string[]> {
  const doc = await getCmsDocument;
  return doc.pages.map((p) => p.slug);
}

export function isCmsAdminAllowed(input: {
  email?: string | null;
  userId?: string | null;
}): boolean {
  const emails = new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim.toLowerCase)
      .filter(Boolean),
  );
  const ids = new Set(
    (process.env.ADMIN_USER_IDS ?? '')
      .split(',')
      .map((s) => s.trim)
      .filter(Boolean),
  );
  // Local/dev: if no allowlist configured, permit CMS writes so content can be edited without blocking.
  if (emails.size === 0 && ids.size === 0) {
    return process.env.NODE_ENV !== 'production' || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }
  if (input.userId && ids.has(input.userId)) return true;
  if (input.email && emails.has(input.email.trim.toLowerCase)) return true;
  return false;
}
