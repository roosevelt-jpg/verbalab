import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';

export default async function HomePage() {
  if (!isClerkConfigured()) {
    redirect('/setup');
  }

  const session = await auth();
  if (session.userId) {
    redirect('/dashboard');
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          maxWidth: '72rem',
          margin: '0 auto',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 760,
            fontSize: '1.2rem',
            letterSpacing: '-0.02em',
          }}
        >
          VerbaLab
        </span>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <Link href="/sign-in" style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 500 }}>
            Log in
          </Link>
          <Link href="/sign-up" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
            Sign up
          </Link>
        </div>
      </header>

      <section
        style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '4.5rem 1.5rem 2rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: '2.5rem',
          alignItems: 'end',
        }}
        className="vl-fade-up vl-hero-grid"
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.6rem, 6vw, 4.4rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              margin: 0,
              fontWeight: 780,
            }}
          >
            Language intelligence for every market
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
            <Link href="/sign-up" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
              Sign up
            </Link>
            <Link href="/docs" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              Read the docs
            </Link>
            <Link href="/coverage" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              Coverage
            </Link>
          </div>
        </div>
        <p
          className="vl-fade-up-delay"
          style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.65, margin: 0, maxWidth: '28rem' }}
        >
          Enterprise APIs for translation across African and global languages — tenancy, metering, and a developer
          surface built for production.
        </p>
      </section>

      <section
        className="vl-fade-up-delay"
        style={{
          maxWidth: '72rem',
          margin: '2rem auto 4rem',
          padding: '0 1.5rem',
        }}
      >
        <div
          className="vl-panel vl-feature-grid"
          style={{
            padding: '1.5rem',
            background: 'var(--bg-soft)',
            border: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '1rem',
          }}
        >
          {[
            {
              title: 'Translate API',
              body: 'Text translation with language registry checks and usage metering.',
            },
            {
              title: 'Developer playground',
              body: 'Call endpoints with your API key and inspect real JSON responses.',
            },
            {
              title: 'OpenAPI first',
              body: 'Machine-readable spec for /v1 — ready for SDKs and partners.',
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--brand)',
                  marginBottom: '0.9rem',
                  animation: 'vl-soft-pulse 2.4s ease infinite',
                }}
              />
              <h2 style={{ margin: '0 0 0.45rem', fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
                {item.title}
              </h2>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.55, fontSize: '0.95rem' }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
