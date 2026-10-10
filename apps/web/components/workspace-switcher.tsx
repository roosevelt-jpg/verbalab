'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, getStoredWorkspaceId, setStoredWorkspaceId } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
import { usePlatformAdmin } from '@/lib/use-platform-admin';
import { formatWorkspaceLimit } from '@/data/billing-plans';

type WorkspaceRow = {
  id: string;
  name: string;
  isCurrent: boolean;
  defaultSourceLang: string;
  defaultTargetLang: string;
};

type WorkspaceEntitlements = {
  plan: string;
  planName: string;
  features: string[];
  workspaceLimit: number;
  workspaceUsed: number;
  workspaceRemaining: number | null;
  canCreate: boolean;
  unlimited: boolean;
};

/** Shell entry — never call useAuth when ClerkProvider is absent. */
export function WorkspaceSwitcher() {
  if (!isClerkConfigured()) return null;
  return <WorkspaceSwitcherAuthed />;
}

function WorkspaceSwitcherAuthed() {
  const { getToken, isLoaded, userId } = useAuth();
  const platformAdmin = usePlatformAdmin(userId, getToken);
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [entitlements, setEntitlements] = useState<WorkspaceEntitlements | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await apiFetch<{ data: WorkspaceRow[]; entitlements?: WorkspaceEntitlements }>(
      '/v1/workspaces',
      { token },
    );
    setWorkspaces(res.data);
    if (res.entitlements) setEntitlements(res.entitlements);
    const stored = getStoredWorkspaceId();
    const current =
      res.data.find((w) => w.id === stored)?.id ??
      res.data.find((w) => w.isCurrent)?.id ??
      res.data[0]?.id ??
      '';
    if (current) {
      setSelected(current);
      setStoredWorkspaceId(current);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch(() => {
      /* shell stays usable without workspace list */
    });
  }, [isLoaded, load]);

  if (workspaces.length === 0) return null;

  async function onChange(id: string) {
    setSelected(id);
    setStoredWorkspaceId(id);
    window.location.reload();
  }

  async function createWorkspace() {
    if (entitlements && !entitlements.canCreate && !platformAdmin) {
      window.alert(
        `Your ${entitlements.planName} plan includes ${formatWorkspaceLimit(entitlements.workspaceLimit)} workspace${entitlements.workspaceLimit === 1 ? '' : 's'}. Upgrade under Billing for more.`,
      );
      return;
    }
    const name = window.prompt('New workspace name');
    if (!name?.trim()) return;
    setCreating(true);
    try {
      const token = await getToken();
      if (!token) return;
      const created = await apiFetch<WorkspaceRow>('/v1/workspaces', {
        method: 'POST',
        token,
        body: JSON.stringify({ name: name.trim() }),
      });
      setStoredWorkspaceId(created.id);
      window.location.reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not create workspace');
      setCreating(false);
    }
  }

  const atLimit = platformAdmin ? false : entitlements ? !entitlements.canCreate : false;
  const limitHint = entitlements
    ? `${entitlements.workspaceUsed}/${formatWorkspaceLimit(entitlements.workspaceLimit)}`
    : null;

  return (
    <div className="vl-workspace-switcher">
      <label htmlFor="vl-workspace" className="vl-workspace-switcher__label">
        Workspace
      </label>
      <select
        id="vl-workspace"
        className="vl-workspace-switcher__select"
        value={selected}
        onChange={(e) => void onChange(e.target.value)}
        aria-label="Workspace"
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="vl-workspace-switcher__add"
        onClick={() => void createWorkspace()}
        disabled={creating}
        aria-label="Create workspace"
        title={
          atLimit
            ? `Plan limit reached (${limitHint}). Upgrade for more workspaces.`
            : limitHint
              ? `Create workspace (${limitHint})`
              : 'Create workspace'
        }
        data-at-limit={atLimit ? 'true' : undefined}
      >
        +
      </button>
      {atLimit && !platformAdmin ? (
        <Link href="/pricing" className="vl-workspace-switcher__upgrade">
          Upgrade
        </Link>
      ) : null}
    </div>
  );
}
