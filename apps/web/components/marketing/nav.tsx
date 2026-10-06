'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BrandMark } from '@/components/brand-mark';

const CENTER_LINKS = [
  { href: '#products', label: 'Products' },
  { href: '/coverage', label: 'Coverage' },
  { href: '#hubs', label: 'Hubs' },
  { href: '#use-cases', label: 'Use cases' },
  { href: '#research', label: 'Research' },
  { href: '#safety', label: 'Safety' },
  { href: '/docs', label: 'Docs' },
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="mkt-header">
      <div className="mkt-wrap mkt-header-inner">
        <BrandMark />
        <nav className="mkt-nav-desktop" aria-label="Primary">
          <ul className="mkt-nav-links">
            {CENTER_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mkt-nav-actions">
          <Link href="/dashboard" className="mkt-nav-text">
            Open console
          </Link>
          <Link href="/sign-in" className="mkt-nav-text">
            Log in
          </Link>
          <Link href="/sign-up" className="vl-btn vl-btn-primary mkt-nav-signup">
            Sign up
          </Link>
          <button
            type="button"
            className="mkt-menu-btn"
            aria-expanded={open}
            aria-controls="mkt-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
      <nav id="mkt-mobile-nav" className="mkt-nav-mobile" aria-label="Primary mobile" hidden={!open}>
        <ul className="mkt-nav-links">
          {CENTER_LINKS.map((item) => (
            <li key={`m-${item.href}`}>
              <Link href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              Open console
            </Link>
          </li>
          <li>
            <Link href="/sign-in" onClick={() => setOpen(false)}>
              Log in
            </Link>
          </li>
          <li>
            <Link href="/sign-up" onClick={() => setOpen(false)}>
              Sign up
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
