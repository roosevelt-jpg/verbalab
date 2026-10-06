'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BrandMark } from '@/components/brand-mark';
import type { CmsDocument } from '@/data/cms-types';

export function MarketingNav({ nav }: { nav: CmsDocument['nav'] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="mkt-header">
      <div className="mkt-wrap mkt-header-inner">
        <BrandMark />
        <nav className="mkt-nav-desktop" aria-label="Primary">
          <ul className="mkt-nav-links">
            {nav.centerLinks.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mkt-nav-actions">
          <Link href={nav.actions.console.href} className="mkt-nav-text">
            {nav.actions.console.label}
          </Link>
          <Link href={nav.actions.login.href} className="mkt-nav-text">
            {nav.actions.login.label}
          </Link>
          <Link href={nav.actions.signup.href} className="vl-btn vl-btn-primary mkt-nav-signup">
            {nav.actions.signup.label}
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
          {nav.centerLinks.map((item) => (
            <li key={`m-${item.href}-${item.label}`}>
              <Link href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href={nav.actions.console.href} onClick={() => setOpen(false)}>
              {nav.actions.console.label}
            </Link>
          </li>
          <li>
            <Link href={nav.actions.login.href} onClick={() => setOpen(false)}>
              {nav.actions.login.label}
            </Link>
          </li>
          <li>
            <Link href={nav.actions.signup.href} onClick={() => setOpen(false)}>
              {nav.actions.signup.label}
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
