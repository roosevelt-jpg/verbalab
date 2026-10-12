import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import {
  ONBOARDING_STATUS_COOKIE,
  PLATFORM_ADMIN_COOKIE,
  isPlatformAdminFromCookie,
  shouldForceOnboardingFromCookie,
} from '@/lib/onboarding-status';
import { LUGEMI_SESSION_COOKIE } from '@/lib/auth/config';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/post-auth(.*)',
  '/setup(.*)',
  '/dev-login(.*)',
  '/api/dev-login(.*)',
  '/api/auth(.*)',
  '/api/cms(.*)',
  '/api/demo(.*)',
  '/api/support(.*)',
  '/api/openapi(.*)',
  '/api/language-coverage(.*)',
  '/brand(.*)',
  '/embed(.*)',
  '/docs(.*)',
  '/pricing(.*)',
  '/playground(.*)',
  '/coverage(.*)',
  '/baobab(.*)',
  '/models(.*)',
  '/developers(.*)',
  '/support(.*)',
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
  '/sso-callback(.*)',
  '/post-auth(.*)',
  '/setup(.*)',
  '/dev-login(.*)',
  '/onboarding(.*)',
  '/admin(.*)',
]);

const firebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
);
const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function applyOnboardingGate(request: NextRequest, userId: string | null) {
  const isAdmin = isPlatformAdminFromCookie(
    request.cookies.get(PLATFORM_ADMIN_COOKIE)?.value,
  );

  if (
    userId &&
    !isAdmin &&
    !isBypassOnboardingGate(request) &&
    shouldForceOnboardingFromCookie(request.cookies.get(ONBOARDING_STATUS_COOKIE)?.value)
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }
  return null;
}

function firebaseMiddleware(request: NextRequest) {
  const session = request.cookies.get(LUGEMI_SESSION_COOKIE)?.value;
  const userId = session ? 'firebase' : null;

  if (!isPublicRoute(request)) {
    if (!session) {
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

  return applyOnboardingGate(request, userId) ?? NextResponse.next();
}

/**
 * Prefer Firebase middleware when configured — no Clerk edge handshake.
 * Clerk remains only when Firebase public config is absent.
 */
export default firebaseConfigured
  ? firebaseMiddleware
  : clerkConfigured
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

        return applyOnboardingGate(request, userId) ?? NextResponse.next();
      })
    : function middleware(_request: NextRequest) {
        return NextResponse.next();
      };

export const config = {
  matcher: [
    '/((?!_next|health(?:/.*)?$|brand(?:/.*)?$|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|webm|mp4|mov)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
