import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  // Lean production image for Fly / Docker (apps/web/Dockerfile).
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // Live Clerk keys reject bare localhost Origin; local.lugemi.com (:443) is the supported path.
  allowedDevOrigins: ['local.lugemi.com', '127.0.0.1', 'localhost'],
  experimental: {
    serverActions: {
      allowedOrigins: ['local.lugemi.com', 'localhost:43125', '127.0.0.1:43125'],
    },
  },
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.lugemi.com https://accounts.lugemi.com",
              // Clerk + Next.pdf/devtools use blob: workers; without this, Next shows a CSP "1 Issue".
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob:",
              "font-src 'self' data:",
              `connect-src 'self' https: ${apiConnectOrigins()}`,
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.lugemi.com https://accounts.lugemi.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.lugemi.com https://clerk.lugemi.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
