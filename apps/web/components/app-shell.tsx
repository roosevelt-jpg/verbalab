'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { BrandMark } from '@/components/brand-mark';

type NavLink = { href: string; label: string };

type NavGroup = {
  id: string;
  label: string;
  links: NavLink[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'voice',
    label: 'Voice & audio',
    links: [
      { href: '/audio', label: 'Voice Studio' },
      { href: '/speech', label: 'Speech' },
      { href: '/voice-cloud', label: 'Voice Cloud' },
      { href: '/neural-tts', label: 'Neural TTS' },
      { href: '/voice-cloning', label: 'Voice cloning' },
      { href: '/speech-recognition', label: 'Speech recognition' },
      { href: '/voice-marketplace', label: 'Voice marketplace' },
      { href: '/interpret', label: 'Interpreter' },
      { href: '/voice', label: 'Voice FAQ' },
    ],
  },
  {
    id: 'translation',
    label: 'Translation & localization',
    links: [
      { href: '/translate', label: 'Translate' },
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
      { href: '/accent-intelligence', label: 'Accent Intelligence' },
      { href: '/african-language-registry', label: 'African registry' },
      { href: '/coverage', label: 'Coverage' },
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
      { href: '/developers', label: 'Developers' },
      { href: '/playground', label: 'Playground' },
      { href: '/docs', label: 'Docs' },
      { href: '/keys', label: 'API keys' },
      { href: '/graphql', label: 'GraphQL' },
      { href: '/usage', label: 'Usage' },
      { href: '/analytics', label: 'Analytics' },
      { href: '/gateway', label: 'AI Gateway' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin & workspace',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/billing', label: 'Billing' },
      { href: '/data', label: 'Data & residency' },
      { href: '/audit', label: 'Audit' },
      { href: '/admin', label: 'Admin' },
      { href: '/enterprise', label: 'Enterprise' },
      { href: '/identity', label: 'Identity' },
    ],
  },
];

function groupContainsPath(group: NavGroup, pathname: string) {
  return group.links.some(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      initial[group.id] = groupContainsPath(group, pathname) || group.id === 'developer' || group.id === 'admin';
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

  return (
    <div className="vl-console">
      <header className="vl-console-header">
        <div className="vl-console-header-left">
          <button
            type="button"
            className="vl-console-menu-btn"
            aria-expanded={navOpen}
            aria-controls="vl-console-nav"
            onClick={() => setNavOpen((v) => !v)}
          >
            Menu
          </button>
          <BrandMark href="/dashboard" />
          <span className="vl-console-product-label">Studio</span>
        </div>
        <div className="vl-console-header-right">
          <WorkspaceSwitcher />
          {isClerkConfigured() ? <UserButton afterSignOutUrl="/" /> : null}
        </div>
      </header>

      <div className="vl-console-body">
        <aside
          id="vl-console-nav"
          className={`vl-console-sidebar${navOpen ? ' is-open' : ''}`}
          aria-label="Console navigation"
        >
          <nav className="vl-console-nav">
            {NAV_GROUPS.map((group) => {
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
                      {group.links.map((link) => {
                        const active =
                          pathname === link.href || pathname.startsWith(`${link.href}/`);
                        return (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className={`vl-console-nav-link${active ? ' is-active' : ''}`}
                            >
                              {link.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        {navOpen ? (
          <button
            type="button"
            className="vl-console-backdrop"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <main
          className={`vl-console-main vl-fade-up${pathname === '/chat' || pathname.startsWith('/chat/') ? ' vl-console-main--chat' : ''}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
