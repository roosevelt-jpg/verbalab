import type { ReactNode } from 'react';
import Link from 'next/link';

type CardProps = {
  title: string;
  children?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  href?: string;
  flat?: boolean;
  className?: string;
};

export function PremiumCard({ title, children, meta, footer, href, flat, className }: CardProps) {
  const classes = [
    'lg-card',
    href ? 'lg-card--interactive' : '',
    flat ? 'lg-card--flat' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      {meta ? <div className="lg-card__meta">{meta}</div> : null}
      <h3 className="lg-type-card">{title}</h3>
      {children ? <div className="lg-card__body">{children}</div> : null}
      {footer ? <div className="lg-card__footer">{footer}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }

  return <article className={classes}>{body}</article>;
}
