import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import {
  ONBOARDING_STATUS_COOKIE,
  shouldForceOnboardingFromCookie,
} from '@/lib/onboarding-status';

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
  '/p/(.*)',
  '/enterprise',
  '/organizations',
  '/record(.*)',
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);
const isBypassOnboardingGate = createRouteMatcher([
  '/api(.*)',
  '/__clerk(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/setup(.*)',
  '/dev-login(.*)',
  '/onboarding(.*)',
]);

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Do not 307 bare 127.0.0.1/localhost → local.lugemi.com.
 * That hostname only works inside the agent VM (/etc/hosts + HTTPS :443 proxy).
 * Without Fly DNS, users must keep using http://127.0.0.1:43125 (or Cursor preview).
 * Live-key login on loopback uses /dev-login → Clerk hosted ticket URL instead.
 */
export default clerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      const { userId } = await auth();

      if (!isPublicRoute(request)) {
        if (!userId) {
          if (isOnboardingRoute(request)) {
            return NextResponse.redirect(new URL('/sign-up', request.url));
          }
          const signIn = new URL('/sign-in', request.url);
          signIn.searchParams.set(
            'redirect_url',
            request.nextUrl.pathname + request.nextUrl.search,
          );
          return NextResponse.redirect(signIn);
        }
      }

      // Post-auth: incomplete Lugemi setup cannot enter product routes.
      if (
        userId &&
        !isBypassOnboardingGate(request) &&
        shouldForceOnboardingFromCookie(
          request.cookies.get(ONBOARDING_STATUS_COOKIE)?.value,
        )
      ) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    })
  : function middleware(_request: NextRequest) {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
