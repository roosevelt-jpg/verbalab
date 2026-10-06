'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BrandMark } from '@/components/brand-mark';

const LINKS = [
  { href: '#products', label: 'Products' },
  { href: '/coverage', label: 'Coverage' },
  { href: '#create', label: 'Use cases' },
  { href: '#research', label: 'Research' },
  { href: '#safety', label: 'Safety' },
  { href: '/docs', label: 'Docs' },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="mkt-nav-links">
      {LINKS.map((item) => (
        <li key={`${item.href}-${item.label}`}>
          <Link href={item.href} onClick={onNavigate}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="mkt-header">
      <div className="mkt-wrap mkt-header-inner">
        <BrandMark />
        <nav className="mkt-nav-desktop" aria-label="Primary">
          <NavList />
        </nav>
        <div className="mkt-nav-actions">
          <Link href="/sign-in" className="mkt-nav-text" style={{ textDecoration: 'none' }}>
            Log in
          </Link>
          <Link href="/sign-in" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Open console
          </Link>
          <Link href="/sign-up" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
            Sign up
          </Link>
          <button
            type="button"
            className="mkt-menu-btn"
            aria-expanded={open}
            aria-controls="mkt-mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
      <nav id="mkt-mobile-nav" className="mkt-nav-mobile" aria-label="Primary mobile" hidden={!open}>
        <NavList onNavigate={() => setOpen(false)} />
      </nav>
    </header>
  );
}
