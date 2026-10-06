const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const WORKSPACE_STORAGE_KEY = 'verbalab_workspace_id';

export function getStoredWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
}

export function setStoredWorkspaceId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (!id) window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  else window.localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; workspaceId?: string | null } = {},
): Promise<T> {
  const { token, workspaceId, headers, ...rest } = options;
  const ws =
    workspaceId === null
      ? undefined
      : workspaceId ?? (typeof window !== 'undefined' ? getStoredWorkspaceId() : null);

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(ws ? { 'X-VerbaLab-Workspace-Id': ws } : {}),
      ...headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as T & {
    error?: { code: string; message: string };
  };

  if (!response.ok) {
    throw new Error(body.error?.message ?? `Request failed (${response.status})`);
  }

  return body as T;
}

export { API_URL };
