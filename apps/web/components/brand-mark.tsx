import Link from 'next/link';

type BrandMarkProps = {
  href?: string;
  size?: number;
};

export function BrandMark({ href = '/', size = 32 }: BrandMarkProps) {
  const height = Math.round(size * (72 / 64));

  return (
    <Link
      href={href}
      aria-label="Lugemi home"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        textDecoration: 'none',
        color: 'var(--brand-navy)',
        minHeight: 44,
      }}
    >
      <img
        src="/brand/lugemi-symbol-teal.svg"
        alt=""
        width={size}
        height={height}
        style={{ display: 'block', flexShrink: 0 }}
      />
      <span
        aria-hidden="true"
        style={{
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: '1.15rem',
          letterSpacing: '-0.02em',
          color: 'var(--brand-navy)',
          lineHeight: 1,
        }}
      >
        Lugemi
      </span>
    </Link>
  );
}
