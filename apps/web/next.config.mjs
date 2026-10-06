function apiConnectOrigins() {
  const origins = new Set(['http://localhost:3001', 'http://127.0.0.1:3001']);
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw) {
    try {
      origins.add(new URL(raw).origin);
    } catch {
      /* ignore invalid URL */
    }
  }
  return [...origins].join(' ');
}

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            // Chat Studio uses click-to-record (Web Speech / MediaRecorder).
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob:",
              "font-src 'self' data:",
              `connect-src 'self' https: ${apiConnectOrigins()}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
