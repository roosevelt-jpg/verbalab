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
  '/health(.*)',
  '/p(.*)',
]);

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default clerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        await auth.protect();
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
