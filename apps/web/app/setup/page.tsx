export default function SetupPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div className="vl-panel vl-fade-up" style={{ maxWidth: '40rem', padding: '2rem' }}>
        <p style={{ margin: 0, color: 'var(--action-primary)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.08em' }}>
          SETUP
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', margin: '0.5rem 0 0.75rem' }}>
          Keys required
        </h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          Copy <code className="vl-code">.env.example</code> into <code className="vl-code">apps/api/.env</code> and{' '}
          <code className="vl-code">apps/web/.env.local</code>, then restart <code className="vl-code">pnpm dev</code>.
          Console sign-in needs Clerk; live MT needs Google. We will not fake providers.
        </p>

        <h2 style={{ fontSize: '1rem', margin: '1.25rem 0 0.4rem' }}>Required for console + translate</h2>
        <ul style={{ color: 'var(--ink)', lineHeight: 1.8, paddingLeft: '1.1rem', margin: 0 }}>
          <li>
            <code className="vl-code">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> (web)
          </li>
          <li>
            <code className="vl-code">CLERK_SECRET_KEY</code> (web + api)
          </li>
          <li>
            <code className="vl-code">GOOGLE_TRANSLATE_API_KEY</code> (api)
          </li>
        </ul>

        <h2 style={{ fontSize: '1rem', margin: '1.25rem 0 0.4rem' }}>Local platform</h2>
        <ul style={{ color: 'var(--ink)', lineHeight: 1.8, paddingLeft: '1.1rem', margin: 0 }}>
          <li>
            Postgres + Redis via <code className="vl-code">infra/docker-compose.yml</code> (
            <code className="vl-code">DATABASE_URL</code>, <code className="vl-code">REDIS_URL</code>)
          </li>
          <li>
            Optional residency pin: <code className="vl-code">VERBALAB_REGION=us|eu</code>
          </li>
        </ul>

        <h2 style={{ fontSize: '1rem', margin: '1.25rem 0 0.4rem' }}>Optional product keys</h2>
        <ul style={{ color: 'var(--ink)', lineHeight: 1.8, paddingLeft: '1.1rem', margin: 0 }}>
          <li>
            <code className="vl-code">OPENAI_API_KEY</code> — STT/TTS/chat/embeddings/RAG
          </li>
          <li>
            <code className="vl-code">ELEVENLABS_API_KEY</code> — voice cloning
          </li>
          <li>
            <code className="vl-code">STRIPE_*</code> — billing checkout / Connect
          </li>
          <li>
            <code className="vl-code">RESEND_API_KEY</code> — email notifications
          </li>
        </ul>

        <p style={{ color: 'var(--muted)', marginBottom: 0, marginTop: '1.25rem' }}>
          Public docs and OpenAPI stay available at <a href="/docs">/docs</a>. Deploy runbook:{' '}
          <code className="vl-code">infra/DEPLOY.md</code>.
        </p>
      </div>
    </main>
  );
}
