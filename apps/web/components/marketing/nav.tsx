'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { BrandMark } from '@/components/brand-mark';
import type { CmsDocument, CmsNavLink } from '@/data/cms-types';

function NavItem({ item }: { item: CmsNavLink }) {
  const children = item.children?.filter((c) => c.href && c.href !== '#') ?? [];
  const hasMenu = children.length > 0;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  if (!hasMenu) {
    return (
      <li>
        <Link href={item.href || '/'}>{item.label}</Link>
      </li>
    );
  }

  return (
    <li
      ref={rootRef}
      className={`mkt-nav-item${open ? ' is-open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={item.href || '/'}
        className="mkt-nav-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onFocus={() => setOpen(true)}
      >
        {item.label}
        <span className="mkt-nav-chevron" aria-hidden>
          ▾
        </span>
      </Link>
      <div id={menuId} className="mkt-mega" role="region" aria-label={`${item.label} menu`} hidden={!open}>
        <ul className="mkt-mega-list">
          <li className="mkt-mega-overview">
            <Link href={item.href || '/'} onClick={() => setOpen(false)}>
              Overview · {item.label}
            </Link>
          </li>
          {children.map((child) => (
            <li key={`${child.href}-${child.label}`}>
              <Link href={child.href || '/'} onClick={() => setOpen(false)}>
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function MarketingNav({ nav }: { nav: CmsDocument['nav'] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="mkt-header">
      <div className="mkt-wrap mkt-header-inner">
        <BrandMark />
        <nav className="mkt-nav-desktop" aria-label="Primary">
          <ul className="mkt-nav-links">
            {nav.centerLinks.map((item) => (
              <NavItem key={`${item.href}-${item.label}`} item={item} />
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
          {nav.centerLinks.map((item) => {
            const children = item.children?.filter((c) => c.href && c.href !== '#') ?? [];
            return (
              <li key={`m-${item.href}-${item.label}`} className="mkt-mobile-group">
                <Link href={item.href || '/'} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
                {children.length > 0 ? (
                  <ul className="mkt-mobile-children">
                    {children.map((child) => (
                      <li key={`mc-${child.href}-${child.label}`}>
                        <Link href={child.href || '/'} onClick={() => setOpen(false)}>
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
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
