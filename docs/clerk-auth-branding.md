# Clerk auth branding (Lugemi)

Clerk is used for **authentication only**. Product onboarding (Creative vs Agents, personalization, persona, plan) lives at `/onboarding` and is Lugemi UI.

## Redirect flow

1. `/sign-up` or `/sign-in` — Lugemi-branded shell wrapping Clerk `<SignUp />` / `<SignIn />`.
2. On success, Clerk redirects to `/onboarding` (`forceRedirectUrl` / `fallbackRedirectUrl` via `afterClerkAuthPath()`).
3. `/onboarding` loads local draft (`lugemi.onboarding.v1`) and `GET /v1/onboarding`.
   - If `completed` (local or API) → Creative (`/creative`) or Agents (`/chat`).
   - Otherwise → multi-step Lugemi wizard.
4. Local/dev skip: `NEXT_PUBLIC_SKIP_ONBOARDING=1` or `/onboarding?skipOnboarding=1` (also used by `/dev-login`).

Env mirrors (optional, for Clerk dashboard defaults):

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`

## Appearance

`apps/web/lib/clerk-appearance.ts` applies Lugemi teal (`#00b8ae` / `#007c78`) and navy (`#10264d`) to Clerk widgets. The Auth shell (`components/auth/auth-shell.tsx`) owns brand mark, headline, and setup-step chrome so the first viewport reads as Lugemi, not a bare Clerk card.

Programmatic `useSignUp` / custom email-password forms are not used on production sign-up; `/dev-login` already uses `useSignIn` for ticket/password local review.

## Watermark / “Development mode” badge

| Surface | Removable from Lugemi code? | How to clear |
| --- | --- | --- |
| Clerk **development instance** “Development mode” badge | **No** | Use a **production** Clerk instance (`pk_live_` / `sk_live_`) for public deployments. |
| “Secured by Clerk” / Clerk logo in component footer | **Not via `appearance` alone on free/dev** | Clerk Dashboard → Customization → Branding. Removing Clerk branding requires a **paid Clerk plan** on a production instance. |
| Lugemi AuthShell / onboarding wizard chrome | Yes | Fully Lugemi-owned CSS. |

Application theming (`appearance`, localization, AuthShell) cannot suppress Clerk’s development watermark. That badge is an instance/plan limitation, not a missing Lugemi prop.
