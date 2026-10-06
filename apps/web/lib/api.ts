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

export async function apiFetch<T>(
  path: string,
  options: RequestInit & {
    token?: string;
    workspaceId?: string | null;
    organizationId?: string | null;
  } = {},
): Promise<T> {
  const { token, workspaceId, organizationId, headers, ...rest } = options;
  const ws =
    workspaceId === null
      ? undefined
      : workspaceId ?? (typeof window !== 'undefined' ? getStoredWorkspaceId() : null);
  const org =
    organizationId === null
      ? undefined
      : organizationId ?? (typeof window !== 'undefined' ? getStoredAdminOrgId() : null);

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(ws ? { 'X-Lugemi-Workspace-Id': ws } : {}),
      ...(org ? { 'X-Lugemi-Organization-Id': org } : {}),
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
