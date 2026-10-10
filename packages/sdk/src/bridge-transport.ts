import { LugemiError } from './errors.js';
import type { UploadFile } from './types.js';

type ErrorBody = {
  error?: { code?: string; message?: string; request_id?: string };
};

export type BridgeHeaders = {
  actorId?: string | null;
  organizationId?: string | null;
  workspaceId?: string | null;
  /** Header name for actor id (VoiceBridge vs DealBridge). */
  actorHeaderName: 'X-VoiceBridge-Actor-Id' | 'X-DealBridge-Actor-Id';
};

export type BridgeTransport = {
  requestJson: <T>(
    path: string,
    init?: {
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
    },
  ) => Promise<T>;
  requestForm: <T>(
    path: string,
    form: FormData,
    init?: { headers?: Record<string, string> },
  ) => Promise<T>;
};

export function toBlob(file: UploadFile): Blob {
  if (file.data instanceof Blob) {
    return file.contentType && file.data.type !== file.contentType
      ? new Blob([file.data], { type: file.contentType })
      : file.data;
  }
  const bytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
  return new Blob([bytes], { type: file.contentType ?? 'application/octet-stream' });
}

export function actorHeaders(h: BridgeHeaders): Record<string, string> {
  const out: Record<string, string> = {};
  if (h.actorId) out[h.actorHeaderName] = h.actorId;
  if (h.organizationId) out['X-Lugemi-Organization-Id'] = h.organizationId;
  if (h.workspaceId) out['X-Lugemi-Workspace-Id'] = h.workspaceId;
  return out;
}

export type UploadAuth = {
  maxBytes: number;
  maxRecordingSeconds?: number | null;
  allowedMimeTypes: string[];
  uploadPath: string;
  expiresAt?: string | null;
};

export type UploadProgress = {
  bytesSent: number;
  totalBytes: number;
  attempt: number;
  fraction: number;
};

export async function uploadMultipartWithRetry<T>(
  transport: BridgeTransport,
  opts: {
    path: string;
    form: FormData;
    headers?: Record<string, string>;
    maxBytes?: number;
    maxAttempts?: number;
    onProgress?: (p: UploadProgress) => void;
  },
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 4;
  let last: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    opts.onProgress?.({
      bytesSent: 0,
      totalBytes: 0,
      attempt,
      fraction: 0,
    });
    try {
      const result = await transport.requestForm<T>(opts.path, opts.form, {
        headers: opts.headers,
      });
      opts.onProgress?.({
        bytesSent: 1,
        totalBytes: 1,
        attempt,
        fraction: 1,
      });
      return result;
    } catch (err) {
      last = err;
      if (err instanceof LugemiError && [400, 401, 403, 404, 409, 413, 422].includes(err.status)) {
        throw err;
      }
      if (attempt >= maxAttempts) break;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  if (last instanceof Error) throw last;
  throw new LugemiError('Upload failed', 'upload_failed', 0);
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & ErrorBody;
  if (!response.ok) {
    throw new LugemiError(
      body.error?.message ?? `Request failed with status ${response.status}`,
      body.error?.code ?? 'http_error',
      response.status,
      body.error?.request_id,
    );
  }
  return body;
}
