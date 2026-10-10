import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
  actions,
  compact,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  /** Extra paragraphs under the lede */
  children?: ReactNode;
  actions?: ReactNode;
  /** Omit bottom rule — useful inside hero grids */
  compact?: boolean;
}) {
  return (
    <header
      className="lg-page-header vl-fade-up"
      style={compact ? { borderBottom: 'none', paddingBottom: 0 } : undefined}
    >
      {eyebrow ? (
        <p className="lg-type-caption lg-page-header__eyebrow">
          <span className="vl-tag">{eyebrow}</span>
        </p>
      ) : null}
      <h1 className="lg-type-page">{title}</h1>
      {lede ? <p className="lg-type-body lg-prose">{lede}</p> : null}
      {children ? <div className="lg-prose">{children}</div> : null}
      {actions ? <div className="lg-page-header__actions">{actions}</div> : null}
    </header>
  );
}
