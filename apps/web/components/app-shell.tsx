'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserButton, useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { BrandMark } from '@/components/brand-mark';

type NavLink = { href: string; label: string; adminOnly?: boolean };

type NavGroup = {
  id: string;
  label: string;
  links: NavLink[];
};

type ShellMode = 'loading' | 'public' | 'console';

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace Console',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/creative', label: 'LugemiCreative' },
      { href: '/identity', label: 'Identity & profile' },
      { href: '/language-integrity', label: 'Language Integrity' },
      { href: '/keys', label: 'API keys' },
      { href: '/chat', label: 'Chat Studio' },
      { href: '/models', label: 'Models' },
      { href: '/verified-interpreter', label: 'Verified Interpreter' },
      { href: '/translate', label: 'Translate' },
      { href: '/data', label: 'Data & branding' },
      { href: '/connectors', label: 'Connectors' },
      { href: '/billing', label: 'Billing' },
    ],
  },
  {
    id: 'voice',
    label: 'Voice & audio',
    links: [
      { href: '/audio', label: 'Voice Studio' },
      { href: '/speech', label: 'Speech' },
      { href: '/voice-cloud', label: 'Voice Cloud' },
      { href: '/neural-tts', label: 'Neural TTS' },
      { href: '/voice-cloning', label: 'Voice cloning' },
      { href: '/language-integrity', label: 'Language Integrity' },
      { href: '/speech-recognition', label: 'Speech recognition' },
      { href: '/voice-marketplace', label: 'Voice marketplace' },
      { href: '/interpret', label: 'Interpreter' },
      { href: '/mix', label: 'Mix' },
      { href: '/live', label: 'Live' },
      { href: '/voice', label: 'Voice FAQ' },
    ],
  },
  {
    id: 'translation',
    label: 'Translation & localization',
    links: [
      { href: '/translate', label: 'Translate' },
      { href: '/fidelity', label: 'Fidelity' },
      { href: '/pragmatics', label: 'Pragmatics' },
      { href: '/language-kits', label: 'Language Kits' },
      { href: '/edge', label: 'Edge packs' },
      { href: '/grounded', label: 'Grounded' },
      { href: '/data-advantage', label: 'Data Advantage' },
      { href: '/corridor-benchmarks', label: 'Advantage Protocol' },
      { href: '/translate/formats', label: 'Formats' },
      { href: '/translation-runtime', label: 'Translation runtime' },
      { href: '/localize', label: 'Localize' },
      { href: '/localization', label: 'Localization' },
      { href: '/glossary', label: 'Glossary' },
      { href: '/tm', label: 'Translation memory' },
      { href: '/reviews', label: 'Reviews' },
      { href: '/documents', label: 'Documents' },
      { href: '/ocr', label: 'OCR' },
      { href: '/language', label: 'Language' },
      { href: '/language-intelligence', label: 'Language Intelligence' },
      { href: '/countries', label: 'Country packs' },
      { href: '/dialects', label: 'Dialects' },
      { href: '/accents', label: 'Accents' },
      { href: '/accent-identity', label: 'Accent Identity' },
      { href: '/accent-intelligence', label: 'Accent Intelligence' },
      { href: '/african-language-registry', label: 'Language registry' },
      { href: '/locales', label: 'Locales' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge & agents',
    links: [
      { href: '/knowledge', label: 'Knowledge' },
      { href: '/knowledge-cloud', label: 'Knowledge Cloud' },
      { href: '/knowledge-base', label: 'Knowledge base' },
      { href: '/chat', label: 'Chat Studio' },
      { href: '/prompts', label: 'Prompts' },
      { href: '/datasets', label: 'Datasets' },
      { href: '/models', label: 'Models' },
      { href: '/model-registry', label: 'Model registry' },
      { href: '/registry', label: 'Enterprise registry' },
      { href: '/workflows', label: 'Workflows' },
      { href: '/connectors', label: 'Connectors' },
      { href: '/intelligence-cloud', label: 'Intelligence' },
    ],
  },
  {
    id: 'developer',
    label: 'Developer tools',
    links: [
      { href: '/builders', label: 'Builders' },
      { href: '/developers', label: 'Developers' },
      { href: '/playground', label: 'Playground' },
      { href: '/docs', label: 'Docs' },
      { href: '/docs/api', label: 'API reference' },
      { href: '/mcp', label: 'MCP' },
      { href: '/keys', label: 'API keys' },
      { href: '/graphql', label: 'GraphQL' },
      { href: '/usage', label: 'Usage' },
      { href: '/analytics', label: 'Analytics' },
      { href: '/gateway', label: 'AI Gateway' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin & enterprise',
    links: [
      { href: '/audit', label: 'Audit' },
      { href: '/language-integrity', label: 'Language Integrity' },
      { href: '/admin', label: 'CMS admin', adminOnly: true },
      { href: '/admin/workspaces', label: 'Workspace admin', adminOnly: true },
      { href: '/admin/voice-data', label: 'Voice data', adminOnly: true },
      { href: '/admin/pilot-requests', label: 'Pilot requests', adminOnly: true },
      { href: '/enterprise/console', label: 'Enterprise console' },
      { href: '/enterprise', label: 'Enterprise plan' },
    ],
  },
];

const PUBLIC_LINKS: NavLink[] = [
  // Docs/Pricing live in the marketing footer — keep the public shell header lean.
  { href: '/developers', label: 'Developers' },
];

function linkActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupContainsPath(group: NavGroup, pathname: string) {
  return group.links.some((link) => linkActive(link.href, pathname));
}

/** Platform-admin status is per user, so cache it across page navigations within the tab. */
const adminStatusCache = new Map<string, boolean>();

function usePlatformAdmin(userId: string | null | undefined, getToken: () => Promise<string | null>) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => (userId ? adminStatusCache.get(userId) ?? false : false));

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const cached = adminStatusCache.get(userId);
    if (cached !== undefined) {
      setIsAdmin(cached);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const status = await apiFetch<{ admin: boolean }>('/v1/admin/status', { token });
        adminStatusCache.set(userId, Boolean(status.admin));
        if (typeof document !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `lugemi_platform_admin=${status.admin ? '1' : '0'}; Path=/; Max-Age=${60 * 60 * 24 * 400}; SameSite=Lax${secure}`;
        }
        if (!cancelled) setIsAdmin(Boolean(status.admin));
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, getToken]);

  return isAdmin;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured()) {
    return (
      <ShellFrame mode="console" isAdmin={false} clerk={false}>
        {children}
      </ShellFrame>
    );
  }
  return <AuthedAppShell>{children}</AuthedAppShell>;
}

