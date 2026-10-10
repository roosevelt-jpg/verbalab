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
  // Keep Sentry/OTel out of the webpack graph so require-in-the-middle does not
  // show as Next.js "1 Issue" (Critical dependency) during `next dev`.
  serverExternalPackages: [
    '@sentry/nextjs',
    '@sentry/node',
    '@opentelemetry/instrumentation',
    'require-in-the-middle',
    'import-in-the-middle',
  ],
  // Live Clerk keys reject bare localhost Origin; local.lugemi.com (:443) is the supported path.
  allowedDevOrigins: [
    'local.lugemi.com',
    'https://local.lugemi.com',
    'clerk.lugemi.com',
    'https://clerk.lugemi.com',
    'accounts.lugemi.com',
    '127.0.0.1',
    'localhost',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        'local.lugemi.com',
        'https://local.lugemi.com',
        'localhost:43125',
        '127.0.0.1:43125',
      ],
    },
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /node_modules\/require-in-the-middle/,
        message: /Critical dependency/,
      },
    ];
    return config;
  },
  async redirects() {
    return [
      {
        source: '/coveareg',
        destination: '/coverage',
        permanent: false,
      },
      {
        source: '/languages',
        destination: '/coverage',
        permanent: false,
      },
      {
        source: '/language-coverage',
        destination: '/coverage',
        permanent: false,
      },
    ];
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
              // Clerk CAPTCHA uses Cloudflare Turnstile (challenges.cloudflare.com).
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.lugemi.com https://accounts.lugemi.com https://local.lugemi.com https://challenges.cloudflare.com",
              // Clerk + Next.pdf/devtools use blob: workers; without this, Next shows a CSP "1 Issue".
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob:",
              "font-src 'self' data:",
              // Explicit Clerk FAPI + local HTTPS proxy (https: already covers them; keep named for audits).
              `connect-src 'self' https: https://clerk.lugemi.com https://accounts.lugemi.com https://local.lugemi.com https://challenges.cloudflare.com ${apiConnectOrigins()}`,
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.lugemi.com https://accounts.lugemi.com https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.lugemi.com https://clerk.lugemi.com https://local.lugemi.com https://accounts.google.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
