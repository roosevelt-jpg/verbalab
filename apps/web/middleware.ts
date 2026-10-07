import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import {
  LIVE_CLERK_LOCAL_HOST,
  mustUseLiveClerkLocalOrigin,
} from '@/lib/live-clerk-local-origin';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/setup(.*)',
  '/dev-login(.*)',
  '/api/dev-login(.*)',
  '/api/cms(.*)',
  '/api/demo(.*)',
  '/api/support(.*)',
  '/docs(.*)',
  '/pricing(.*)',
  '/playground(.*)',
  '/coverage(.*)',
  '/models(.*)',
  '/developers(.*)',
  '/builders(.*)',
  '/language-integrity(.*)',
  '/african-language-registry(.*)',
  '/accent-identity(.*)',
  '/verified-interpreter(.*)',
  '/mix(.*)',
  '/fidelity(.*)',
  '/live(.*)',
  '/pragmatics(.*)',
  '/language-kits(.*)',
  '/edge(.*)',
  '/grounded(.*)',
  '/data-advantage(.*)',
  '/corridor-benchmarks(.*)',
  '/health(.*)',
  '/p(.*)',
  '/enterprise',
  '/pricing(.*)',
  '/onboarding(.*)',
]);

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Live Clerk FAPI rejects Origin http://127.0.0.1 / localhost. Force browser
 * document navigations (especially /dev-login) onto the HTTPS :443 proxy host.
 * Leave /api/* on the loopback port so agents can mint tickets without the proxy.
 */
function redirectBareLocalToLiveClerkHost(request: NextRequest): NextResponse | null {
  const hostHeader =
    request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  if (
    !mustUseLiveClerkLocalOrigin({
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hostHeader,
    })
  ) {
    return null;
  }

  const path = request.nextUrl.pathname;
  if (path.startsWith('/api/') || path.startsWith('/_next/') || path === '/health') {
    return null;
  }

  const dest = request.headers.get('sec-fetch-dest');
  const accept = request.headers.get('accept') || '';
  const isAuthEntry =
    path.startsWith('/dev-login') || path.startsWith('/sign-in') || path.startsWith('/sign-up');
  const isDocument =
    dest === 'document' || (!dest && accept.includes('text/html')) || dest === 'empty';

  if (!isAuthEntry && !isDocument) {
    return null;
  }

  const target = new URL(request.url);
  target.protocol = 'https:';
  target.hostname = LIVE_CLERK_LOCAL_HOST;
  target.port = '';
  return NextResponse.redirect(target, 307);
}

export default clerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      const forced = redirectBareLocalToLiveClerkHost(request);
      if (forced) return forced;

      if (!isPublicRoute(request)) {
        const { userId } = await auth();
        if (!userId) {
          const signIn = new URL('/sign-in', request.url);
          signIn.searchParams.set('redirect_url', request.nextUrl.pathname + request.nextUrl.search);
          return NextResponse.redirect(signIn);
        }
      }
    })
  : function middleware(request: NextRequest) {
      const forced = redirectBareLocalToLiveClerkHost(request);
      if (forced) return forced;
      return NextResponse.next();
    };

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