function AuthedAppShell({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const isAdmin = usePlatformAdmin(isSignedIn ? userId : null, getToken);
  const mode: ShellMode = !isLoaded ? 'loading' : isSignedIn ? 'console' : 'public';
  return (
    <ShellFrame mode={mode} isAdmin={isAdmin} clerk>
      {children}
    </ShellFrame>
  );
}

function ShellFrame({
  mode,
  isAdmin,
  clerk,
  children,
}: {
  mode: ShellMode;
  isAdmin: boolean;
  clerk: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const chatImmersive = pathname === '/chat' || pathname.startsWith('/chat/');
  const [navOpen, setNavOpen] = useState(false);
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => !link.adminOnly || isAdmin),
  })).filter((group) => group.links.length > 0);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      initial[group.id] =
        groupContainsPath(group, pathname) || group.id === 'workspace' || group.id === 'developer';
    }
    return initial;
  });

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of NAV_GROUPS) {
        if (groupContainsPath(group, pathname)) next[group.id] = true;
      }
      return next;
    });
    setNavOpen(false);
  }, [pathname]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const inConsole = mode === 'console';
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(pathname)}`;

  return (
    <div className="vl-console">
      <header className="vl-console-header">
        <div className="vl-console-header-left">
          {inConsole ? (
            <button
              type="button"
              className="vl-console-menu-btn"
              aria-expanded={navOpen}
              aria-controls="vl-console-nav"
              onClick={() => setNavOpen((v) => !v)}
            >
              Menu
            </button>
          ) : null}
          <BrandMark href={inConsole ? '/dashboard' : '/'} />
          {inConsole ? <span className="vl-console-product-label">Studio</span> : null}
          {mode === 'public' ? (
            <nav className="vl-console-public-links" aria-label="Lugemi">
              {PUBLIC_LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="vl-console-header-right">
          {inConsole ? (
            <>
              <WorkspaceSwitcher />
              {clerk ? <UserButton afterSignOutUrl="/" /> : null}
            </>
          ) : null}
          {mode === 'public' ? (
            <>
              <Link href={signInHref} className="vl-btn vl-btn-secondary">
                Log in
              </Link>
              <Link href="/sign-up" className="vl-btn vl-btn-primary">
                Sign up
              </Link>
            </>
          ) : null}
        </div>
      </header>

      <div className={`vl-console-body${chatImmersive && inConsole ? ' vl-console-body--chat' : ''}`}>
        {inConsole ? (
          <aside
            id="vl-console-nav"
            className={`vl-console-sidebar${navOpen ? ' is-open' : ''}${chatImmersive ? ' vl-console-sidebar--chat-hidden' : ''}`}
            aria-label="Console navigation"
            hidden={chatImmersive && !navOpen}
          >
            <nav className="vl-console-nav">
              {groups.map((group) => {
                const expanded = openGroups[group.id] ?? false;
                const groupActive = groupContainsPath(group, pathname);
                return (
                  <div key={group.id} className="vl-console-nav-group">
                    <button
                      type="button"
                      className={`vl-console-nav-group-btn${groupActive ? ' is-active' : ''}`}
                      aria-expanded={expanded}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <span>{group.label}</span>
                      <span className="vl-console-chevron" aria-hidden="true">
                        {expanded ? '▾' : '▸'}
                      </span>
                    </button>
                    {expanded ? (
                      <ul className="vl-console-nav-list">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className={`vl-console-nav-link${linkActive(link.href, pathname) ? ' is-active' : ''}`}
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </aside>
        ) : null}

        {inConsole && navOpen ? (
          <button
            type="button"
            className="vl-console-backdrop"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <main className={`vl-console-main vl-fade-up${chatImmersive && inConsole ? ' vl-console-main--chat' : ''}`}>
          {mode === 'public' ? (
            <p className="vl-console-public-note" role="note">
              You are viewing a public preview.{' '}
              <Link href={signInHref}>Log in</Link> or <Link href="/sign-up">create an account</Link> to use this tool
              with your workspace.
            </p>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
