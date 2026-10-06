import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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
]);

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default clerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        const { userId } = await auth();
        if (!userId) {
          const signIn = new URL('/sign-in', request.url);
          signIn.searchParams.set('redirect_url', request.nextUrl.pathname + request.nextUrl.search);
          return NextResponse.redirect(signIn);
        }
      }
    })
  : function middleware() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
