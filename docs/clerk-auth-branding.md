# Clerk auth branding (Lugemi)

Clerk is used for **authentication only**. Product onboarding (Creative vs Agents, personalization, persona, plan) lives at `/onboarding` and is Lugemi UI.

## End-to-end flow

1. Marketing CTA (`Sign up` / `Start free`) → `/sign-up`.
2. `/sign-up` or `/sign-in` — Lugemi AuthShell (brand hero + teal/navy card) wrapping Clerk `<SignUp />` / `<SignIn />` (email / Google).
3. On success, Clerk redirects to `/onboarding` (`forceRedirectUrl` / `fallbackRedirectUrl` via `afterClerkAuthPath()`).
4. `/onboarding` multi-step wizard:
   - Platform (LugemiCreative vs LugemiAgents)
   - Personalize
   - Persona
   - Plan (Free / Pro / Business / Enterprise)
5. Destination: `/creative` or `/chat` (Agents). Returning users with `completed` (localStorage or `GET /v1/onboarding`) skip the wizard.
6. Middleware:
   - Unauthenticated product routes → `/sign-in` (onboarding without session → `/sign-up`).
   - Cookie `lugemi_onboarding=pending` → force `/onboarding` until setup finishes (`done`).
7. Product layouts (`/creative`, `/chat`, `/dashboard`) also resume incomplete drafts via `OnboardingResumeGate`.

Local/dev skip: `NEXT_PUBLIC_SKIP_ONBOARDING=1` or `/onboarding?skipOnboarding=1` (also used by `/dev-login`).

Env mirrors (optional, for Clerk dashboard defaults):

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`

## Appearance

`apps/web/lib/clerk-appearance.ts` applies Lugemi teal (`#00b8ae` / `#007c78`) and navy (`#10264d`) plus Noto Sans to Clerk widgets. AuthShell owns the Lugemi brand name, headline, and setup-step chrome; Clerk logo/titles are hidden so the first viewport is not a bare auth widget.

Programmatic `useSignUp` / custom email-password forms are not used on production sign-up; `/dev-login` already uses `useSignIn` for ticket/password local review.

## Watermark / “Development mode” badge

| Surface | Removable from Lugemi code? | How to clear |
| --- | --- | --- |
| Clerk **development instance** “Development mode” badge | **No** | Use a **production** Clerk instance (`pk_live_` / `sk_live_`) for public deployments. |
| “Secured by Clerk” / Clerk watermark & logo in component footer | **Not via `appearance` alone on free/dev** | Clerk Dashboard → Customization → Branding. Removing Clerk branding requires a **paid Clerk plan** on a production instance. |
| Lugemi AuthShell / onboarding wizard chrome | Yes | Fully Lugemi-owned CSS. |

Application theming (`appearance`, localization, AuthShell) cannot suppress Clerk’s development watermark. That badge is an instance/plan limitation, not a missing Lugemi prop. Do not claim unpaid Clerk badges were removed from the product. Clerk watermark limits and branded styling boundaries are documented here for engineering reference.
