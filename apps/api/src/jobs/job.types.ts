export type JobType = 'batch_translate' | 'document_translate' | 'workflow';

export type BatchTranslateItem = {
  id: string;
  text: string;
};

export type BatchTranslateInput = {
  source: string;
  target: string;
  items: BatchTranslateItem[];
};

export type BatchTranslateResult = {
  items: Array<{
    id: string;
    text: string;
    characters: number;
    error?: string;
  }>;
  provider: string;
  characters: number;
};

export type DocumentTranslateInput = {
  documentId: string;
  source: string;
  target: string;
};

export type DocumentTranslateResult = {
  sourceDocumentId: string;
  outputDocumentId: string;
  filename: string;
  mimeType: string;
  downloadPath: string;
  characters: number;
  chunks: number;
  provider: string;
  preview: string;
};

export const JOB_QUEUE_NAME = 'lugemi-jobs';

/** Default 5 MiB upload cap. */
export function documentMaxBytes: number {
  const raw = Number(process.env.DOCUMENT_MAX_BYTES ?? 5 * 1024 * 1024);
  return Number.isFinite(raw) && raw > 0 ? raw : 5 * 1024 * 1024;
}
