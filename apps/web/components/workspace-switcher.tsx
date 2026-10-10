'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, getStoredWorkspaceId, setStoredWorkspaceId } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
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
  const { getToken, isLoaded } = useAuth();
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
    if (entitlements && !entitlements.canCreate) {
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

  const atLimit = entitlements ? !entitlements.canCreate : false;
  const limitHint = entitlements
    ? `${entitlements.workspaceUsed}/${formatWorkspaceLimit(entitlements.workspaceLimit)}`
    : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <label htmlFor="vl-workspace" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
        Workspace
      </label>
      <select
        id="vl-workspace"
        value={selected}
        onChange={(e) => void onChange(e.target.value)}
        style={{
          fontSize: '0.85rem',
          padding: '0.35rem 0.55rem',
          borderRadius: '0.4rem',
          border: '1px solid var(--line)',
          background: 'var(--bg)',
          color: 'var(--ink)',
          maxWidth: '10rem',
        }}
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => void createWorkspace()}
        disabled={creating}
        title={
          atLimit
            ? `Plan limit reached (${limitHint}). Upgrade for more workspaces.`
            : limitHint
              ? `Create workspace (${limitHint})`
              : 'Create workspace'
        }
        style={{
          fontSize: '0.85rem',
          padding: '0.3rem 0.5rem',
          borderRadius: '0.4rem',
          border: '1px solid var(--line)',
          background: 'transparent',
          color: atLimit ? 'var(--muted)' : 'var(--muted)',
          cursor: creating ? 'wait' : atLimit ? 'not-allowed' : 'pointer',
          opacity: atLimit ? 0.55 : 1,
        }}
      >
        +
      </button>
      {atLimit ? (
        <Link
          href="/pricing"
          style={{ fontSize: '0.7rem', color: 'var(--action-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Upgrade
        </Link>
      ) : null}
    </div>
  );
}
