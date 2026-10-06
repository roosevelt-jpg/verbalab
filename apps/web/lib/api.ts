const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const WORKSPACE_STORAGE_KEY = 'lugemi_workspace_id';
export const ADMIN_ORG_STORAGE_KEY = 'lugemi_admin_org_id';

export function getStoredWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
}

export function setStoredWorkspaceId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (!id) window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  else window.localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
}

/** Platform-admin active organization context (open-as workspace). */
export function getStoredAdminOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ADMIN_ORG_STORAGE_KEY);
}

export function setStoredAdminOrgId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (!id) window.localStorage.removeItem(ADMIN_ORG_STORAGE_KEY);
  else window.localStorage.setItem(ADMIN_ORG_STORAGE_KEY, id);
}

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  token?: string;
  workspaceId?: string | null;
  organizationId?: string | null;
  /** JSON-serializable object, FormData, string, or other BodyInit. Objects are stringified. */
  body?: BodyInit | Record<string, unknown> | unknown[] | object | null;
};

function toBodyInit(body: ApiFetchOptions['body']): BodyInit | null | undefined {
  if (body == null) return body;
  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    body instanceof URLSearchParams ||
    (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream)
  ) {
    return body as BodyInit;
  }
  return JSON.stringify(body);
}

function isNetworkReachabilityError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err);
  return /load failed|failed to fetch|networkerror|network request failed/i.test(raw);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { token, workspaceId, organizationId, headers, body, ...rest } = options;
  const ws =
    workspaceId === null
      ? undefined
      : workspaceId ?? (typeof window !== 'undefined' ? getStoredWorkspaceId() : null);
  const org =
    organizationId === null
      ? undefined
      : organizationId ?? (typeof window !== 'undefined' ? getStoredAdminOrgId() : null);

  const serialized = toBodyInit(body);
  const requestInit: RequestInit = {
    ...rest,
    body: serialized,
    headers: {
      ...(serialized instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(ws ? { 'X-Lugemi-Workspace-Id': ws } : {}),
      ...(org ? { 'X-Lugemi-Organization-Id': org } : {}),
      ...headers,
    },
  };

  let response: Response | undefined;
  let lastNetworkError: unknown;
  // One short retry covers Nest --watch restarts that briefly drop the socket.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch(`${API_URL}${path}`, requestInit);
      lastNetworkError = undefined;
      break;
    } catch (err) {
      lastNetworkError = err;
      if (!isNetworkReachabilityError(err) || attempt === 1) break;
      await sleep(350);
    }
  }

  if (!response) {
    const raw =
      lastNetworkError instanceof Error
        ? lastNetworkError.message
        : String(lastNetworkError ?? 'network error');
    if (isNetworkReachabilityError(lastNetworkError) || /network error/i.test(raw)) {
      throw new Error(
        `Cannot reach API at ${API_URL}${path}. Check NEXT_PUBLIC_API_URL and CORS_ORIGIN.`,
      );
    }
    throw lastNetworkError instanceof Error ? lastNetworkError : new Error(raw);
  }

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { code: string; message: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Request failed (${response.status})`);
  }

  return payload as T;
}

export { API_URL };
