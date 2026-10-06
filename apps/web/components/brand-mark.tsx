import Link from 'next/link';

type BrandMarkProps = {
  href?: string;
  size?: number;
};

export function BrandMark({ href = '/', size = 32 }: BrandMarkProps) {
  return (
    <Link
      href={href}
      aria-label="Lugemi home"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        color: 'var(--text-primary)',
        minHeight: 44,
      }}
    >
      <img
        src="/brand/lugemi-symbol-teal.svg"
        alt=""
        width={size}
        height={size}
        style={{ display: 'block', flex: 'none' }}
      />
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: '1.15rem',
          letterSpacing: '-0.02em',
        }}
      >
        Lugemi
      </span>
    </Link>
  );
}
